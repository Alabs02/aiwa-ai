"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Zap } from "lucide-react";

interface CreditPurchaseFormProps {
  onPurchase: (amountUsd: number, credits: number) => void;
}

const MIN_AMOUNT = 20;
const MAX_AMOUNT = 5000;
const CREDIT_RATE = 5; // $1 = 5 credits (since 1 credit = $0.20)

export function CreditPurchaseForm({ onPurchase }: CreditPurchaseFormProps) {
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string>("");

  const amountNum = parseFloat(amount) || 0;
  const calculatedCredits = Math.floor(amountNum * CREDIT_RATE);
  const isValid = amountNum >= MIN_AMOUNT && amountNum <= MAX_AMOUNT;

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const sanitized = value.replace(/[^\d.]/g, "");

    // Prevent multiple decimal points
    const parts = sanitized.split(".");
    if (parts.length > 2) return;

    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) return;

    setAmount(sanitized);
    setError("");
  };

  const handlePurchase = () => {
    if (!isValid) {
      if (amountNum < MIN_AMOUNT) {
        setError(`Minimum purchase is $${MIN_AMOUNT}`);
      } else if (amountNum > MAX_AMOUNT) {
        setError(`Maximum purchase is $${MAX_AMOUNT}`);
      }
      return;
    }

    // Convert to cents for Stripe
    const amountCents = Math.round(amountNum * 100);
    onPurchase(amountCents, calculatedCredits);
  };

  const quickAmounts = [20, 50, 100, 250];

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="border-primary/20 bg-primary/5 rounded-lg border p-3">
        <p className="text-primary text-xs">
          Purchase between ${MIN_AMOUNT.toLocaleString()} and $
          {MAX_AMOUNT.toLocaleString()} • 1 credit = $0.20 • Credits never
          expire
        </p>
      </div>

      {/* Quick Amount Buttons */}
      <div className="flex flex-wrap gap-2">
        {quickAmounts.map((quickAmount) => (
          <button
            key={quickAmount}
            onClick={() => setAmount(quickAmount.toString())}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
          >
            ${quickAmount}
          </button>
        ))}
      </div>

      {/* Custom Amount Input */}
      <div className="space-y-2">
        <div className="relative">
          <DollarSign className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="border-white/10 bg-white/5 pl-10 text-lg text-white placeholder:text-neutral-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <p className="text-xs text-neutral-500">
          Min: ${MIN_AMOUNT} • Max: ${MAX_AMOUNT}
        </p>
      </div>

      {/* Credit Calculation Display */}
      {amount && calculatedCredits > 0 && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-emerald-400" />
              <span className="text-sm text-neutral-300">You'll receive</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-400">
                {calculatedCredits.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-400">credits</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-emerald-500/10 pt-2 text-xs text-neutral-500">
            <span>Rate: 1 credit = $0.20</span>
            <span>${amountNum.toFixed(2)} USD</span>
          </div>
        </div>
      )}

      {/* Purchase Button */}
      <Button
        onClick={handlePurchase}
        disabled={!isValid || !amount}
        className="w-full bg-white text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Purchase Credits
      </Button>
    </div>
  );
}
