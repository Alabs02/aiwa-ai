"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface WebhookLog {
  id: string;
  stripe_event_id: string;
  event_type: string;
  user_email: string | null;
  amount: number | null;
  currency: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

export function AdminWebhookLogs() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/admin/webhooks");
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
      }
    } catch (error) {
      console.error("Failed to fetch webhook logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (eventId: string) => {
    setResending(eventId);
    try {
      const response = await fetch("/api/admin/webhooks/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId })
      });

      if (response.ok) {
        toast.success("Webhook resent successfully");
        fetchLogs();
      } else {
        toast.error("Failed to resend webhook");
      }
    } catch (error) {
      toast.error("Error resending webhook");
    } finally {
      setResending(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <CheckCircle className="mr-1 h-3 w-3" />
            Success
          </Badge>
        );
      case "failed":
        return (
          <Badge className="border-red-500/20 bg-red-500/10 text-red-400">
            <AlertCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="border-yellow-500/20 bg-yellow-500/10 text-yellow-400">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Webhook Logs</h2>
          <p className="text-muted-foreground text-sm">
            Monitor and reconcile Stripe webhook events
          </p>
        </div>
        <Button onClick={fetchLogs} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No webhook logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">
                    {log.event_type}
                  </TableCell>
                  <TableCell>{log.user_email || "-"}</TableCell>
                  <TableCell>
                    {log.amount && log.currency
                      ? `${log.currency.toUpperCase()} ${(log.amount / 100).toFixed(2)}`
                      : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-red-400">
                    {log.error_message || "-"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {log.status === "failed" && (
                      <Button
                        onClick={() => handleResend(log.stripe_event_id)}
                        disabled={resending === log.stripe_event_id}
                        variant="outline"
                        size="sm"
                      >
                        {resending === log.stripe_event_id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          "Resend"
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
