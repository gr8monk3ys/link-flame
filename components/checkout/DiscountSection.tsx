"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

export interface CheckoutDiscountState {
  loyaltyPointsToRedeem?: number;
  loyaltyDiscountAmount: number;
  giftCardCode?: string;
  giftCardAmount?: number;
  totalDiscount: number;
}

export const DEFAULT_CHECKOUT_DISCOUNT_STATE: CheckoutDiscountState = {
  loyaltyPointsToRedeem: undefined,
  loyaltyDiscountAmount: 0,
  giftCardCode: undefined,
  giftCardAmount: undefined,
  totalDiscount: 0,
};

interface DiscountSectionProps {
  cartTotal: number;
  disabled?: boolean;
  onDiscountChange: (discounts: CheckoutDiscountState) => void;
}

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

export function DiscountSection({
  cartTotal,
  disabled = false,
  onDiscountChange,
}: DiscountSectionProps) {
  const [availablePoints, setAvailablePoints] = useState(0);
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0);
  const [giftCardCodeInput, setGiftCardCodeInput] = useState("");
  const [appliedGiftCardCode, setAppliedGiftCardCode] = useState<string | null>(null);
  const [giftCardBalance, setGiftCardBalance] = useState(0);
  const [giftCardAmount, setGiftCardAmount] = useState(0);
  const [giftCardLoading, setGiftCardLoading] = useState(false);
  const [giftCardError, setGiftCardError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadLoyaltyBalance = async () => {
      try {
        const response = await fetch("/api/loyalty/balance");
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const points = Number(payload?.data?.availablePoints ?? 0);
        if (!cancelled) {
          setAvailablePoints(Number.isFinite(points) ? points : 0);
        }
      } catch {
        // Optional feature in checkout; no hard failure.
      }
    };

    void loadLoyaltyBalance();
    return () => {
      cancelled = true;
    };
  }, []);

  const maxRedeemablePoints = useMemo(() => {
    const maxByTotal = Math.floor(cartTotal * 100);
    return Math.max(0, Math.min(availablePoints, maxByTotal));
  }, [availablePoints, cartTotal]);

  useEffect(() => {
    if (loyaltyPointsToRedeem > maxRedeemablePoints) {
      setLoyaltyPointsToRedeem(maxRedeemablePoints);
    }
  }, [loyaltyPointsToRedeem, maxRedeemablePoints]);

  const loyaltyDiscountAmount = roundCurrency(loyaltyPointsToRedeem / 100);
  const maxGiftCardUsable = roundCurrency(Math.max(0, cartTotal - loyaltyDiscountAmount));
  const normalizedGiftCardAmount = appliedGiftCardCode
    ? roundCurrency(Math.min(giftCardAmount, giftCardBalance, maxGiftCardUsable))
    : 0;
  const totalDiscount = roundCurrency(
    Math.min(cartTotal, loyaltyDiscountAmount + normalizedGiftCardAmount)
  );

  useEffect(() => {
    if (appliedGiftCardCode && normalizedGiftCardAmount !== giftCardAmount) {
      setGiftCardAmount(normalizedGiftCardAmount);
    }
  }, [appliedGiftCardCode, giftCardAmount, normalizedGiftCardAmount]);

  useEffect(() => {
    onDiscountChange({
      loyaltyPointsToRedeem: loyaltyPointsToRedeem > 0 ? loyaltyPointsToRedeem : undefined,
      loyaltyDiscountAmount: loyaltyDiscountAmount > 0 ? loyaltyDiscountAmount : 0,
      giftCardCode: appliedGiftCardCode || undefined,
      giftCardAmount: normalizedGiftCardAmount > 0 ? normalizedGiftCardAmount : undefined,
      totalDiscount,
    });
  }, [
    appliedGiftCardCode,
    loyaltyDiscountAmount,
    loyaltyPointsToRedeem,
    normalizedGiftCardAmount,
    onDiscountChange,
    totalDiscount,
  ]);

  const applyGiftCard = async () => {
    const trimmedCode = giftCardCodeInput.trim();
    if (!trimmedCode) {
      setGiftCardError("Enter a gift card code.");
      return;
    }

    setGiftCardLoading(true);
    setGiftCardError(null);

    try {
      const response = await fetch(
        `/api/gift-cards/${encodeURIComponent(trimmedCode)}`
      );
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message || "Gift card is not valid.");
      }

      const card = payload.data;
      if (!card?.isValid) {
        throw new Error(card?.validationMessage || "Gift card is not valid.");
      }

      const balance = Number(card.balance ?? 0);
      if (!Number.isFinite(balance) || balance <= 0) {
        throw new Error("Gift card has no remaining balance.");
      }

      const initialAmount = roundCurrency(Math.min(balance, maxGiftCardUsable));
      setAppliedGiftCardCode(card.code || trimmedCode);
      setGiftCardBalance(balance);
      setGiftCardAmount(initialAmount);
      setGiftCardError(null);
      toast.success("Gift card applied.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to apply gift card.";
      setGiftCardError(message);
      toast.error(message);
    } finally {
      setGiftCardLoading(false);
    }
  };

  const clearGiftCard = () => {
    setAppliedGiftCardCode(null);
    setGiftCardBalance(0);
    setGiftCardAmount(0);
    setGiftCardError(null);
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="text-base font-medium">Discounts</h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="loyalty-points-slider">Loyalty points</Label>
          <span className="text-xs text-muted-foreground">
            {availablePoints.toLocaleString()} available
          </span>
        </div>
        <Slider
          id="loyalty-points-slider"
          disabled={disabled || maxRedeemablePoints <= 0}
          min={0}
          max={maxRedeemablePoints}
          step={100}
          value={[loyaltyPointsToRedeem]}
          onValueChange={(value) => {
            setLoyaltyPointsToRedeem(value[0] ?? 0);
          }}
        />
        <p className="text-sm text-muted-foreground">
          Redeem {loyaltyPointsToRedeem.toLocaleString()} points ={" "}
          {formatPrice(loyaltyDiscountAmount)} off
        </p>
      </div>

      <div className="space-y-3 border-t pt-4">
        <Label htmlFor="gift-card-code">Gift card</Label>
        <div className="flex gap-2">
          <Input
            id="gift-card-code"
            placeholder="Enter gift card code"
            value={giftCardCodeInput}
            disabled={disabled}
            onChange={(event) => setGiftCardCodeInput(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled || giftCardLoading}
            onClick={applyGiftCard}
          >
            {giftCardLoading ? "Applying..." : "Apply"}
          </Button>
        </div>

        {giftCardError && (
          <p className="text-sm text-red-600" role="alert">
            {giftCardError}
          </p>
        )}

        {appliedGiftCardCode && (
          <div className="space-y-2 rounded-md bg-muted/50 p-3">
            <p className="text-sm">
              Applied: <span className="font-medium">{appliedGiftCardCode}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Available balance: {formatPrice(giftCardBalance)}
            </p>
            <div className="space-y-1">
              <Label htmlFor="gift-card-amount">Amount to use</Label>
              <Input
                id="gift-card-amount"
                type="number"
                min={0}
                step={0.01}
                max={Math.min(giftCardBalance, maxGiftCardUsable)}
                value={giftCardAmount}
                disabled={disabled}
                onChange={(event) =>
                  setGiftCardAmount(Number(event.target.value || 0))
                }
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={clearGiftCard}
            >
              Remove gift card
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-1 border-t pt-4 text-sm">
        <div className="flex items-center justify-between">
          <span>Loyalty discount</span>
          <span>-{formatPrice(loyaltyDiscountAmount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Gift card discount</span>
          <span>-{formatPrice(normalizedGiftCardAmount)}</span>
        </div>
        <div className="flex items-center justify-between font-medium">
          <span>Total discount</span>
          <span>-{formatPrice(totalDiscount)}</span>
        </div>
      </div>
    </div>
  );
}

