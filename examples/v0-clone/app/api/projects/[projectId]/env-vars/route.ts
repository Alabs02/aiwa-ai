import { NextRequest, NextResponse } from "next/server";
import { createClient } from "v0-sdk";
import { auth } from "@/app/(auth)/auth";
import {
  getProjectById,
  getProjectEnvVars,
  upsertProjectEnvVar,
  deleteProjectEnvVar
} from "@/lib/db/queries";
import { ensureProjectIdEnvVar } from "@/lib/utils/project-instructions";

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

    const v0EnvVars = await v0.projects.findEnvVars({
      projectId: project.v0_project_id,
      decrypted: true
    });

    const localEnvVars = await getProjectEnvVars({ projectId });

    const syncedVars =
      v0EnvVars.data?.map((v0Var: any) => {
        const localVar = localEnvVars.find(
          (l) => l.v0_env_var_id === v0Var.id || l.key === v0Var.key
        );
        return {
          id: localVar?.id,
          v0_env_var_id: v0Var.id,
          key: v0Var.key,
          value: v0Var.value,
          created_at: localVar?.created_at || v0Var.createdAt,
          updated_at: localVar?.updated_at || v0Var.updatedAt
        };
      }) || [];

    return NextResponse.json({ data: syncedVars });
  } catch (error) {
    console.error("Env vars GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch environment variables" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const body = await request.json();
    let { environmentVariables, upsert = true } = body;

    if (!environmentVariables || !Array.isArray(environmentVariables)) {
      return NextResponse.json(
        { error: "Invalid environment variables" },
        { status: 400 }
      );
    }

    // Filter out NEXT_PUBLIC_PROJECT_ID if user tries to add it
    const filteredVars = environmentVariables.filter(
      (v: any) => v.key !== "NEXT_PUBLIC_PROJECT_ID"
    );

    // Ensure PROJECT_ID is always correct
    const envVarsWithProjectId = ensureProjectIdEnvVar(
      filteredVars,
      project.id
    );

    const v0Response = await v0.projects.createEnvVars({
      projectId: project.v0_project_id,
      environmentVariables: envVarsWithProjectId,
      upsert
    });

    const createdVars = [];
    for (let i = 0; i < envVarsWithProjectId.length; i++) {
      const envVar = envVarsWithProjectId[i];
      const v0Var = v0Response.data[i];

      const localVar = await upsertProjectEnvVar({
        projectId: project.id,
        key: envVar.key,
        value: envVar.value,
        v0EnvVarId: v0Var?.id
      });

      createdVars.push(localVar);
    }

    return NextResponse.json({ data: createdVars });
  } catch (error) {
    console.error("Env vars POST error:", error);
    return NextResponse.json(
      { error: "Failed to create environment variables" },
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

    const body = await request.json();
    let { environmentVariables } = body;

    if (!environmentVariables || !Array.isArray(environmentVariables)) {
      return NextResponse.json(
        { error: "Invalid environment variables" },
        { status: 400 }
      );
    }

    // Prevent user from changing NEXT_PUBLIC_PROJECT_ID
    environmentVariables = environmentVariables.map((v: any) => {
      if (v.key === "NEXT_PUBLIC_PROJECT_ID") {
        return { ...v, value: project.id };
      }
      return v;
    });

    // Ensure PROJECT_ID exists with correct value
    const envVarsWithProjectId: any[] = ensureProjectIdEnvVar(
      environmentVariables,
      project.id
    );

    // Separate existing from new
    const existingVars = envVarsWithProjectId.filter(
      (v: any) => v.v0_env_var_id
    );
    const newVars: any[] = envVarsWithProjectId.filter(
      (v: any) => !v.v0_env_var_id
    );

    // Update existing in v0
    if (existingVars.length > 0) {
      await v0.projects.updateEnvVars({
        projectId: project.v0_project_id,
        environmentVariables: existingVars.map((v: any) => ({
          id: v.v0_env_var_id,
          value: v.value
        }))
      });
    }

    // Create new in v0
    if (newVars.length > 0) {
      const v0Response = await v0.projects.createEnvVars({
        projectId: project.v0_project_id,
        environmentVariables: newVars.map((v: any) => ({
          key: v.key,
          value: v.value
        })),
        upsert: true
      });

      for (let i = 0; i < newVars.length; i++) {
        newVars[i].v0_env_var_id = v0Response.data[i]?.id;
      }
    }

    // Update all in local DB
    const updatedVars = [];
    for (const envVar of envVarsWithProjectId) {
      const v0EnvVarId =
        (envVar as any).v0_env_var_id ||
        newVars.find((v: any) => v.key === envVar.key)?.v0_env_var_id;

      const localVar = await upsertProjectEnvVar({
        projectId: project.id,
        key: envVar.key,
        value: envVar.value,
        v0EnvVarId: v0EnvVarId ?? undefined
      });

      updatedVars.push(localVar);
    }

    return NextResponse.json({ data: updatedVars });
  } catch (error) {
    console.error("Env vars PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update environment variables" },
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

    const { environmentVariableIds } = await request.json();

    if (!environmentVariableIds || !Array.isArray(environmentVariableIds)) {
      return NextResponse.json(
        { error: "Invalid environment variable IDs" },
        { status: 400 }
      );
    }

    const localVars = await getProjectEnvVars({ projectId: project.id });

    // Prevent deletion of NEXT_PUBLIC_PROJECT_ID
    const varsToDelete = localVars.filter(
      (v) =>
        environmentVariableIds.includes(v.id) &&
        v.key !== "NEXT_PUBLIC_PROJECT_ID"
    );

    if (varsToDelete.length < environmentVariableIds.length) {
      return NextResponse.json(
        { error: "Cannot delete NEXT_PUBLIC_PROJECT_ID" },
        { status: 400 }
      );
    }

    const v0Ids = varsToDelete
      .filter((v) => v.v0_env_var_id)
      .map((v) => v.v0_env_var_id!);

    if (v0Ids.length > 0) {
      await v0.projects.deleteEnvVars({
        projectId: project.v0_project_id,
        environmentVariableIds: v0Ids
      });
    }

    for (const envVar of varsToDelete) {
      await deleteProjectEnvVar({ envVarId: envVar.id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Env vars DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete environment variables" },
      { status: 500 }
    );
  }
}
