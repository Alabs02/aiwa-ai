"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  CreditCard,
  Zap
} from "lucide-react";
import { AdminUsersTable } from "./admin-users-table";
import { AdminAnalyticsCharts } from "./admin-analytics-charts";

interface Analytics {
  usage: {
    total_events: number | string;
    total_tokens: number | string;
    total_input_tokens?: number | string;
    total_output_tokens?: number | string;
    total_cost?: number | string;
    total_cost_cents?: number | string;
    total_credits_used: number | string;
  };
  users: {
    total_users: number | string;
    free_users: number | string;
    pro_users: number | string;
    advanced_users: number | string;
    ultimate_users: number | string;
  };
  revenue: {
    total_revenue: number | string;
    subscription_revenue: number | string;
    credit_revenue: number | string;
  };
}

export function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Helper function to safely convert to number
  const toNumber = (value: number | string | undefined): number => {
    if (value === undefined || value === null) return 0;
    return typeof value === "string" ? Number(value) || 0 : value;
  };

  // Safely extract and convert values from API response
  const usage = analytics?.usage as any;
  const users = analytics?.users as any;
  const revenue = analytics?.revenue as any;

  // Usage metrics
  const totalEvents = toNumber(usage?.total_events);
  const totalTokens = toNumber(usage?.total_tokens);
  const totalInputTokens = toNumber(usage?.total_input_tokens);
  const totalOutputTokens = toNumber(usage?.total_output_tokens);
  const totalCost = toNumber(usage?.total_cost || usage?.total_cost_cents);
  const totalCreditsUsed = toNumber(usage?.total_credits_used);

  // User metrics
  const totalUsers = toNumber(users?.total_users);
  const freeUsers = toNumber(users?.free_users);
  const proUsers = toNumber(users?.pro_users);
  const advancedUsers = toNumber(users?.advanced_users);
  const ultimateUsers = toNumber(users?.ultimate_users);

  // Revenue metrics (all in cents)
  const totalRevenue = toNumber(revenue?.total_revenue);
  const subscriptionRevenue = toNumber(revenue?.subscription_revenue);
  const creditRevenue = toNumber(revenue?.credit_revenue);

  // Calculate derived metrics
  const mrr = (subscriptionRevenue / 100).toFixed(2);
  const arr = ((subscriptionRevenue * 12) / 100).toFixed(2);
  const avgCostPerGen =
    totalEvents > 0 ? (totalCost / totalEvents / 100).toFixed(4) : "0.00";
  const avgTokensPerGen =
    totalEvents > 0 ? Math.round(totalTokens / totalEvents) : 0;

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">AIWA Studio</h1>
          <p className="text-muted-foreground">
            System administration and analytics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalUsers.toLocaleString()}
              </div>
              <p className="text-muted-foreground text-xs">
                {proUsers.toLocaleString()} Pro •{" "}
                {advancedUsers.toLocaleString()} Advanced •{" "}
                {ultimateUsers.toLocaleString()} Ultimate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <DollarSign className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${mrr}</div>
              <p className="text-muted-foreground text-xs">ARR: ${arr}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Generations
              </CardTitle>
              <Activity className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalEvents.toLocaleString()}
              </div>
              <p className="text-muted-foreground text-xs">
                Avg {avgTokensPerGen.toLocaleString()} tokens/gen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">V0 API Cost</CardTitle>
              <CreditCard className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(totalCost / 100).toFixed(2)}
              </div>
              <p className="text-muted-foreground text-xs">
                ${avgCostPerGen} per generation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Free</span>
                      <span className="font-medium">
                        {freeUsers.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pro</span>
                      <span className="font-medium">
                        {proUsers.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Advanced</span>
                      <span className="font-medium">
                        {advancedUsers.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Ultimate</span>
                      <span className="font-medium">
                        {ultimateUsers.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Token Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Tokens</span>
                      <span className="font-medium">
                        {totalTokens.toLocaleString()}
                      </span>
                    </div>
                    {totalInputTokens > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Input Tokens</span>
                        <span className="font-medium">
                          {totalInputTokens.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {totalOutputTokens > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Output Tokens</span>
                        <span className="font-medium">
                          {totalOutputTokens.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Credits Used</span>
                      <span className="font-medium">
                        {totalCreditsUsed.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Revenue</span>
                      <span className="font-medium">
                        ${(totalRevenue / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Subscription Revenue</span>
                      <span className="font-medium">
                        ${(subscriptionRevenue / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Credit Revenue</span>
                      <span className="font-medium">
                        ${(creditRevenue / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t pt-2">
                      <span className="text-sm font-semibold">MRR</span>
                      <span className="font-bold">${mrr}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">ARR</span>
                      <span className="font-bold">${arr}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <AdminUsersTable />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalyticsCharts />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
