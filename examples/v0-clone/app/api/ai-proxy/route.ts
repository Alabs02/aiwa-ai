import { NextRequest, NextResponse } from "next/server";
import {
  generateText,
  generateObject,
  streamText,
  streamObject,
  createGateway
} from "ai";
import { getProjectEnvVars } from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      method = "generateText", // generateText, generateObject, streamText, streamObject
      options // Full AI SDK options: { model, prompt, schema, tools, etc. }
    } = body;

    if (!projectId || !options) {
      return NextResponse.json(
        { error: "Missing projectId or options" },
        { status: 400 }
      );
    }

    // Get project env vars
    const envVars = await getProjectEnvVars({ projectId });
    const gatewayKey = envVars.find(
      (v) => v.key === "AI_GATEWAY_API_KEY"
    )?.value;

    if (!gatewayKey) {
      return NextResponse.json(
        { error: "AI_GATEWAY_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Create gateway with fallback chain
    const gateway = createGateway({
      apiKey: gatewayKey
    });

    // Fallback chain
    const models = [
      "google/gemini-2.0-flash-001",
      "openai/gpt-5",
      "anthropic/claude-3-5-sonnet-20250514",
      "xai/grok-beta",
      "mistral/mistral-large-latest"
    ];

    let lastError;
    for (const modelId of models) {
      try {
        const model = gateway(modelId);
        const requestOptions = { ...options, model };

        switch (method) {
          case "generateText":
            const textResult = await generateText(requestOptions);
            return NextResponse.json(textResult);

          case "generateObject":
            const objectResult = await generateObject(requestOptions);
            return NextResponse.json(objectResult);

          case "streamText":
            const textStream = await streamText(requestOptions);
            return textStream.toTextStreamResponse();

          case "streamObject":
            const objectStream = await streamObject(requestOptions);
            return objectStream.toTextStreamResponse();

          default:
            return NextResponse.json(
              { error: "Invalid method" },
              { status: 400 }
            );
        }
      } catch (error) {
        lastError = error;
        continue; // Try next model
      }
    }

    throw lastError;
  } catch (error) {
    console.error("AI proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI request failed" },
      { status: 500 }
    );
  }
}
