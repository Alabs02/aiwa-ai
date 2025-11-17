export const PROJECT_ID_PLACEHOLDER = "{{PROJECT_ID}}";

export const AIWA_CLOUD_DOCS = `
SERVICE NAME: AIWA Cloud
AI Proxy Usage Instructions

Core Concepts:
- All AI requests must be sent to the /api/ai-proxy endpoint.
- The proxy automatically injects provider routing fallbacks.
- The proxy automatically assigns a default model if none is provided.
- schemaDefinition is supported and is automatically converted into Zod schemas.
- System prompts and user prompts are both supported.
- All object generation and streaming require a schema.

Default Model:
- google/gemini-2.0-flash

Default Fallback Chain:
Models attempted in order:
1. google/gemini-2.0-flash
2. openai/gpt-5
3. anthropic/claude-3.7-sonnet
4. xai/grok-beta
5. mistral/mistral-large

API Reference
Endpoint BaseURL: https://aiwa-v0-sdk.vercel.app
Endpoint:
POST https://aiwa-v0-sdk.vercel.app/api/ai-proxy

Request Body:
{
  "projectId": \`${PROJECT_ID_PLACEHOLDER}\`,
  "method": "generateText | generateObject | streamText | streamObject",
  "options": {
    "model": "optional: gateway('provider/model')",
    "system": "optional system prompt",
    "prompt": "string",
    "messages": [
      { "role": "system|user|assistant", "content": "..." }
    ],
    "schema": "Zod schema (for object methods only)",
    "schemaDefinition": {
      "field": "string | number | boolean | string[] | number[] | enum:val1,val2 | nested object"
    }
  }
}

Behavior:
- If model is not provided, default model is injected.
- If providerOptions.gateway is not provided, fallback routing is injected.
- If schemaDefinition is provided, it is converted to a Zod schema.
- stream responses return streaming bodies.

Examples

1. Generate Text
{
  "projectId": \`${PROJECT_ID_PLACEHOLDER}\`,
  "method": "generateText",
  "options": {
    "system": "You are a helpful assistant.",
    "prompt": "Write a short poem."
  }
}

Response:
{
  "text": "...generated text...",
  "usage": { ... }
}

2. Generate Object
{
  "projectId": \`${PROJECT_ID_PLACEHOLDER}\`,
  "method": "generateObject",
  "options": {
    "prompt": "Generate a recipe.",
    "schemaDefinition": {
      "title": "string",
      "ingredients": "string[]",
      "steps": "string[]"
    }
  }
}

Response:
{
  "object": {
    "title": "...",
    "ingredients": ["..."],
    "steps": ["..."]
  },
  "usage": { ... }
}

3. streamText
{
  "projectId": \`${PROJECT_ID_PLACEHOLDER}\`,
  "method": "streamText",
  "options": {
    "prompt": "Explain quantum computing simply."
  }
}

Response:
<streaming text chunks>

4. streamObject
{
  "projectId": \`${PROJECT_ID_PLACEHOLDER}\`,
  "method": "streamObject",
  "options": {
    "prompt": "Generate step-by-step reasoning.",
    "schemaDefinition": {
      "step": "string",
      "explanation": "string"
    }
  }
}

Response:
<streamed JSON lines>

Guidelines for Generated Apps:
- Always send projectId.
- Always include system prompts when needed.
- Prefer messages[] for multi-turn conversations.
- Use schemaDefinition when generating structured data.
- All requests must target /api/ai-proxy.

Access in your code:
\`\`\`typescript
const projectId = \`${PROJECT_ID_PLACEHOLDER}\`;
\`\`\`

**PROJECT ID:** \`${PROJECT_ID_PLACEHOLDER}\`
`;
