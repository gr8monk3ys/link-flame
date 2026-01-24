"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReferralShareCard } from "./ReferralShareCard";
import {
  Users,
  Clock,
  Gift,
  Star,
  Loader2,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface ReferralStats {
  referralCode: string | null;
  totalReferred: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalPointsEarned: number;
  referralLink: string;
  rewardPointsPerReferral: number;
  discountPercentForReferee: number;
}

interface ReferralItem {
  id: string;
  refereeName: string;
  status: string;
  statusLabel: string;
  rewardPoints: number;
  discountApplied: number | null;
  createdAt: string;
  completedAt: string | null;
}

export function ReferralDashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchData();
    }
  }, [sessionStatus]);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      // Fetch stats and referrals in parallel
      const [statsRes, referralsRes] = await Promise.all([
        fetch("/api/referrals/stats"),
        fetch("/api/referrals/list"),
      ]);

      if (!statsRes.ok || !referralsRes.ok) {
        throw new Error("Failed to fetch referral data");
      }

      const [statsData, referralsData] = await Promise.all([
        statsRes.json(),
        referralsRes.json(),
      ]);

      setStats(statsData.data);
      setReferrals(referralsData.data || []);
    } catch (err) {
      console.error("Failed to fetch referral data:", err);
      setError("Failed to load referral data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sessionStatus !== "authenticated") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign In Required</CardTitle>
          <CardDescription>
            Please sign in to access your referral dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign In
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="mr-2 size-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Referral Program</h2>
          <p className="text-muted-foreground">
            Share your code and earn rewards when friends make their first purchase.
          </p>
        </div>
        <Button onClick={fetchData} variant="ghost" size="sm" aria-label="Refresh referral data">
          <RefreshCw className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Share Card */}
      <ReferralShareCard
        referralCode={stats.referralCode || ""}
        referralLink={stats.referralLink}
        discountPercent={stats.discountPercentForReferee}
        rewardPoints={stats.rewardPointsPerReferral}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex size-12 items-center justify-center rounded-lg bg-blue-500/10">
              <Users className="size-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Referred</p>
              <p className="text-2xl font-bold">{stats.totalReferred}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex size-12 items-center justify-center rounded-lg bg-yellow-500/10">
              <Clock className="size-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pendingReferrals}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex size-12 items-center justify-center rounded-lg bg-green-500/10">
              <Gift className="size-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{stats.completedReferrals}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex size-12 items-center justify-center rounded-lg bg-purple-500/10">
              <Star className="size-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Points Earned</p>
              <p className="text-2xl font-bold">{stats.totalPointsEarned}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Referrals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Referrals</CardTitle>
          <CardDescription>
            Track the status of people you&apos;ve referred
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Users className="mx-auto mb-4 size-12 opacity-50" />
              <p className="text-lg font-medium">No referrals yet</p>
              <p className="mt-1 text-sm">
                Share your referral code with friends to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between border-b py-4 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-semibold text-primary">
                        {referral.refereeName?.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{referral.refereeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={referral.status} />
                    {referral.status === "REWARDED" && (
                      <span className="text-sm font-medium text-green-600">
                        +{referral.rewardPoints} pts
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How it Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex gap-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                1
              </div>
              <div>
                <h4 className="font-medium">Share Your Code</h4>
                <p className="text-sm text-muted-foreground">
                  Send your unique referral code or link to friends and family.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                2
              </div>
              <div>
                <h4 className="font-medium">They Get {stats.discountPercentForReferee}% Off</h4>
                <p className="text-sm text-muted-foreground">
                  Your friends receive {stats.discountPercentForReferee}% off their first order.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                3
              </div>
              <div>
                <h4 className="font-medium">You Earn {stats.rewardPointsPerReferral} Points</h4>
                <p className="text-sm text-muted-foreground">
                  When they complete their purchase, you earn loyalty points.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Pending
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          Completed
        </Badge>
      );
    case "REWARDED":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Rewarded
        </Badge>
      );
    case "EXPIRED":
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          Expired
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
