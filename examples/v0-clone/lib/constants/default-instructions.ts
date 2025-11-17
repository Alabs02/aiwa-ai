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
    schema?: ZodSchema;        // Required for generateObject/streamObject
    system?: string;           // Optional: System prompt
    messages?: Array<Message>; // Optional: Chat messages
    tools?: Record<string, Tool>; // Optional: Function calling tools
    maxTokens?: number;        // Optional: Max response tokens
    temperature?: number;      // Optional: 0-2, controls randomness
    topP?: number;            // Optional: Nucleus sampling
    maxRetries?: number;      // Optional: Retry attempts
  }
}
\`\`\`

### Response
Returns standard Vercel AI SDK response for the chosen method.

## Method: generateText

Generate text responses:

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

Generate structured data with Zod schemas:

\`\`\`typescript
import { z } from 'zod';

// app/api/extract/route.ts
export async function POST(req: Request) {
  const { text } = await req.json();
  
  const schema = z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number()
  });
  
  const response = await fetch('https://aiwa-v0-sdk.vercel.app/api/ai-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: \`${PROJECT_ID_PLACEHOLDER}\`,
      method: 'generateObject',
      options: {
        prompt: \`Extract person details: \${text}\`,
        schema: schema
      }
    })
  });
  
  const result = await response.json();
  return Response.json(result.object);
}
\`\`\`

## Method: streamText

For streaming AI responses, create a server route that proxies to AIWA:

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
      options: {
        prompt,
        system: 'You are a helpful assistant'
      }
    })
  });
  
  return response; // Stream passes through
}
\`\`\`

Client-side usage with streaming:
\`\`\`typescript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Hello' })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = decoder.decode(value);
  console.log(text); // Display streaming text
}
\`\`\`

## Method: streamObject

For streaming structured data, create a server route:

\`\`\`typescript
import { z } from 'zod';

// app/api/stream-data/route.ts
export async function POST(req: Request) {
  const { query } = await req.json();
  
  const schema = z.object({
    items: z.array(z.object({
      title: z.string(),
      description: z.string()
    }))
  });
  
  const response = await fetch('https://aiwa-v0-sdk.vercel.app/api/ai-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: \`${PROJECT_ID_PLACEHOLDER}\`,
      method: 'streamObject',
      options: {
        prompt: query,
        schema: schema
      }
    })
  });
  
  return response; // Stream passes through
}
\`\`\`

## Advanced: Function Calling with Tools

\`\`\`typescript
const response = await fetch('https://aiwa-v0-sdk.vercel.app/api/ai-proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: \`${PROJECT_ID_PLACEHOLDER}\`,
    method: 'generateText',
    options: {
      prompt: 'What is the weather in San Francisco?',
      tools: {
        getWeather: {
          description: 'Get current weather for a location',
          parameters: z.object({
            location: z.string()
          }),
          execute: async ({ location }) => {
            // Your weather API call
            return { temp: 72, condition: 'sunny' };
          }
        }
      }
    }
  })
});
\`\`\`

## Advanced: Chat Messages

\`\`\`typescript
const response = await fetch('https://aiwa-v0-sdk.vercel.app/api/ai-proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: \`${PROJECT_ID_PLACEHOLDER}\`,
    method: 'generateText',
    options: {
      messages: [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello!' },
        { role: 'assistant', content: 'Hi! How can I help?' },
        { role: 'user', content: 'Tell me a joke' }
      ]
    }
  })
});
\`\`\`

## Environment Setup

When exporting your app, \`NEXT_PUBLIC_PROJECT_ID\` is automatically added to \`.env.local\`:

\`\`\`
NEXT_PUBLIC_PROJECT_ID=${PROJECT_ID_PLACEHOLDER}
\`\`\`

Access in your code:
\`\`\`typescript
const projectId = \`${PROJECT_ID_PLACEHOLDER}\`;
\`\`\`

## Model Fallback Chain

AIWA Cloud automatically tries providers in order:
1. Google Gemini 2.0 Flash (default)
2. OpenAI GPT-5
3. Anthropic Claude 3.5 Sonnet
4. xAI Grok
5. Mistral Large

Your app always works even if one provider is down.

---

**PROJECT ID:** Your project ID is \`${PROJECT_ID_PLACEHOLDER}\`. Use this value in all AIWA Cloud API calls when building AI-powered features.`;
