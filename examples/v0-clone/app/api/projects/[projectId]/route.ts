import { NextRequest, NextResponse } from "next/server";
import { createClient } from "v0-sdk";
import { auth } from "@/app/(auth)/auth";
import {
  getProjectById,
  updateProject,
  deleteProject,
  getProjectEnvVars,
  upsertProjectEnvVar
} from "@/lib/db/queries";
import {
  ensureAIWAInstructions,
  ensureProjectIdEnvVar
} from "@/lib/utils/project-instructions";

const v0 = createClient(
  process.env.V0_API_URL ? { baseUrl: process.env.V0_API_URL } : {}
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const project = await getProjectById({
      projectId,
      userId: session.user.id
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const envVars = await getProjectEnvVars({ projectId: project.id });

    return NextResponse.json({
      ...project,
      env_vars: envVars
    });
  } catch (error) {
    console.error("Project GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const project = await getProjectById({
      projectId,
      userId: session.user.id
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updates = await request.json();

    // Process instructions - ensure AIWA docs with correct project ID
    let processedInstructions = updates.instructions;
    if (updates.instructions !== undefined) {
      processedInstructions = ensureAIWAInstructions(
        updates.instructions,
        project.id
      );
    }

    // Update v0 project
    await v0.projects.update({
      projectId: project.v0_project_id,
      ...(updates.name && { name: updates.name }),
      ...(typeof updates.description === "string" && {
        description: updates.description
      }),
      ...(processedInstructions && { instructions: processedInstructions }),
      ...(updates.privacy && { privacy: updates.privacy })
    });

    // Update local project
    const updatedProject = await updateProject({
      projectId,
      userId: session.user.id,
      updates: {
        ...(updates.name && { name: updates.name }),
        ...(updates.description !== undefined && {
          description: updates.description
        }),
        ...(updates.icon !== undefined && { icon: updates.icon }),
        ...(processedInstructions && { instructions: processedInstructions }),
        ...(updates.privacy && { privacy: updates.privacy }),
        ...(updates.vercel_project_id !== undefined && {
          vercel_project_id: updates.vercel_project_id
        })
      }
    });

    // Ensure NEXT_PUBLIC_PROJECT_ID env var exists and is correct
    const envVars = await getProjectEnvVars({ projectId: project.id });
    const projectIdVar = envVars.find(
      (v) => v.key === "NEXT_PUBLIC_PROJECT_ID"
    );

    if (!projectIdVar || projectIdVar.value !== project.id) {
      // Create or update the env var
      await upsertProjectEnvVar({
        projectId: project.id,
        key: "NEXT_PUBLIC_PROJECT_ID",
        value: project.id,
        v0EnvVarId: projectIdVar?.v0_env_var_id ?? undefined
      });

      // Sync with v0
      if (projectIdVar?.v0_env_var_id) {
        await v0.projects.updateEnvVars({
          projectId: project.v0_project_id,
          environmentVariables: [
            { id: projectIdVar.v0_env_var_id, value: project.id }
          ]
        });
      } else {
        const v0Response = await v0.projects.createEnvVars({
          projectId: project.v0_project_id,
          environmentVariables: [
            { key: "NEXT_PUBLIC_PROJECT_ID", value: project.id }
          ],
          upsert: true
        });

        // Update local record with v0 ID
        if (v0Response.data[0]?.id) {
          await upsertProjectEnvVar({
            projectId: project.id,
            key: "NEXT_PUBLIC_PROJECT_ID",
            value: project.id,
            v0EnvVarId: v0Response.data[0].id
          });
        }
      }
    }

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Project PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const project = await getProjectById({
      projectId,
      userId: session.user.id
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await v0.projects.delete({ projectId: project.v0_project_id });
    await deleteProject({ projectId, userId: session.user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
