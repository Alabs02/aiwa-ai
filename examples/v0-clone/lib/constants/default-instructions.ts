export const PROJECT_ID_PLACEHOLDER = "{{PROJECT_ID}}";

export const AIWA_CLOUD_DOCS = `# AIWA Cloud - AI Gateway Documentation

AIWA Cloud provides serverless AI capabilities with automatic fallbacks across multiple providers (Google Gemini, OpenAI, Anthropic, xAI, Mistral).

## Quick Start

All AI requests go through AIWA's proxy with your project ID:

\`\`\`typescript
const response = await fetch('https://aiwa-v0-sdk.vercel.app/api/ai-proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: \`${PROJECT_ID_PLACEHOLDER}\`,
    method: 'generateText',
    options: { prompt: 'Your prompt here' }
  })
});

const result = await response.json();
\`\`\`

## API Reference

### Endpoint
\`POST https://aiwa-v0-sdk.vercel.app/api/ai-proxy\`

### Request Body
\`\`\`typescript
{
  projectId: string;           // Required: Your project identifier
  method: string;              // Required: 'generateText' | 'generateObject' | 'streamText' | 'streamObject'
  options: {                   // Required: Vercel AI SDK options
    prompt: string;            // Required for text generation
    schema?: ZodSchema;        // Required for generateObject/streamObject (server-side only)
    system?: string;           // Optional: System prompt
    messages?: Array<Message>; // Optional: Chat messages
    maxTokens?: number;        // Optional: Max response tokens
    temperature?: number;      // Optional: 0-2, controls randomness
  }
}
\`\`\`

**CRITICAL:** Zod schemas cannot be serialized. Always define schemas server-side in API routes, never pass from client.

## Method: generateText

\`\`\`typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { message } = await req.json();
  
  const response = await fetch('https://aiwa-v0-sdk.vercel.app/api/ai-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: \`${PROJECT_ID_PLACEHOLDER}\`,
      method: 'generateText',
      options: {
        prompt: message,
        system: 'You are a helpful assistant',
        maxTokens: 1000,
        temperature: 0.7
      }
    })
  });
  
  const result = await response.json();
  return Response.json({ text: result.text });
}
\`\`\`

## Method: generateObject

**Important:** Define schemas in your API route, not client-side.

\`\`\`typescript
import { z } from 'zod';

// app/api/recipe/route.ts
export async function POST(req: Request) {
  const { dishName } = await req.json();
  
  // Define schema server-side
  const recipeSchema = z.object({
    description: z.string(),
    prepTime: z.string(),
    cookTime: z.string(),
    servings: z.number(),
    ingredients: z.array(z.string()),
    steps: z.array(z.string())
  });
  
  const response = await fetch('https://aiwa-v0-sdk.vercel.app/api/ai-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: \`${PROJECT_ID_PLACEHOLDER}\`,
      method: 'generateObject',
      options: {
        prompt: \`Generate a detailed recipe for \${dishName}\`,
        schema: recipeSchema
      }
    })
  });
  
  const result = await response.json();
  return Response.json(result.object);
}
\`\`\`

## Method: streamText

\`\`\`typescript
// app/api/generate/route.ts
export async function POST(req: Request) {
  const { prompt } = await req.json();
  
  const response = await fetch('https://aiwa-v0-sdk.vercel.app/api/ai-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: \`${PROJECT_ID_PLACEHOLDER}\`,
      method: 'streamText',
      options: { prompt }
    })
  });
  
  return response;
}
\`\`\`

## Environment Setup

\`NEXT_PUBLIC_PROJECT_ID\` is auto-added to \`.env.local\` on export:

\`\`\`
NEXT_PUBLIC_PROJECT_ID=${PROJECT_ID_PLACEHOLDER}
\`\`\`

Access in your code:
\`\`\`typescript
const projectId = \`${PROJECT_ID_PLACEHOLDER}\`;
\`\`\`

## Model Fallback Chain

1. Google Gemini 2.0 Flash (default)
2. OpenAI GPT-5
3. Anthropic Claude 3.5 Sonnet
4. xAI Grok
5. Mistral Large

---

**PROJECT ID:** \`${PROJECT_ID_PLACEHOLDER}\``;
