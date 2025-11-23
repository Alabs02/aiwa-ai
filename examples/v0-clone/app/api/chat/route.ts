import { NextRequest, NextResponse } from "next/server";
import { createClient, ChatDetail } from "v0-sdk";
import { auth } from "@/app/(auth)/auth";
import {
  createChatOwnership,
  createAnonymousChatLog,
  getChatCountByUserId,
  getChatCountByIP
} from "@/lib/db/queries";
import {
  getUserSubscription,
  createUsageEvent,
  ensureUserSubscription
} from "@/lib/db/billing-queries";
import {
  entitlementsByUserType,
  anonymousEntitlements
} from "@/lib/entitlements";
import { ChatSDKError } from "@/lib/errors";
import { parseV0Response, getV0UsageFromReport } from "@/lib/v0-token-parser";

interface TokenUsageWithMetadata {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  isEstimated: boolean;
}

const v0 = createClient(
  process.env.V0_API_URL ? { baseUrl: process.env.V0_API_URL } : {}
);

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return "unknown";
}

async function trackUsageAndDeductCredits(
  userId: string,
  chatDetail: ChatDetail,
  tokenUsage: TokenUsageWithMetadata
): Promise<void> {
  try {
    const messageId =
      chatDetail.messages?.[chatDetail.messages.length - 1]?.id || "";

    await createUsageEvent({
      userId,
      eventType: "chat_generation",
      v0ChatId: chatDetail.id,
      v0MessageId: messageId,
      inputTokens: tokenUsage.inputTokens,
      outputTokens: tokenUsage.outputTokens,
      model: tokenUsage.isEstimated ? "v0-gpt-5-estimated" : "v0-gpt-5",
      status: "completed"
    });

    console.log("[CREDIT DEDUCTION] Successfully deducted credits:", {
      userId,
      chatId: chatDetail.id,
      tokens: tokenUsage.totalTokens,
      isEstimated: tokenUsage.isEstimated
    });
  } catch (error) {
    console.error(
      "[CREDIT DEDUCTION] CRITICAL ERROR - Failed to deduct credits:",
      {
        userId,
        chatId: chatDetail.id,
        error: error instanceof Error ? error.message : error
      }
    );
    throw error;
  }
}

