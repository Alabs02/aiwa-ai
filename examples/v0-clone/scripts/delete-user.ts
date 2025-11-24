import db from "@/lib/db/connection";
import {
  users,
  chat_ownerships,
  github_exports,
  prompt_library,
  projects,
  project_env_vars,
  subscriptions,
  credit_purchases,
  usage_events,
  payment_transactions
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as readline from "readline";

const USER_ID = "0ad37c36-e953-4502-be22-fca407b61d16";

function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "yes");
    });
  });
}

async function deleteUserAccountSafe() {
  try {
    console.log("🔍 Fetching user data...\n");

    const [user] = await db.select().from(users).where(eq(users.id, USER_ID));

    if (!user) {
      console.error("❌ User not found");
      process.exit(1);
    }

    console.log("📊 User to be deleted:");
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.created_at}\n`);

    console.log("⚠️  WARNING: This action is PERMANENT and IRREVERSIBLE");
    console.log("   All user data, projects, and history will be deleted.\n");

    const confirmed = await askConfirmation('Type "yes" to confirm deletion: ');

    if (!confirmed) {
      console.log("\n❌ Deletion cancelled");
      process.exit(0);
    }

    console.log("\n🗑️  Deleting user account...\n");

    // Delete in proper order
    await db
      .delete(project_env_vars)
      .where(
        eq(
          project_env_vars.project_id,
          db
            .select({ id: projects.id })
            .from(projects)
            .where(eq(projects.user_id, USER_ID))
        )
      );

    await db.delete(projects).where(eq(projects.user_id, USER_ID));
    await db
      .delete(chat_ownerships)
      .where(eq(chat_ownerships.user_id, USER_ID));
    await db.delete(github_exports).where(eq(github_exports.user_id, USER_ID));
    await db.delete(prompt_library).where(eq(prompt_library.user_id, USER_ID));
    await db.delete(usage_events).where(eq(usage_events.user_id, USER_ID));
    await db
      .delete(credit_purchases)
      .where(eq(credit_purchases.user_id, USER_ID));
    await db.delete(subscriptions).where(eq(subscriptions.user_id, USER_ID));
    await db
      .delete(payment_transactions)
      .where(eq(payment_transactions.user_id, USER_ID));

    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, USER_ID))
      .returning();

    console.log("✅ Account permanently deleted");
    console.log(`   Email: ${deletedUser.email}`);
    console.log(`   Timestamp: ${new Date().toISOString()}\n`);
  } catch (error) {
    console.error("❌ Deletion failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

deleteUserAccountSafe();
