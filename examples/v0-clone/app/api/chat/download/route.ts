import { NextRequest, NextResponse } from "next/server";
import { createClient } from "v0-sdk";
import { auth } from "@/app/(auth)/auth";
import { getProjectEnvVars } from "@/lib/db/queries";
import AdmZip from "adm-zip";

const v0 = createClient(
  process.env.V0_API_URL ? { baseUrl: process.env.V0_API_URL } : {}
);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const versionId = searchParams.get("versionId");
    const projectId = searchParams.get("projectId"); // Our internal param
    const format = searchParams.get("format") as "zip" | "tarball" | null;
    const includeDefaultFiles = searchParams.get("includeDefaultFiles");

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    let targetVersionId = versionId;

    if (!targetVersionId) {
      const versions = await v0.chats.findVersions({ chatId });
      if (!versions.data || versions.data.length === 0) {
        return NextResponse.json(
          { error: "No versions found for this chat" },
          { status: 404 }
        );
      }
      targetVersionId = versions.data[0].id;
    }

    // Download from v0 - only pass supported params
    const downloadBuffer = await v0.chats.downloadVersion({
      chatId,
      versionId: targetVersionId,
      format: "zip",
      ...(includeDefaultFiles && {
        includeDefaultFiles: includeDefaultFiles === "true"
      })
    });

    const zip = new AdmZip(Buffer.from(downloadBuffer as ArrayBuffer));

    // Inject env vars if projectId provided
    if (projectId) {
      const envVars = await getProjectEnvVars({ projectId });

      if (envVars.length > 0) {
        const envLocal = envVars.map((v) => `${v.key}=${v.value}`).join("\n");
        const envExample = envVars.map((v) => `${v.key}=`).join("\n");

        zip.addFile(".env.local", Buffer.from(envLocal));
        zip.addFile(".env.example", Buffer.from(envExample));

        const gitignore = zip.getEntry(".gitignore");
        if (gitignore) {
          let content = gitignore.getData().toString("utf8");
          if (!content.includes(".env.local")) {
            content += "\n.env.local\n.env*.local\n";
            zip.updateFile(".gitignore", Buffer.from(content));
          }
        } else {
          zip.addFile(".gitignore", Buffer.from(".env.local\n.env*.local\n"));
        }
      }
    }

    const finalBuffer = zip.toBuffer();
    const extension = format === "tarball" ? "tar.gz" : "zip";
    const filename = `app-${chatId}-${targetVersionId}.${extension}`;

    return new Response(finalBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache"
      }
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      {
        error: "Failed to download chat version",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
