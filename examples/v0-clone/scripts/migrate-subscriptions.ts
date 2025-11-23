import db from "../lib/db/connection";
import { users, subscriptions } from "../lib/db/schema";
import { sql } from "drizzle-orm";

/**
 * Migration Script: Ensure All Users Have Subscriptions
 *
 * This script:
 * 1. Finds users without subscriptions
 * 2. Creates free plan subscriptions for them
 * 3. Sets appropriate period dates
 */

async function migrateUsersWithoutSubscriptions() {
  console.log("🔍 Starting subscription migration...\n");

  try {
    // Find users without subscriptions
    const usersWithoutSubs = await db
      .select({
        id: users.id,
        email: users.email,
        created_at: users.created_at
      })
      .from(users)
      .leftJoin(subscriptions, sql`${users.id} = ${subscriptions.user_id}`)
      .where(sql`${subscriptions.id} IS NULL`);

    console.log(
      `Found ${usersWithoutSubs.length} users without subscriptions\n`
    );

    if (usersWithoutSubs.length === 0) {
      console.log("✅ All users already have subscriptions. Nothing to do.");
      return;
    }

    // Create free subscriptions for each user
    const now = new Date();
    const nextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );

    for (const user of usersWithoutSubs) {
      console.log(`Creating subscription for: ${user.email} (${user.id})`);

      await db.insert(subscriptions).values({
        user_id: user.id,
        plan: "free",
        billing_cycle: null,
        status: "active",
        credits_total: 15,
        credits_used: 0,
        credits_remaining: 15,
        rollover_credits: 0,
        current_period_start: now,
        current_period_end: nextMonth,
        cancel_at_period_end: "false"
      });

      console.log(`✅ Created free subscription for ${user.email}\n`);
    }

    console.log(
      `\n✅ Migration complete! Created ${usersWithoutSubs.length} subscriptions.`
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration
migrateUsersWithoutSubscriptions()
  .then(() => {
    console.log("\n🎉 Migration successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  });
