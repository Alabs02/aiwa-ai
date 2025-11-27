import db from "../lib/db/connection";
import { payment_transactions } from "../lib/db/schema";
import { sql } from "drizzle-orm";

async function inspectPayments() {
  console.log("🔍 Inspecting payment_transactions table...\n");

  // Get all payments
  const allPayments = await db
    .select()
    .from(payment_transactions)
    .orderBy(payment_transactions.created_at);

  console.log(`Total records: ${allPayments.length}\n`);

  // Show details
  console.log("📋 All payment records:");
  console.log("=".repeat(100));

  let totalRevenue = 0;

  for (const payment of allPayments) {
    const amount = Number(payment.amount);
    totalRevenue += amount;

    console.log(`ID: ${payment.id}`);
    console.log(`  Type: ${payment.type}`);
    console.log(`  Amount: $${(amount / 100).toFixed(2)}`);
    console.log(`  Stripe Payment ID: ${payment.stripe_payment_id || "NULL"}`);
    console.log(`  Status: ${payment.status}`);
    console.log(`  Description: ${payment.description}`);
    console.log(`  Created: ${payment.created_at}`);
    console.log("-".repeat(100));
  }

  console.log(`\n💰 Total Revenue: $${(totalRevenue / 100).toFixed(2)}`);

  // Group by description
  const grouped = await db.execute(sql`
    SELECT 
      description,
      type,
      COUNT(*) as count,
      SUM(amount) as total,
      STRING_AGG(stripe_payment_id::text, ', ') as payment_ids
    FROM ${payment_transactions}
    GROUP BY description, type
    ORDER BY description
  `);

  const groups = Array.isArray(grouped) ? grouped : grouped.rows || [];

  console.log("\n📊 Grouped by description:");
  console.log("=".repeat(100));
  for (const group of groups) {
    console.log(`${group.description} (${group.type})`);
    console.log(`  Count: ${group.count}`);
    console.log(`  Total: $${(Number(group.total) / 100).toFixed(2)}`);
    console.log(`  Payment IDs: ${group.payment_ids}`);
    console.log("-".repeat(100));
  }

  process.exit(0);
}

inspectPayments().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
