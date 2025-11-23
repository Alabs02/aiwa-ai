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
Endpoint BaseURL: https://www.aiwa.codes
Endpoint:
POST https://www.aiwa.codes/api/ai-proxy

Request Body:
{
  "projectId": \`${PROJECT_ID_PLACEHOLDER}\`,
  "method": "generateText | generateObject | streamText | streamObject | generateImage | generateSpeech | transcribe",
  "options": {
    "model": "optional: gateway('provider/model') or provider.image('model-name') for images or provider.speech('model-name') for speech or provider.transcription('model-name') for transcription",
    "system": "optional system prompt (for text/object methods)",
    "prompt": "string (required for text/object/image methods)",
    "text": "string (required for speech generation)",
    "audio": "string (base64 or data URL) or number[] (Uint8Array as array) - required for transcription",
    "messages": [
      { "role": "system|user|assistant", "content": "..." }
    ],
    "schema": "Zod schema (for object methods only)",
    "schemaDefinition": {
      "field": "string | number | boolean | string[] | number[] | enum:val1,val2 | nested object"
    },
    "size": "optional: width x height (for image generation, e.g., '1024x1024')",
    "aspectRatio": "optional: width:height (for image generation, e.g., '16:9')",
    "n": "optional: number of images to generate (for image generation)",
    "seed": "optional: seed for reproducible image generation",
    "voice": "optional: voice selection (for speech generation, e.g., 'alloy', 'echo', 'nova')",
    "language": "optional: language code (for speech generation, e.g., 'es', 'fr', 'de')"
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

5. generateImage (Single Image)
{
  "projectId": \`${PROJECT_ID_PLACEHOLDER}\`,
  "method": "generateImage",
  "options": {
    "model": "openai.image('dall-e-3')",
    "prompt": "A futuristic city at sunset",
    "size": "1024x1024"
  }
}

Response:
{
  "image": {
    "base64": "data:image/png;base64,iVBORw0KG...",
    "uint8Array": [137, 80, 78, 71, ...],
    "mediaType": "image/png"
  },
  "warnings": [],
  "providerMetadata": {
    "openai": {
      "images": [{
        "revisedPrompt": "A futuristic city with tall skyscrapers..."
      }]
    }
  }
}

To extract and use the image:
const response = await fetch('/api/ai-proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: \`${PROJECT_ID_PLACEHOLDER}\`,
    method: 'generateImage',
    options: {
      model: "openai.image('dall-e-3')",
      prompt: 'A futuristic city at sunset',
      size: '1024x1024'
    }
  })
});
const data = await response.json();
const imageBase64 = data.image.base64; // Use directly in <img src={imageBase64} />
const imageBytes = new Uint8Array(data.image.uint8Array); // For binary operations

6. generateImage (Multiple Images)
{
  "projectId": \`${PROJECT_ID_PLACEHOLDER}\`,
  "method": "generateImage",
  "options": {
    "model": "openai.image('dall-e-2')",
    "prompt": "A cute robot assistant",
    "size": "512x512",
    "n": 4
  }
}

Response:
{
  "images": [
    {
      "base64": "data:image/png;base64,iVBORw0KG...",
      "uint8Array": [137, 80, 78, 71, ...],
      "mediaType": "image/png"
    },
    {
      "base64": "data:image/png;base64,iVBORw0KG...",
      "uint8Array": [137, 80, 78, 71, ...],
      "mediaType": "image/png"
    },
    // ... 2 more images
  ],
  "warnings": [],
  "providerMetadata": {...}
}

7. generateImage (Using Aspect Ratio)
{
  "projectId": \`${PROJECT_ID_PLACEHOLDER}\`,
  "method": "generateImage",
  "options": {
    "model": "vertex.image('imagen-3.0-generate-002')",
    "prompt": "A mountain landscape",
    "aspectRatio": "16:9"
  }
}

8. generateImage (With Provider Options)
{
  "projectId": \`${PROJECT_ID_PLACEHOLDER}\`,
  "method": "generateImage",
  "options": {
    "model": "openai.image('dall-e-3')",
    "prompt": "A professional headshot",
    "size": "1024x1024",
    "seed": 1234567890,
    "providerOptions": {
      "openai": {
        "style": "vivid",
        "quality": "hd"
      }
    }
  }
}

Image Generation Notes:
- Image models are provider-specific (e.g., openai.image(), vertex.image())
- Use "size" for OpenAI models (e.g., "1024x1024", "1792x1024")
- Use "aspectRatio" for Google Vertex models (e.g., "16:9", "3:4")
- The "n" parameter generates multiple images (max varies by model)
- Images return as base64 (ready for <img src>) and uint8Array (for processing)
- Provider metadata may include revised prompts and other details
- Seeds enable reproducible image generation (if supported by model)

Common Image Models:
- OpenAI: dall-e-3, dall-e-2, gpt-image-1
- Google Vertex: imagen-3.0-generate-002, imagen-3.0-fast-generate-001
- Black Forest Labs: flux-pro-1.1-ultra, flux-pro-1.1
- Fal: fal-ai/flux/dev, fal-ai/flux-lora, fal-ai/fast-sdxl

9. generateSpeech (Basic)
{
  "projectId": \`${PROJECT_ID_PLACEHOLDER}\`,
  "method": "generateSpeech",
  "options": {
    "model": "openai.speech('tts-1')",
    "text": "Hello, world! Welcome to AIWA Cloud.",
    "voice": "alloy"
  }
}

Response:
{
  "audio": {
    "base64": "data:audio/mpeg;base64,//uQx...",
    "uint8Array": [255, 251, 144, 196, 0, 0, 13, 32, ...],
    "mediaType": "audio/mpeg",
    "format": "mp3"
  },
  "warnings": [],
  "responses": [...],
  "providerMetadata": {...}
}

To use the audio:
const response = await fetch('/api/ai-proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: \`${PROJECT_ID_PLACEHOLDER}\`,
    method: 'generateSpeech',
    options: {
      model: "openai.speech('tts-1')",
      text: 'Hello, world!',
      voice: 'alloy'
    }
  })
});
const data = await response.json();

// Option 1: Use base64 directly
const audioSrc = data.audio.base64;
// <audio src={audioSrc} controls />

// Option 2: Use uint8Array for more control
const audioBytes = new Uint8Array(data.audio.uint8Array);
const audioBlob = new Blob([audioBytes], { type: data.audio.mediaType });
const audioUrl = URL.createObjectURL(audioBlob);
// <audio src={audioUrl} controls />

10. generateSpeech (With Language)
{
  "projectId": \`${PROJECT_ID_PLACEHOLDER}\`,
  "method": "generateSpeech",
  "options": {
    "model": "lmnt.speech('aurora')",
    "text": "Hola, mundo!",
    "language": "es"
  }
}

11. generateSpeech (With Provider Options)
{
  "projectId": \`${PROJECT_ID_PLACEHOLDER}\`,
  "method": "generateSpeech",
  "options": {
    "model": "openai.speech('tts-1-hd')",
    "text": "This is high quality audio.",
    "voice": "nova",
    "providerOptions": {
      "openai": {
        "speed": 1.0
      }
    }
  }
}

12. generateSpeech (Different Voices)
{
  "projectId": \`${PROJECT_ID_PLACEHOLDER}\`,
  "method": "generateSpeech",
  "options": {
    "model": "openai.speech('gpt-4o-mini-tts')",
    "text": "Testing different voice options.",
    "voice": "echo"
  }
}

Speech Generation Notes:
- Speech models are provider-specific (e.g., openai.speech(), lmnt.speech())
- The "voice" parameter is required for most providers
- The "text" parameter contains the content to convert to speech
- Audio returns as an object with: base64 (data URL), uint8Array (binary), mediaType, and format
- The base64 property can be used directly in <audio src={base64} /> elements
- For more control, convert uint8Array to Blob using the provided mediaType
- Language parameter varies by provider support
- Common audio formats: mp3 (audio/mpeg), wav (audio/wav), opus (audio/opus)
- Use URL.createObjectURL() to create playable audio URLs from Blob objects

Common Speech Models & Voices:
- OpenAI TTS-1: voices (alloy, echo, fable, onyx, nova, shimmer)
- OpenAI TTS-1-HD: voices (alloy, echo, fable, onyx, nova, shimmer)
- OpenAI GPT-4o-mini-TTS: voices (alloy, echo, fable, onyx, nova, shimmer)
- ElevenLabs: eleven_v3, eleven_multilingual_v2, eleven_flash_v2_5
- LMNT: aurora, blizzard
- Hume: default

13. transcribe (Basic - Base64 Audio)
{
  "projectId": \`${PROJECT_ID_PLACEHOLDER}\`,
  "method": "transcribe",
  "options": {
    "model": "openai.transcription('whisper-1')",
    "audio": "data:audio/mpeg;base64,//uQxAAAAAAAAAAAA..."
  }
}

Response:
{
  "text": "Hello, world! Welcome to AIWA Cloud.",
  "segments": [
    {
      "id": 0,
      "start": 0.0,
      "end": 2.5,
      "text": "Hello, world!"
    },
    {
      "id": 1,
      "start": 2.5,
      "end": 5.0,
      "text": "Welcome to AIWA Cloud."
    }
  ],
  "language": "en",
  "durationInSeconds": 5.0,
  "warnings": [],
  "responses": [...],
  "providerMetadata": {...}
}

To use transcription:
const response = await fetch('/api/ai-proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: \`${PROJECT_ID_PLACEHOLDER}\`,
    method: 'transcribe',
    options: {
      model: "openai.transcription('whisper-1')",
      audio: audioBase64String // or audioDataURL
    }
  })
});
const data = await response.json();
const transcriptText = data.text;
const segments = data.segments; // Optional: with timestamps
const language = data.language; // Optional: detected language

14. transcribe (Uint8Array as Array)
{
  "projectId": \`${PROJECT_ID_PLACEHOLDER}\`,
  "method": "transcribe",
  "options": {
    "model": "openai.transcription('whisper-1')",
    "audio": [255, 251, 144, 196, 0, 0, 13, 32, ...]
  }
}

15. transcribe (With Provider Options)
{
  "projectId": \`${PROJECT_ID_PLACEHOLDER}\`,
  "method": "transcribe",
  "options": {
    "model": "openai.transcription('whisper-1')",
    "audio": "data:audio/mpeg;base64,//uQx...",
    "providerOptions": {
      "openai": {
        "timestampGranularities": ["word"]
      }
    }
  }
}

16. transcribe (Different Models)
{
  "projectId": \`${PROJECT_ID_PLACEHOLDER}\`,
  "method": "transcribe",
  "options": {
    "model": "groq.transcription('whisper-large-v3-turbo')",
    "audio": "data:audio/wav;base64,UklGRiQAAABXQVZF..."
  }
}

Transcription Notes:
- Transcription models are provider-specific (e.g., openai.transcription(), groq.transcription())
- The "audio" parameter accepts base64 strings (with or without data URL prefix) or Uint8Array as array
- Returns transcript with text, optional segments (with timestamps), language, and duration
- Segments include start/end times and text for each portion of audio
- Language is automatically detected if not specified
- Supports various audio formats: mp3, wav, m4a, webm, etc.
- Provider options enable features like word-level timestamps

Common Transcription Models:
- OpenAI: whisper-1, gpt-4o-transcribe, gpt-4o-mini-transcribe
- Groq: whisper-large-v3-turbo, whisper-large-v3, distil-whisper-large-v3-en
- ElevenLabs: scribe_v1, scribe_v1_experimental
- Deepgram: base, enhanced, nova, nova-2, nova-3
- AssemblyAI: best, nano
- Fal: whisper, wizper

Guidelines for Generated Apps:
- Always send projectId.
- Always include system prompts when needed (for text/object methods).
- Prefer messages[] for multi-turn conversations.
- Use schemaDefinition when generating structured data.
- For image generation, use provider-specific image models (e.g., openai.image(), vertex.image()).
- For images, specify either size (widthxheight) or aspectRatio (width:height) based on model support.
- Image responses include base64 (for direct display) and uint8Array (for processing).
- For speech generation, use provider-specific speech models (e.g., openai.speech(), lmnt.speech()).
- For speech, the "text" parameter is required (not "prompt"), and "voice" is typically required.
- Speech responses include audio object with base64, uint8Array, mediaType, and format properties.
- The audio.base64 can be used directly in audio elements, or convert audio.uint8Array to Blob for more control.
- For transcription, use provider-specific transcription models (e.g., openai.transcription(), groq.transcription()).
- For transcription, the "audio" parameter accepts base64 strings or Uint8Array as array.
- Transcription responses include text, optional segments with timestamps, language, and duration.
- All requests must target /api/ai-proxy.

SEO Best Practices:
Always implement these SEO fundamentals in generated Next.js apps:
- Use Next.js Metadata API to define title and description
- Implement proper heading hierarchy (h1 → h2 → h3)
- Add alt attributes to all images with descriptive text
- Include Open Graph and Twitter metadata
- Use semantic HTML5 elements (header, nav, main, article, section, footer)
- Ensure mobile responsiveness (viewport handled by Next.js)
- Use descriptive link text (avoid "click here")

Next.js metadata implementation (add to page.tsx or layout.tsx):
\`\`\`typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your App Title - Brief Description',
  description: 'Compelling description of your app\'s purpose and features (150-160 characters)',
  openGraph: {
    title: 'Your App Title',
    description: 'Brief description for social sharing',
    type: 'website',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your App Title',
    description: 'Brief description for Twitter',
  },
}

export default function Page() {
  return (
    <main>
      <h1>Main Heading</h1>
      <img src="/image.jpg" alt="Descriptive alt text" />
    </main>
  )
}
\`\`\`

For dynamic metadata:
\`\`\`typescript
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Dynamic Title',
    description: 'Dynamic description based on content',
  }
}
\`\`\`

Access in your code:
\`\`\`typescript
const projectId = \`${PROJECT_ID_PLACEHOLDER}\`;
\`\`\`

**PROJECT ID:** \`${PROJECT_ID_PLACEHOLDER}\`
`;
