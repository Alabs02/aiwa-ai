import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { generateText, createGateway } from "ai";

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY
});

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    const body = await request.json();
    const { prompt, context, projectType } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const enhancementPrompt = `You are an expert prompt engineer specializing in code generation and web development. Your task is to transform a user's rough idea into a detailed, actionable prompt that will generate high-quality code.

Original prompt:
"""
${prompt}
"""

${
  context
    ? `Additional context from user:
"""
${context}
"""`
    : ""
}

${projectType ? `Project type: ${projectType}` : ""}

Create an enhanced version of this prompt that:
1. Clarifies ambiguities with reasonable assumptions
2. Adds specific technical details (frameworks, styling, patterns)
3. Defines clear functionality and features
4. Specifies UI/UX requirements
5. Maintains the user's original intent and vision

Guidelines:
- Be specific about tech stack (React, TypeScript, Tailwind CSS, shadcn/ui, etc.)
- Include design specifications (colors, layout, responsive behavior)
- Define user interactions and state management
- Specify data structures if relevant
- Add accessibility considerations
- Keep it focused and actionable

Return ONLY the enhanced prompt text, no explanations or metadata.`;

    const { text } = await generateText({
      model: gateway("google/gemini-2.0-flash"),
      prompt: enhancementPrompt,
      temperature: 0.7,
      maxOutputTokens: 2000
    });

    return NextResponse.json({
      enhancedPrompt: text.trim()
    });
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    return NextResponse.json(
      {
        error: "Failed to enhance prompt",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
