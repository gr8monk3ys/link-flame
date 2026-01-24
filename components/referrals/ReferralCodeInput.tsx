"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, Gift, Tag } from "lucide-react";
import { toast } from "sonner";

interface ReferralCodeInputProps {
  onCodeApplied?: (code: string, discountPercent: number) => void;
  onCodeRemoved?: () => void;
  disabled?: boolean;
  className?: string;
}

interface ValidationResult {
  valid: boolean;
  code: string;
  discountPercent: number;
  message: string;
}

export function ReferralCodeInput({
  onCodeApplied,
  onCodeRemoved,
  disabled = false,
  className = "",
}: ReferralCodeInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function validateCode() {
    if (!code.trim()) {
      setError("Please enter a referral code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/referrals/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.trim(), apply: false }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error?.message || "Invalid referral code");
        return;
      }

      // Code is valid
      setApplied({
        valid: true,
        code: data.data.code,
        discountPercent: data.data.discountPercent,
        message: data.data.message,
      });

      toast.success(data.data.message);
      onCodeApplied?.(data.data.code, data.data.discountPercent);
    } catch (err) {
      console.error("Failed to validate referral code:", err);
      setError("Failed to validate code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function removeCode() {
    setApplied(null);
    setCode("");
    setError(null);
    onCodeRemoved?.();
    toast.info("Referral code removed");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      validateCode();
    }
  }

  // Show applied state
  if (applied) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label className="flex items-center gap-2">
          <Tag className="size-4" />
          Referral Code Applied
        </Label>
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3">
          <Check className="size-5 text-green-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold">{applied.code}</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {applied.discountPercent}% off
              </Badge>
            </div>
            <p className="text-sm text-green-700">{applied.message}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeCode}
            disabled={disabled}
            className="text-green-700 hover:bg-green-100 hover:text-green-900"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="referral-code" className="flex items-center gap-2">
        <Gift className="size-4" />
        Have a referral code?
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="referral-code"
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter code (e.g., ECO-A7X9K2)"
            disabled={disabled || loading}
            className={`font-mono uppercase ${error ? "border-red-500" : ""}`}
            aria-invalid={!!error}
            aria-describedby={error ? "referral-error" : undefined}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={validateCode}
          disabled={disabled || loading || !code.trim()}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Apply"
          )}
        </Button>
      </div>
      {error && (
        <p id="referral-error" className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Apply a friend&apos;s referral code to get a discount on your first order.
      </p>
    </div>
  );
}
