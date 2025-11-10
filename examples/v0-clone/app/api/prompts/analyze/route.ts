import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { generateText, createGateway } from "ai";

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY
});

export const runtime = "nodejs";
export const maxDuration = 30;

const QUALITY_THRESHOLDS = {
  excellent: 0.8,
  good: 0.6,
  fair: 0.4,
  weak: 0
};

type QualityScore = "excellent" | "good" | "fair" | "weak";

interface PromptAnalysis {
  qualityScore: QualityScore;
  clarity: number;
  specificity: number;
  completeness: number;
  actionability: number;
  overallScore: number;
  feedback: string[];
  suggestions: string[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Allow anonymous users but track for rate limiting
    const userId = session?.user?.id || "anonymous";

    const body = await request.json();
    const { prompt } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Basic length check
    if (prompt.trim().length < 10) {
      return NextResponse.json<PromptAnalysis>({
        qualityScore: "weak",
        clarity: 0.2,
        specificity: 0.2,
        completeness: 0.2,
        actionability: 0.2,
        overallScore: 0.2,
        feedback: [
          "Your prompt is too short. Aim for at least 20-30 words to provide sufficient context."
        ],
        suggestions: [
          "Describe what you want to build in more detail",
          "Include specific features or functionality",
          "Mention any design preferences or constraints"
        ]
      });
    }

    // Use AI to analyze the prompt
    const analysisPrompt = `You are an expert at analyzing and evaluating prompts for AI code generation tools. Analyze the following prompt and provide a detailed assessment.

Prompt to analyze:
"""
${prompt}
"""

Evaluate the prompt on these criteria (score each 0-1):
1. Clarity: Is it clear what the user wants? Are there ambiguities?
2. Specificity: Does it include specific details about features, design, or functionality?
3. Completeness: Does it cover all necessary aspects for building the application?
4. Actionability: Can a code generation system immediately act on this prompt?

Provide your analysis in this exact JSON format:
{
  "clarity": <number between 0 and 1>,
  "specificity": <number between 0 and 1>,
  "completeness": <number between 0 and 1>,
  "actionability": <number between 0 and 1>,
  "feedback": ["<specific feedback point 1>", "<specific feedback point 2>", ...],
  "suggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>", ...]
}

Be constructive and specific. Focus on what would make the prompt better for code generation.`;

    const { text } = await generateText({
      model: gateway("google/gemini-2.0-flash"),
      prompt: analysisPrompt,
      temperature: 0.3
    });

    // Parse the response
    let analysisData;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return NextResponse.json(
        { error: "Failed to analyze prompt" },
        { status: 500 }
      );
    }

    // Calculate overall score
    const overallScore =
      (analysisData.clarity +
        analysisData.specificity +
        analysisData.completeness +
        analysisData.actionability) /
      4;

    // Determine quality level
    let qualityScore: QualityScore = "weak";
    if (overallScore >= QUALITY_THRESHOLDS.excellent) {
      qualityScore = "excellent";
    } else if (overallScore >= QUALITY_THRESHOLDS.good) {
      qualityScore = "good";
    } else if (overallScore >= QUALITY_THRESHOLDS.fair) {
      qualityScore = "fair";
    }

    const analysis: PromptAnalysis = {
      qualityScore,
      clarity: analysisData.clarity,
      specificity: analysisData.specificity,
      completeness: analysisData.completeness,
      actionability: analysisData.actionability,
      overallScore,
      feedback: analysisData.feedback || [],
      suggestions: analysisData.suggestions || []
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Error analyzing prompt:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze prompt",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
