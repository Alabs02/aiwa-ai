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
      // Ensure user has a subscription
      await ensureUserSubscription(session.user.id);

      // Check rate limits
      const chatCount = await getChatCountByUserId({
        userId: session.user.id,
        differenceInHours: 24
      });

      const userType = session.user.type;
      if (chatCount >= entitlementsByUserType[userType].maxMessagesPerDay) {
        return new ChatSDKError("rate_limit:chat").toResponse();
      }

      // Check credits
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

      console.log("API request:", {
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

      console.log("API request (anonymous):", {
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
        console.log("Sending streaming message to existing chat:", {
          chatId,
          message,
          responseMode: "experimental_stream"
        });
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
        console.log("Streaming message sent to existing chat successfully");

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
        console.log("Creating streaming chat with params:", {
          message,
          projectId,
          responseMode: "experimental_stream"
        });
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
        console.log("Streaming chat created successfully");

        return new Response(chat as ReadableStream<Uint8Array>, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive"
          }
        });
      } else {
        console.log("Creating sync chat with params:", {
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
        console.log("Sync chat created successfully");
      }
    }

    if (chat instanceof ReadableStream) {
      throw new Error("Unexpected streaming response");
    }

    const chatDetail = chat as ChatDetail;

    // Create ownership/log for new chats
    if (!chatId && chatDetail.id) {
      try {
        if (session?.user?.id) {
          await createChatOwnership({
            v0ChatId: chatDetail.id,
            userId: session.user.id
          });
          console.log("Chat ownership created:", chatDetail.id);
        } else {
          const clientIP = getClientIP(request);
          await createAnonymousChatLog({
            ipAddress: clientIP,
            v0ChatId: chatDetail.id
          });
          console.log("Anonymous chat logged:", chatDetail.id, "IP:", clientIP);
        }
      } catch (error) {
        console.error("Failed to create chat ownership/log:", error);
      }
    }

    // Track usage for authenticated users
    if (session?.user?.id && chatDetail) {
      let tokenUsage = parseV0Response(chatDetail);

      // If tokens not in response, fetch from usage report (async)
      if (tokenUsage.totalTokens === 0) {
        setTimeout(async () => {
          try {
            const reportUsage = await getV0UsageFromReport(
              chatDetail.id,
              chatDetail.messages?.[chatDetail.messages.length - 1]?.id || ""
            );

            if (reportUsage && reportUsage.totalTokens > 0) {
              await createUsageEvent({
                userId: session.user.id,
                eventType: "chat_generation",
                v0ChatId: chatDetail.id,
                v0MessageId:
                  chatDetail.messages?.[chatDetail.messages.length - 1]?.id,
                inputTokens: reportUsage.inputTokens,
                outputTokens: reportUsage.outputTokens,
                model: "v0-gpt-5",
                status: "completed"
              });
            }
          } catch (usageError) {
            console.error("Failed to track usage from report:", usageError);
          }
        }, 5000);
      } else {
        // Track immediately if tokens available
        try {
          await createUsageEvent({
            userId: session.user.id,
            eventType: "chat_generation",
            v0ChatId: chatDetail.id,
            v0MessageId:
              chatDetail.messages?.[chatDetail.messages.length - 1]?.id,
            inputTokens: tokenUsage.inputTokens,
            outputTokens: tokenUsage.outputTokens,
            model: "v0-gpt-5",
            status: "completed"
          });
        } catch (usageError) {
          console.error("Failed to track usage:", usageError);
        }
      }
    }

    // Get updated subscription for response
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
    console.error("V0 API Error:", error);

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
