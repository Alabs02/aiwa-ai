export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export function parseV0Response(response: any): TokenUsage {
  // Check for usage data in V0 API response
  if (response?.usage) {
    return {
      inputTokens: response.usage.prompt_tokens || 0,
      outputTokens: response.usage.completion_tokens || 0,
      totalTokens: response.usage.total_tokens || 0
    };
  }

  // Fallback: estimate from content
  const estimateTokens = (text: string) => Math.ceil(text.length / 4);

  return {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0
  };
}

export async function getV0UsageFromReport(
  chatId: string,
  messageId: string
): Promise<TokenUsage | null> {
  try {
    // Use V0 usage report endpoint
    const response = await fetch(
      `https://api.v0.dev/reports/usage?chatId=${chatId}&messageId=${messageId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.V0_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.data && data.data.length > 0) {
      const usage = data.data[0];
      // Parse token info from usage report
      return {
        inputTokens: usage.promptTokens || 0,
        outputTokens: usage.completionTokens || 0,
        totalTokens: (usage.promptTokens || 0) + (usage.completionTokens || 0)
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch V0 usage:", error);
    return null;
  }
}
