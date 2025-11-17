import { NextRequest, NextResponse } from "next/server";
import { createClient } from "v0-sdk";
import { auth } from "@/app/(auth)/auth";
import {
  createProject,
  getProjectsByUserId,
  getProjectEnvVars,
  createProjectEnvVar
} from "@/lib/db/queries";
import {
  ensureAIWAInstructions,
  ensureProjectIdEnvVar
} from "@/lib/utils/project-instructions";

const v0 = createClient(
  process.env.V0_API_URL ? { baseUrl: process.env.V0_API_URL } : {}
);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await getProjectsByUserId({ userId: session.user.id });

    if (projects.length === 0) {
      const userName = session.user.email?.split("@")[0] || "User";
      const defaultName = `${userName.charAt(0).toUpperCase() + userName.slice(1)}'s Workspace`;

      const v0Project = await v0.projects.create({
        name: defaultName,
        privacy: "private"
      });

      // Inject AIWA docs with project ID
      const instructions = ensureAIWAInstructions(null, v0Project.id);

      // Update v0 project with instructions
      await v0.projects.update({
        projectId: v0Project.id,
        instructions
      });

      const newProject = await createProject({
        userId: session.user.id,
        v0ProjectId: v0Project.id,
        name: defaultName,
        privacy: "private",
        instructions
      });

      // Ensure NEXT_PUBLIC_PROJECT_ID env var exists
      await createProjectEnvVar({
        projectId: newProject.id,
        key: "NEXT_PUBLIC_PROJECT_ID",
        value: newProject.id
      });

      // Sync with v0
      await v0.projects.createEnvVars({
        projectId: v0Project.id,
        environmentVariables: [
          { key: "NEXT_PUBLIC_PROJECT_ID", value: newProject.id }
        ]
      });

      return NextResponse.json({ data: [newProject] });
    }

    return NextResponse.json({ data: projects });
  } catch (error) {
    console.error("Projects GET error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch projects",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      icon,
      instructions: userInstructions,
      privacy,
      vercelProjectId,
      environmentVariables
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Create v0 project first to get the ID
    const v0Project = await v0.projects.create({
      name,
      ...(description && { description }),
      ...(icon && { icon }),
      ...(privacy && { privacy }),
      ...(vercelProjectId && { vercelProjectId })
    });

    // Inject AIWA docs with the v0 project ID
    const instructions = ensureAIWAInstructions(userInstructions, v0Project.id);

    // Update v0 project with processed instructions
    await v0.projects.update({
      projectId: v0Project.id,
      instructions
    });

    // Create local project
    const project = await createProject({
      userId: session.user.id,
      v0ProjectId: v0Project.id,
      name,
      description,
      icon,
      instructions,
      privacy: privacy || "private",
      vercelProjectId
    });

    // Ensure NEXT_PUBLIC_PROJECT_ID is in env vars
    const envVarsWithProjectId = ensureProjectIdEnvVar(
      environmentVariables || [],
      project.id
    );

    // Create env vars in v0 and locally
    if (envVarsWithProjectId.length > 0) {
      const v0EnvResponse = await v0.projects.createEnvVars({
        projectId: v0Project.id,
        environmentVariables: envVarsWithProjectId
      });

      for (let i = 0; i < envVarsWithProjectId.length; i++) {
        const envVar = envVarsWithProjectId[i];
        const v0EnvVar = v0EnvResponse.data[i];

        await createProjectEnvVar({
          projectId: project.id,
          v0EnvVarId: v0EnvVar?.id,
          key: envVar.key,
          value: envVar.value
        });
      }
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Projects POST error:", error);
    return NextResponse.json(
      {
        error: "Failed to create project",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
