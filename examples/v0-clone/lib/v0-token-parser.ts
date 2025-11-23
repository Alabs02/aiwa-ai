export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface TokenUsageWithMetadata extends TokenUsage {
  isEstimated: boolean;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function extractContentText(response: any): string {
  let content = "";

  if (response?.messages && Array.isArray(response.messages)) {
    response.messages.forEach((msg: any) => {
      if (msg.content) content += msg.content + " ";
      if (msg.experimental_content) content += msg.experimental_content + " ";
    });
  }

  if (response?.demo) {
    content += response.demo;
  }

  return content;
}

export function parseV0Response(response: any): TokenUsageWithMetadata {
  if (response?.usage) {
    return {
      inputTokens: response.usage.prompt_tokens || 0,
      outputTokens: response.usage.completion_tokens || 0,
      totalTokens: response.usage.total_tokens || 0,
      isEstimated: false
    };
  }

  const contentText = extractContentText(response);

  if (contentText.length > 0) {
    const outputTokens = estimateTokens(contentText);
    const inputTokens = Math.ceil(outputTokens * 0.3);

    console.warn(
      "[TOKEN ESTIMATION] No usage data from V0 API, using estimation:",
      {
        outputTokens,
        inputTokens,
        contentLength: contentText.length
      }
    );

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      isEstimated: true
    };
  }

  console.warn(
    "[TOKEN ESTIMATION] No content to estimate, using minimum fallback"
  );

  return {
    inputTokens: 500,
    outputTokens: 2000,
    totalTokens: 2500,
    isEstimated: true
  };
}

export async function getV0UsageFromReport(
  chatId: string,
  messageId: string
): Promise<TokenUsage | null> {
  try {
    const response = await fetch(
      `https://api.v0.dev/reports/usage?chatId=${chatId}&messageId=${messageId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.V0_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      console.warn(`[V0 USAGE REPORT] Failed with status ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const usage = data.data[0];
      return {
        inputTokens: usage.promptTokens || 0,
        outputTokens: usage.completionTokens || 0,
        totalTokens: (usage.promptTokens || 0) + (usage.completionTokens || 0)
      };
    }

    return null;
  } catch (error) {
    console.error("[V0 USAGE REPORT] Fetch failed:", error);
    return null;
  }
}
