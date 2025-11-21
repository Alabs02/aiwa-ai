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
    total_events: number;
    total_tokens: number;
    avg_tokens_per_generation: number;
    total_cost_cents: number;
    total_credits_used: number;
  };
  users: {
    total: number;
    free: number;
    pro: number;
    advanced: number;
  };
  revenue: {
    total_usd: string;
    mrr_cents: number;
    arr_cents: number;
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

  const mrr = analytics
    ? (analytics.revenue.mrr_cents / 100).toFixed(2)
    : "0.00";
  const arr = analytics
    ? (analytics.revenue.arr_cents / 100).toFixed(2)
    : "0.00";
  const avgCostPerGen = analytics
    ? (
        analytics.usage.total_cost_cents /
        analytics.usage.total_events /
        100
      ).toFixed(4)
    : "0.00";

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
                {analytics?.users.total || 0}
              </div>
              <p className="text-muted-foreground text-xs">
                {analytics?.users.pro || 0} Pro •{" "}
                {analytics?.users.advanced || 0} Advanced
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
                {analytics?.usage.total_events.toLocaleString() || 0}
              </div>
              <p className="text-muted-foreground text-xs">
                Avg{" "}
                {analytics?.usage.avg_tokens_per_generation.toLocaleString() ||
                  0}{" "}
                tokens/gen
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
                $
                {(analytics?.usage.total_cost_cents
                  ? analytics.usage.total_cost_cents / 100
                  : 0
                ).toFixed(2)}
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
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Free</span>
                      <span className="font-medium">
                        {analytics?.users.free || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pro</span>
                      <span className="font-medium">
                        {analytics?.users.pro || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Advanced</span>
                      <span className="font-medium">
                        {analytics?.users.advanced || 0}
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
                        {analytics?.usage.total_tokens.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Credits Used</span>
                      <span className="font-medium">
                        {analytics?.usage.total_credits_used.toLocaleString() ||
                          0}
                      </span>
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
