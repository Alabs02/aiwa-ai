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
  "steps": [
    {
      "content": [
        {
          "type": "text",
          "text": "...generated text..."
        }
      ],
      "finishReason": "stop",
      "usage": {
        "inputTokens": 75,
        "outputTokens": 18,
        "totalTokens": 93
      },
      "warnings": [],
      "request": {
        "body": {
          "prompt": [
            {
              "role": "system",
              "content": "You are a helpful assistant..."
            },
            {
              "role": "user",
              "content": [
                {
                  "type": "text",
                  "text": "Write a short poem."
                }
              ]
            }
          ],
          "providerOptions": {
            "gateway": {
              "order": ["google", "openai", "anthropic", "xai", "mistral"],
              "models": [...]
            }
          },
          "headers": {
            "user-agent": "ai/5.0.89"
          }
        }
      },
      "response": {
        "id": "aitxt-...",
        "timestamp": "2025-11-17T12:16:28.027Z",
        "modelId": "google/gemini-2.0-flash",
        "headers": {...},
        "body": {
          "content": [
            {
              "type": "text",
              "text": "...generated text..."
            }
          ],
          "finishReason": "stop",
          "usage": {
            "inputTokens": 75,
            "outputTokens": 18,
            "totalTokens": 93
          },
          "warnings": [],
          "providerMetadata": {...}
        },
        "messages": [
          {
            "role": "assistant",
            "content": [
              {
                "type": "text",
                "text": "...generated text..."
              }
            ]
          }
        ]
      },
      "providerMetadata": {
        "google": {
          "usageMetadata": {
            "promptTokenCount": 75,
            "candidatesTokenCount": 18,
            "totalTokenCount": 93
          }
        },
        "gateway": {
          "routing": {
            "originalModelId": "google/gemini-2.0-flash",
            "resolvedProvider": "google",
            "finalProvider": "google",
            "attempts": [...]
          },
          "cost": "0.0000147",
          "marketCost": "0.0000147",
          "generationId": "gen_..."
        }
      }
    }
  ]
}

To extract the generated text:
const response = await fetch('/api/ai-proxy', {...});
const data = await response.json();
const generatedText = data.steps[0].content[0].text;

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
