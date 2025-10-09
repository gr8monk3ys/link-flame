"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy,
  Mail,
  Check,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

interface ReferralShareCardProps {
  referralCode: string;
  referralLink: string;
  discountPercent: number;
  rewardPoints: number;
}

export function ReferralShareCard({
  referralCode,
  referralLink,
  discountPercent,
  rewardPoints,
}: ReferralShareCardProps) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  async function copyToClipboard(text: string, type: "code" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success(`${type === "code" ? "Code" : "Link"} copied to clipboard!`);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  }

  function shareViaEmail() {
    const subject = encodeURIComponent("Get 10% off at Link Flame!");
    const body = encodeURIComponent(
      `Hey!\n\nI thought you might like Link Flame - they have amazing eco-friendly products. Use my referral code to get ${discountPercent}% off your first order!\n\nCode: ${referralCode}\nLink: ${referralLink}\n\nHappy shopping!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  }

  function shareToFacebook() {
    const message = encodeURIComponent(
      `Join Link Flame and get ${discountPercent}% off your first order with my referral code: ${referralCode}`
    );
    const url = encodeURIComponent(referralLink);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${message}`,
      "_blank",
      "width=600,height=400"
    );
  }

  function shareToTwitter() {
    const message = encodeURIComponent(
      `Join Link Flame and get ${discountPercent}% off your first order with my referral code: ${referralCode}`
    );
    const url = encodeURIComponent(referralLink);
    window.open(
      `https://twitter.com/intent/tweet?text=${message}&url=${url}`,
      "_blank",
      "width=600,height=400"
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="size-5" />
          Share and Earn
        </CardTitle>
        <CardDescription>
          Give friends {discountPercent}% off and earn {rewardPoints} loyalty points for each successful referral!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Referral Code</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={referralCode}
                readOnly
                className="bg-background pr-10 font-mono text-lg font-bold tracking-wider"
                aria-label="Your referral code"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(referralCode, "code")}
              aria-label="Copy referral code"
            >
              {copied === "code" ? (
                <Check className="size-4 text-green-500" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Referral Link</label>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="bg-background font-mono text-sm"
              aria-label="Your referral link"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(referralLink, "link")}
              aria-label="Copy referral link"
            >
              {copied === "link" ? (
                <Check className="size-4 text-green-500" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Share via</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={shareViaEmail}
              className="flex items-center gap-2"
            >
              <Mail className="size-4" />
              Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={shareToFacebook}
              className="flex items-center gap-2"
            >
              <svg
                className="size-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={shareToTwitter}
              className="flex items-center gap-2"
            >
              <svg
                className="size-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X / Twitter
            </Button>
          </div>
        </div>

        {/* Reward Summary */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm">
            <span className="text-muted-foreground">They get:</span>{" "}
            <span className="font-semibold">{discountPercent}% off first order</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">You get:</span>{" "}
            <span className="font-semibold text-primary">{rewardPoints} points</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
