import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  generateText,
  generateObject,
  streamText,
  streamObject,
  createGateway,
  experimental_generateImage as generateImage,
  experimental_generateSpeech as generateSpeech,
  experimental_transcribe as transcribe
} from "ai";
import { getProjectEnvVarsForProxy } from "@/lib/db/queries";

function parsePrimitive(desc: string): z.ZodTypeAny {
  let s = desc.trim();
  const opt = s.endsWith("?");
  if (opt) s = s.slice(0, -1);
  if (s === "string") return opt ? z.string().optional() : z.string();
  if (s === "number") return opt ? z.number().optional() : z.number();
  if (s === "boolean") return opt ? z.boolean().optional() : z.boolean();
  if (s === "null") return opt ? z.null().optional() : z.null();
  if (s === "any") return opt ? z.any().optional() : z.any();
  if (s === "unknown") return opt ? z.unknown().optional() : z.unknown();
  if (s.startsWith("enum:")) {
    const vals = s
      .replace("enum:", "")
      .split(",")
      .map((v) => v.trim());
    const e = z.enum(vals as [string, ...string[]]);
    return opt ? e.optional() : e;
  }
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    const lit = z.literal(s.slice(1, -1));
    return opt ? lit.optional() : lit;
  }
  if (!isNaN(Number(s))) {
    const lit = z.literal(Number(s));
    return opt ? lit.optional() : lit;
  }
  const arrMatch = s.match(/^(?:\((.*)\)|(.*))\[\]$/);
  if (arrMatch) {
    const inner = (arrMatch[1] || arrMatch[2]).trim();
    const schema = z.array(parsePrimitive(inner));
    return opt ? schema.optional() : schema;
  }
  if (s.includes("|")) {
    const parts = s
      .split("|")
      .map((p) => p.trim())
      .filter(Boolean)
      .map(parsePrimitive);
    const u = z.union(parts as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]);
    return opt ? u.optional() : u;
  }
  return opt ? z.string().optional() : z.string();
}

function toZod(def: any): z.ZodTypeAny {
  if (typeof def === "string") return parsePrimitive(def);
  if (def === null) return z.null();
  if (Array.isArray(def)) {
    if (def.length === 1) return z.array(toZod(def[0]));
    if (def.every((d) => typeof d === "object" && !Array.isArray(d))) {
      const members = def.map(toZod);
      if (members.length < 2) return members[0];
      return z.union(
        members as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]
      );
    }
    const members = def.map(toZod);
    return z.union(members as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]);
  }
  if (typeof def === "object") {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const k in def) shape[k] = toZod(def[k]);
    return z.object(shape);
  }
  return z.any();
}

const DEFAULT_MODEL = "google/gemini-2.0-flash";
const DEFAULT_MODELS = [
  "google/gemini-2.0-flash",
  "openai/gpt-5",
  "anthropic/claude-3.7-sonnet",
  "xai/grok-beta",
  "mistral/mistral-large"
];
const DEFAULT_PROVIDER_OPTIONS = {
  gateway: {
    order: ["google", "openai", "anthropic", "xai", "mistral"],
    models: DEFAULT_MODELS
  }
};

// CORS headers helper - allows all origins
function getCorsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400" // 24 hours
  };
}

