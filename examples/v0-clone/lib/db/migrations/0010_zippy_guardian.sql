-- Migration: Fix Duplicate Subscriptions
-- This script will:
-- 1. Keep only the latest subscription per user
-- 2. Delete duplicate subscriptions
-- 3. Add UNIQUE constraint on user_id

-- Step 1: Identify and keep only the latest subscription per user
WITH ranked_subscriptions AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY updated_at DESC, created_at DESC
    ) as row_num
  FROM subscriptions
)
-- Step 2: Delete all except the latest (row_num = 1)
DELETE FROM subscriptions
WHERE id IN (
  SELECT id 
  FROM ranked_subscriptions 
  WHERE row_num > 1
);

-- Step 3: Add UNIQUE constraint to prevent future duplicates
ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);

-- Verify results
SELECT 
  user_id,
  COUNT(*) as subscription_count
FROM subscriptions
GROUP BY user_id
HAVING COUNT(*) > 1;
-- Should return 0 rows if successful
