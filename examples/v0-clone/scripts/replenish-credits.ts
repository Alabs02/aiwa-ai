import {
  getUserSubscription,
  updateSubscription
} from "@/lib/db/billing-queries";

/**
 * Fix script to correct 15/30 back to 15/15 for free tier
 */
async function fixCreditsTotal() {
  const userId = "30c819be-9f7e-428d-af4c-ef5ace820f5b";

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
        credits_remaining: 30,
        credits_total: 15,
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