async function refineTokenUsageFromReport(
  userId: string,
  chatDetail: ChatDetail,
  initialUsage: TokenUsageWithMetadata
): Promise<void> {
  if (!initialUsage.isEstimated) {
    return;
  }

  const messageId = chatDetail.messages?.[chatDetail.messages.length - 1]?.id;
  if (!messageId) return;

  try {
    const reportUsage = await getV0UsageFromReport(chatDetail.id, messageId);

    if (reportUsage && reportUsage.totalTokens > 0) {
      console.log(
        "[TOKEN REFINEMENT] Got actual usage from report, adjusting:",
        {
          initial: initialUsage,
          actual: reportUsage
        }
      );

      const tokenDiff = reportUsage.totalTokens - initialUsage.totalTokens;

      if (Math.abs(tokenDiff) > 100) {
        const inputCost = Math.ceil(
          (reportUsage.inputTokens / 1_000_000) * 150
        );
        const outputCost = Math.ceil(
          (reportUsage.outputTokens / 1_000_000) * 750
        );
        const actualTotalCost = inputCost + outputCost;

        const initialInputCost = Math.ceil(
          (initialUsage.inputTokens / 1_000_000) * 150
        );
        const initialOutputCost = Math.ceil(
          (initialUsage.outputTokens / 1_000_000) * 750
        );
        const initialTotalCost = initialInputCost + initialOutputCost;

        const creditAdjustment =
          Math.ceil(actualTotalCost / 20) - Math.ceil(initialTotalCost / 20);

        if (creditAdjustment !== 0) {
          await createUsageEvent({
            userId,
            eventType: "credit_adjustment",
            v0ChatId: chatDetail.id,
            v0MessageId: messageId,
            inputTokens: reportUsage.inputTokens - initialUsage.inputTokens,
            outputTokens: reportUsage.outputTokens - initialUsage.outputTokens,
            model: "v0-gpt-5-adjustment",
            status: "completed"
          });

          console.log("[TOKEN REFINEMENT] Applied credit adjustment:", {
            creditAdjustment,
            reason: "Actual usage differs from estimate"
          });
        }
      }
    }
  } catch (error) {
    console.warn(
      "[TOKEN REFINEMENT] Failed to refine from report (non-critical):",
      error
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.V0_API_KEY) {
      return NextResponse.json(
        { error: "V0_API_KEY environment variable is not configured" },
        { status: 500 }
      );
    }

    const session = await auth();
    const { message, chatId, streaming, attachments, projectId } =
      await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (session?.user?.id) {
      await ensureUserSubscription(session.user.id);

      const chatCount = await getChatCountByUserId({
        userId: session.user.id,
        differenceInHours: 24
      });

      const userType = session.user.type;
      if (chatCount >= entitlementsByUserType[userType].maxMessagesPerDay) {
        return new ChatSDKError("rate_limit:chat").toResponse();
      }

      const subscription = await getUserSubscription(session.user.id);

      if (!subscription) {
        return NextResponse.json(
          { error: "No subscription found. Please set up billing." },
          { status: 403 }
        );
      }

      if (subscription.credits_remaining <= 0) {
        return NextResponse.json(
          {
            error: "insufficient_credits",
            message: "You've run out of credits. Purchase more to continue.",
            credits_remaining: 0
          },
          { status: 402 }
        );
      }

      console.log("[API REQUEST] Authenticated user:", {
        message,
        chatId,
        streaming,
        projectId,
        userId: session.user.id,
        credits_remaining: subscription.credits_remaining
      });
    } else {
      const clientIP = getClientIP(request);
      const chatCount = await getChatCountByIP({
        ipAddress: clientIP,
        differenceInHours: 24
      });

      if (chatCount >= anonymousEntitlements.maxMessagesPerDay) {
        return new ChatSDKError("rate_limit:chat").toResponse();
      }

      console.log("[API REQUEST] Anonymous user:", {
        message,
        chatId,
        streaming,
        projectId,
        ip: clientIP
      });
    }

    console.log("Using baseUrl:", process.env.V0_API_URL || "default");

    let chat;

    if (chatId) {
      if (streaming) {
        console.log("[V0 SDK] Sending streaming message to existing chat:", {
          chatId,
          message,
          responseMode: "experimental_stream"
        });

        // Deduct minimum credit BEFORE streaming starts
        if (session?.user?.id) {
          await createUsageEvent({
            userId: session.user.id,
            eventType: "chat_generation",
            v0ChatId: chatId,
            v0MessageId: "streaming-in-progress",
            inputTokens: 500,
            outputTokens: 2000,
            model: "v0-gpt-5-streaming-upfront",
            status: "completed"
          });
          console.log(
            "[STREAMING] Deducted 1 credit upfront for streaming generation"
          );
        }

        chat = await v0.chats.sendMessage({
          chatId: chatId,
          message,
          modelConfiguration: {
            thinking: true,
            imageGenerations: true
          },
          responseMode: "experimental_stream",
          ...(attachments && attachments.length > 0 && { attachments })
        });

        return new Response(chat as ReadableStream<Uint8Array>, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive"
          }
        });
      } else {
        chat = await v0.chats.sendMessage({
          chatId: chatId,
          message,
          modelConfiguration: {
            thinking: true,
            imageGenerations: true
          },
          ...(attachments && attachments.length > 0 && { attachments })
        });
      }
    } else {
      if (streaming) {
        console.log("[V0 SDK] Creating streaming chat:", {
          message,
          projectId,
          responseMode: "experimental_stream"
        });

        // Deduct minimum credit BEFORE streaming starts
        if (session?.user?.id) {
          await createUsageEvent({
            userId: session.user.id,
            eventType: "chat_generation",
            v0ChatId: "pending",
            v0MessageId: "streaming-in-progress",
            inputTokens: 500,
            outputTokens: 2000,
            model: "v0-gpt-5-streaming-upfront",
            status: "completed"
          });
          console.log(
            "[STREAMING] Deducted 1 credit upfront for new streaming chat"
          );
        }

        chat = await v0.chats.create({
          message,
          responseMode: "experimental_stream",
          ...(projectId && { projectId }),
          modelConfiguration: {
            thinking: true,
            imageGenerations: true
          },
          ...(attachments && attachments.length > 0 && { attachments })
        });

        return new Response(chat as ReadableStream<Uint8Array>, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive"
          }
        });
      } else {
        console.log("[V0 SDK] Creating sync chat:", {
          message,
          projectId,
          responseMode: "sync"
        });
        chat = await v0.chats.create({
          message,
          ...(projectId && { projectId }),
          responseMode: "sync",
          modelConfiguration: {
            thinking: true,
            imageGenerations: true
          },
          ...(attachments && attachments.length > 0 && { attachments })
        });
      }
    }

    if (chat instanceof ReadableStream) {
      throw new Error("Unexpected streaming response");
    }

    const chatDetail = chat as ChatDetail;

    if (!chatId && chatDetail.id) {
      try {
        if (session?.user?.id) {
          await createChatOwnership({
            v0ChatId: chatDetail.id,
            userId: session.user.id
          });
          console.log("[CHAT OWNERSHIP] Created:", chatDetail.id);
        } else {
          const clientIP = getClientIP(request);
          await createAnonymousChatLog({
            ipAddress: clientIP,
            v0ChatId: chatDetail.id
          });
          console.log(
            "[CHAT LOG] Anonymous chat logged:",
            chatDetail.id,
            "IP:",
            clientIP
          );
        }
      } catch (error) {
        console.error("[CHAT OWNERSHIP] Failed to create:", error);
      }
    }

    if (session?.user?.id && chatDetail) {
      const tokenUsage = parseV0Response(chatDetail);

      console.log("[TOKEN USAGE] Parsed from response:", {
        tokens: tokenUsage,
        isEstimated: tokenUsage.isEstimated,
        chatId: chatDetail.id
      });

      await trackUsageAndDeductCredits(session.user.id, chatDetail, tokenUsage);

      if (tokenUsage.isEstimated) {
        setTimeout(() => {
          refineTokenUsageFromReport(
            session.user.id,
            chatDetail,
            tokenUsage
          ).catch((error) => {
            console.warn(
              "[TOKEN REFINEMENT] Background refinement failed:",
              error
            );
          });
        }, 5000);
      }
    }

    let creditsInfo = { credits_remaining: 0, low_credit_warning: false };
    if (session?.user?.id) {
      const updatedSubscription = await getUserSubscription(session.user.id);
      if (updatedSubscription) {
        creditsInfo = {
          credits_remaining: updatedSubscription.credits_remaining,
          low_credit_warning: updatedSubscription.credits_remaining < 10
        };
      }
    }

    return NextResponse.json({
      id: chatDetail.id,
      demo: chatDetail.demo,
      messages: chatDetail.messages?.map((msg) => ({
        ...msg,
        experimental_content: (msg as any).experimental_content
      })),
      ...creditsInfo
    });
  } catch (error) {
    console.error("[V0 API ERROR]:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
