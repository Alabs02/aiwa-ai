import db from "../lib/db/connection";
import { users } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const ADMIN_EMAILS = ["alabson.inc@gmail.com"];

async function setAdmins() {
  console.log("Setting admin roles...\n");

  for (const email of ADMIN_EMAILS) {
    try {
      const [user] = await db
        .update(users)
        .set({ role: "admin" })
        .where(eq(users.email, email))
        .returning();

      if (user) {
        console.log(`✓ ${email} → admin`);
      } else {
        console.log(`✗ ${email} not found`);
      }
    } catch (error) {
      console.error(`✗ ${email} failed:`, error);
    }
  }

  console.log("\nDone!");
  process.exit(0);
}

setAdmins();
