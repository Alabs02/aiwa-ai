import { NextRequest, NextResponse } from "next/server";
import { createClient } from "v0-sdk";
import { auth } from "@/app/(auth)/auth";
import {
  getUserWithGitHubToken,
  createGitHubExport,
  getChatOwnership
} from "@/lib/db/queries";

const v0 = createClient(
  process.env.V0_API_URL ? { baseUrl: process.env.V0_API_URL } : {}
);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      chatId,
      repoName,
      isPrivate = true,
      description
    } = await request.json();

    if (!chatId || !repoName) {
      return NextResponse.json(
        { error: "Chat ID and repository name are required" },
        { status: 400 }
      );
    }

    // Verify chat ownership
    const ownership = await getChatOwnership({ v0ChatId: chatId });
    if (!ownership || ownership.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to export this chat" },
        { status: 403 }
      );
    }

    // Get user with GitHub token
    const user = await getUserWithGitHubToken(session.user.id);
    if (!user?.github_access_token) {
      return NextResponse.json(
        { error: "GitHub not connected", requiresAuth: true },
        { status: 401 }
      );
    }

    // Get latest version
    const versions = await v0.chats.findVersions({ chatId });
    if (!versions.data || versions.data.length === 0) {
      return NextResponse.json(
        { error: "No versions found for this chat" },
        { status: 404 }
      );
    }

    const latestVersion = versions.data[0];

    // Get version files with content
    const versionDetails = await v0.chats.getVersion({
      chatId,
      versionId: latestVersion.id,
      includeDefaultFiles: true
    });

    if (!versionDetails.files || versionDetails.files.length === 0) {
      return NextResponse.json(
        { error: "No files found in version" },
        { status: 404 }
      );
    }

    // Get GitHub username
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${user.github_access_token}`,
        Accept: "application/vnd.github.v3+json"
      }
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Failed to get GitHub user", requiresAuth: true },
        { status: 401 }
      );
    }

    const githubUser = await userResponse.json();

    // Create repository
    const repoResponse = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.github_access_token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: repoName,
        description: description || `Exported from v0 chat ${chatId}`,
        private: isPrivate,
        auto_init: true // Creates initial commit with README
      })
    });

    if (!repoResponse.ok) {
      const errorData = await repoResponse.json();
      console.error("GitHub repo creation error:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to create repository" },
        { status: repoResponse.status }
      );
    }

    const repo = await repoResponse.json();

    // Wait a moment for repo initialization
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get the default branch SHA
    const refResponse = await fetch(
      `https://api.github.com/repos/${githubUser.login}/${repoName}/git/refs/heads/${repo.default_branch}`,
      {
        headers: {
          Authorization: `Bearer ${user.github_access_token}`,
          Accept: "application/vnd.github.v3+json"
        }
      }
    );

    const refData = await refResponse.json();
    const latestCommitSha = refData.object.sha;

    // Get the tree of the latest commit
    const commitResponse = await fetch(
      `https://api.github.com/repos/${githubUser.login}/${repoName}/git/commits/${latestCommitSha}`,
      {
        headers: {
          Authorization: `Bearer ${user.github_access_token}`,
          Accept: "application/vnd.github.v3+json"
        }
      }
    );

    const commitData = await commitResponse.json();
    const baseTreeSha = commitData.tree.sha;

    // Create blobs for all files
    const blobs = await Promise.all(
      versionDetails.files.map(async (file) => {
        const blobResponse = await fetch(
          `https://api.github.com/repos/${githubUser.login}/${repoName}/git/blobs`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${user.github_access_token}`,
              Accept: "application/vnd.github.v3+json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              content: file.content,
              encoding: "utf-8"
            })
          }
        );
        const blobData = await blobResponse.json();
        return {
          path: file.name,
          mode: "100644",
          type: "blob",
          sha: blobData.sha
        };
      })
    );

    // Create new tree
    const treeResponse = await fetch(
      `https://api.github.com/repos/${githubUser.login}/${repoName}/git/trees`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.github_access_token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: blobs
        })
      }
    );

    const treeData = await treeResponse.json();

    // Create new commit
    const newCommitResponse = await fetch(
      `https://api.github.com/repos/${githubUser.login}/${repoName}/git/commits`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.github_access_token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `Export from v0 (version ${latestVersion.id})`,
          tree: treeData.sha,
          parents: [latestCommitSha]
        })
      }
    );

    const newCommitData = await newCommitResponse.json();

    // Update reference to point to new commit
    await fetch(
      `https://api.github.com/repos/${githubUser.login}/${repoName}/git/refs/heads/${repo.default_branch}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${user.github_access_token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sha: newCommitData.sha
        })
      }
    );

    // Save export record to database
    await createGitHubExport({
      v0ChatId: chatId,
      userId: session.user.id,
      repoName,
      repoUrl: repo.html_url,
      isPrivate
    });

    return NextResponse.json({
      success: true,
      repoUrl: repo.html_url,
      repoName,
      filesExported: versionDetails.files.length
    });
  } catch (error) {
    console.error("GitHub export error:", error);
    return NextResponse.json(
      {
        error: "Failed to export to GitHub",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
