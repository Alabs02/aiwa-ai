// Validation constants - MUST match frontend
export const CREDIT_PURCHASE_LIMITS = {
  MIN_AMOUNT: 20, // $20 minimum
  MAX_AMOUNT: 5000, // $5000 maximum
  CREDIT_RATE: 5 // $1 = 5 credits
} as const;

/**
 * Validates credit purchase amount
 * @param amountCents - Amount in cents
 * @returns Validation result with error message if invalid
 */
export function validateCreditPurchase(amountCents: number): {
  valid: boolean;
  error?: string;
  amountUsd?: number;
  credits?: number;
} {
  // Convert cents to dollars
  const amountUsd = amountCents / 100;

  // Check if amount is a valid number
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return {
      valid: false,
      error: "Invalid amount provided"
    };
  }

  // Check minimum
  if (amountUsd < CREDIT_PURCHASE_LIMITS.MIN_AMOUNT) {
    return {
      valid: false,
      error: `Minimum purchase amount is $${CREDIT_PURCHASE_LIMITS.MIN_AMOUNT}`
    };
  }

  // Check maximum
  if (amountUsd > CREDIT_PURCHASE_LIMITS.MAX_AMOUNT) {
    return {
      valid: false,
      error: `Maximum purchase amount is $${CREDIT_PURCHASE_LIMITS.MAX_AMOUNT}`
    };
  }

  // Calculate credits
  const credits = Math.floor(amountUsd * CREDIT_PURCHASE_LIMITS.CREDIT_RATE);

  return {
    valid: true,
    amountUsd,
    credits
  };
}
