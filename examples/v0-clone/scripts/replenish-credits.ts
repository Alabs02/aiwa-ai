import {
  getUserSubscription,
  updateSubscription
} from "@/lib/db/billing-queries";

/**
 * Fix script to correct 15/30 back to 15/15 for free tier
 */
async function fixCreditsTotal() {
  const userId = "74bf2f06-451b-4441-8e58-f54c2e26c201";

  try {
    console.log("🔧 Fixing credits total...");

    const currentSub = await getUserSubscription(userId);

    if (!currentSub) {
      console.error("❌ No subscription found");
      return;
    }

    console.log(
      `\n📊 Current: ${currentSub.credits_remaining}/${currentSub.credits_total}`
    );

    const updatedSub = await updateSubscription({
      userId,
      updates: {
        credits_remaining: 200,
        credits_total: 200,
        credits_used: 0
      }
    });

    console.log(
      `✅ Fixed: ${updatedSub.credits_remaining}/${updatedSub.credits_total}\n`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

fixCreditsTotal();
