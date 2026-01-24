import { ReferralDashboard } from "@/components/referrals";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Referral Program | Link Flame",
  description: "Share your referral code with friends and earn rewards when they make their first purchase.",
};

export default function ReferralsPage() {
  return (
    <div className="container max-w-4xl py-10">
      <ReferralDashboard />
    </div>
  );
}