// Handle OPTIONS preflight request
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: getCorsHeaders(origin)
    }
  );
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const body = await request.json();
    const projectId: string | undefined = body.projectId;
    const method: string = body.method ?? "generateText";
    const options: any = body.options ?? {};
    if (!projectId || !options) {
      return NextResponse.json(
        { error: "Missing projectId or options" },
        { status: 400, headers: corsHeaders }
      );
    }
    const envVars = await getProjectEnvVarsForProxy({ v0ProjectId: projectId });
    const apiKey =
      envVars?.find((v: any) => v?.key === "AI_GATEWAY_API_KEY")?.value ??
      process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI_GATEWAY_API_KEY not configured" },
        { status: 500, headers: corsHeaders }
      );
    }
    const gateway = createGateway({ apiKey });
    if (!options.providerOptions) options.providerOptions = {};
    if (!options.providerOptions.gateway)
      options.providerOptions.gateway = DEFAULT_PROVIDER_OPTIONS.gateway;
    if (!options.model) options.model = gateway(DEFAULT_MODEL);
    if (
      (method === "generateObject" || method === "streamObject") &&
      !options.schema &&
      options.schemaDefinition
    ) {
      options.schema = toZod(options.schemaDefinition);
      delete options.schemaDefinition;
    }
    if (
      (method === "generateObject" || method === "streamObject") &&
      !options.schema
    ) {
      return NextResponse.json(
        { error: "Missing required schema for object generation/streaming" },
        { status: 400, headers: corsHeaders }
      );
    }
    const fallbackModels: string[] =
      options.providerOptions?.gateway?.models &&
      Array.isArray(options.providerOptions.gateway.models)
        ? options.providerOptions.gateway.models
        : DEFAULT_MODELS;
    const requestedModelId =
      typeof options.model === "string"
        ? options.model
        : typeof options.model === "function"
          ? undefined
          : undefined;
    const modelsToTry: string[] = [
      ...(requestedModelId ? [requestedModelId] : []),
      ...fallbackModels
    ];
    let lastError: any = null;
    for (const modelId of modelsToTry) {
      try {
        const model = typeof modelId === "string" ? gateway(modelId) : modelId;
        const requestOptions = {
          ...options,
          model,
          providerOptions: options.providerOptions
        };
        switch (method) {
          case "generateText": {
            const result = await generateText(requestOptions);
            return NextResponse.json(result, { headers: corsHeaders });
          }
          case "generateObject": {
            const result = await generateObject(requestOptions);
            return NextResponse.json(result, { headers: corsHeaders });
          }
          case "streamText": {
            const streamResult = await streamText(requestOptions);
            if ((streamResult as any).toTextStreamResponse) {
              const response = (streamResult as any).toTextStreamResponse();
              // Add CORS headers to streaming response
              Object.entries(corsHeaders).forEach(([key, value]) => {
                response.headers.set(key, value);
              });
              return response;
            }
            if ((streamResult as any).toUIMessageStreamResponse) {
              const response = (
                streamResult as any
              ).toUIMessageStreamResponse();
              Object.entries(corsHeaders).forEach(([key, value]) => {
                response.headers.set(key, value);
              });
              return response;
            }
            const asyncIter: AsyncIterable<string> = (streamResult as any)
              .textStream;
            const rs = new ReadableStream({
              async start(controller) {
                try {
                  for await (const chunk of asyncIter)
                    controller.enqueue(new TextEncoder().encode(chunk));
                  controller.close();
                } catch (err) {
                  controller.error(err);
                }
              }
            });
            return new Response(rs, {
              headers: {
                "Content-Type": "text/plain; charset=utf-8",
                ...corsHeaders
              }
            });
          }
          case "streamObject": {
            const streamResult = await streamObject(requestOptions);
            if ((streamResult as any).toTextStreamResponse) {
              const response = (streamResult as any).toTextStreamResponse();
              Object.entries(corsHeaders).forEach(([key, value]) => {
                response.headers.set(key, value);
              });
              return response;
            }
            if ((streamResult as any).toUIMessageStreamResponse) {
              const response = (
                streamResult as any
              ).toUIMessageStreamResponse();
              Object.entries(corsHeaders).forEach(([key, value]) => {
                response.headers.set(key, value);
              });
              return response;
            }
            const asyncIter: AsyncIterable<any> =
              (streamResult as any).partialObjectStream ??
              (streamResult as any).elementStream;
            const rs = new ReadableStream({
              async start(controller) {
                try {
                  for await (const part of asyncIter)
                    controller.enqueue(
                      new TextEncoder().encode(JSON.stringify(part) + "\n")
                    );
                  controller.close();
                } catch (err) {
                  controller.error(err);
                }
              }
            });
            return new Response(rs, {
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                ...corsHeaders
              }
            });
          }
          case "generateImage": {
            const result = await generateImage(requestOptions);
            // Handle both single image and multiple images
            const responseData = result.images
              ? {
                  images: result.images.map((img: any) => ({
                    base64: img.base64,
                    uint8Array: Array.from(img.uint8Array), // Convert to array for JSON serialization
                    mediaType: img.mediaType || "image/png"
                  })),
                  warnings: result.warnings,
                  providerMetadata: result.providerMetadata
                }
              : {
                  image: {
                    base64: result.image.base64,
                    uint8Array: Array.from(result.image.uint8Array),
                    mediaType: result.image.mediaType || "image/png"
                  },
                  warnings: result.warnings,
                  providerMetadata: result.providerMetadata
                };
            return NextResponse.json(responseData, { headers: corsHeaders });
          }
          case "generateSpeech": {
            const result = await generateSpeech(requestOptions);
            const responseData = {
              audio: {
                base64: result.audio.base64,
                uint8Array: Array.from(result.audio.uint8Array), // Convert Uint8Array to array for JSON serialization
                mediaType: result.audio.mediaType,
                format: result.audio.format
              },
              warnings: result.warnings,
              responses: result.responses,
              providerMetadata: result.providerMetadata
            };
            return NextResponse.json(responseData, { headers: corsHeaders });
          }
          case "transcribe": {
            // Handle audio input - can be base64 string, Uint8Array, or URL
            let audioInput = options.audio;
            if (
              typeof audioInput === "string" &&
              audioInput.startsWith("data:")
            ) {
              // If it's a base64 data URL, extract the base64 part
              const base64Data = audioInput.split(",")[1];
              audioInput = Buffer.from(base64Data, "base64");
            } else if (Array.isArray(audioInput)) {
              // If it's an array (from JSON serialization), convert to Uint8Array
              audioInput = new Uint8Array(audioInput);
            }
            const result = await transcribe({
              ...requestOptions,
              audio: audioInput
            });
            const responseData = {
              text: result.text,
              segments: result.segments,
              language: result.language,
              durationInSeconds: result.durationInSeconds,
              warnings: result.warnings,
              responses: result.responses,
              providerMetadata: result.providerMetadata
            };
            return NextResponse.json(responseData, { headers: corsHeaders });
          }
          default:
            return NextResponse.json(
              { error: "Invalid method" },
              { status: 400, headers: corsHeaders }
            );
        }
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    throw lastError;
  } catch (error: any) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI request failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}
