import {
  AIWA_CLOUD_DOCS,
  PROJECT_ID_PLACEHOLDER
} from "@/lib/constants/default-instructions";

/**
 * Ensures AIWA Cloud documentation is present in project instructions
 * with the correct project ID injected
 */
export function ensureAIWAInstructions(
  existingInstructions: string | null | undefined,
  projectId: string
): string {
  const instructions = existingInstructions || "";
  const hasAIWADocs = instructions.includes("AIWA Cloud");
  const hasProjectId = instructions.includes(projectId);

  // If both AIWA docs and project ID are present, return as-is
  if (hasAIWADocs && hasProjectId) {
    return instructions;
  }

  // Generate docs with project ID
  const docsWithId = AIWA_CLOUD_DOCS.replace(
    new RegExp(PROJECT_ID_PLACEHOLDER.replace(/[{}]/g, "\\$&"), "g"),
    projectId
  );

  // If no existing instructions, return docs
  if (!instructions.trim()) {
    return docsWithId;
  }

  // If AIWA docs exist but wrong project ID, replace entire AIWA section
  if (hasAIWADocs && !hasProjectId) {
    const aiwaStartRegex = /# AIWA Cloud - AI Gateway Documentation/;
    const match = instructions.match(aiwaStartRegex);

    if (match && match.index !== undefined) {
      // Find end of AIWA docs section
      const afterAIWA = instructions.substring(match.index);
      const nextHeadingMatch = afterAIWA.substring(1).match(/\n# [^#]/);

      let endIndex: number;
      if (nextHeadingMatch && nextHeadingMatch.index !== undefined) {
        endIndex = match.index + nextHeadingMatch.index + 1;
      } else {
        // Check for separator or end of string
        const separatorMatch = afterAIWA.match(/\n---\n/);
        endIndex = separatorMatch
          ? match.index + (separatorMatch.index || 0) + 5
          : instructions.length;
      }

      const beforeAIWA = instructions.substring(0, match.index).trim();
      const afterAIWASection = instructions.substring(endIndex).trim();

      if (beforeAIWA && afterAIWASection) {
        return `${beforeAIWA}\n\n${docsWithId}\n\n${afterAIWASection}`;
      } else if (beforeAIWA) {
        return `${beforeAIWA}\n\n${docsWithId}`;
      } else if (afterAIWASection) {
        return `${docsWithId}\n\n${afterAIWASection}`;
      }
    }
  }

  // Append AIWA docs to existing custom instructions
  return `${instructions}\n\n${docsWithId}`;
}

/**
 * Validates that a project ID env var matches the actual project ID
 */
export function validateProjectIdEnvVar(
  envVars: Array<{ key: string; value: string }>,
  projectId: string
): boolean {
  const projectIdVar = envVars.find((v) => v.key === "NEXT_PUBLIC_PROJECT_ID");
  return !projectIdVar || projectIdVar.value === projectId;
}

/**
 * Ensures NEXT_PUBLIC_PROJECT_ID env var is present and correct
 */
export function ensureProjectIdEnvVar(
  envVars: Array<{ key: string; value: string }>,
  projectId: string
): Array<{ key: string; value: string }> {
  const hasProjectId = envVars.some((v) => v.key === "NEXT_PUBLIC_PROJECT_ID");

  if (hasProjectId) {
    // Update if wrong value
    return envVars.map((v) =>
      v.key === "NEXT_PUBLIC_PROJECT_ID" ? { ...v, value: projectId } : v
    );
  }

  // Add if missing
  return [...envVars, { key: "NEXT_PUBLIC_PROJECT_ID", value: projectId }];
}
