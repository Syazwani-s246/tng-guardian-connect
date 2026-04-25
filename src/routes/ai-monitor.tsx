import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionReview } from "@/components/TransactionReview";
import { Bot, CheckCircle2, AlertTriangle, Activity, Clock, RefreshCw } from "lucide-react";
import type { TransactionRecord } from "@/types/transaction";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "https://goguardian-api.example.com/prod";

const DEFAULT_USER_ID = "user-001";

interface AuditLogResponse {
  userId: string;
  total: number;
  transactions: TransactionRecord[];
}

async function fetchTransactions(userId: string): Promise<AuditLogResponse> {
  const res = await fetch(`${API_BASE_URL}/audit/${userId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch transactions (${res.status})`);
  }
  return res.json();
}

export function sortTransactionsByTimestampDesc(
  transactions: TransactionRecord[],
): TransactionRecord[] {
  return [...transactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

/**
 * Count the number of blocked transactions in an array of TransactionRecord objects.
 * A transaction is considered blocked if its decision is "BLOCKED" or "BLOCK".
 */
export function getBlockedCount(transactions: TransactionRecord[]): number {
  return transactions.filter(
    (t) => t.decision === "BLOCKED" || t.decision === "BLOCK",
  ).length;
}

export const Route = createFileRoute("/ai-monitor")({
  head: () => ({
    meta: [
      { title: "AI Guardian — GOGuardian" },
      {
        name: "description",
        content:
          "AI monitors your transactions in real time and flags suspicious activity.",
      },
    ],
  }),
  component: AIMonitor,
});

function getDecisionStyle(decision: string) {
  const normalized = decision.toUpperCase();
  if (normalized === "APPROVED" || normalized === "APPROVE") {
    return {
      icon: <CheckCircle2 size={18} />,
      bg: "bg-success-soft text-success",
      label: "Approved",
    };
  }
  if (normalized === "BLOCKED" || normalized === "BLOCK") {
    return {
      icon: <AlertTriangle size={18} />,
      bg: "bg-warning-soft text-warning-foreground",
      label: "Blocked",
    };
  }
  // PENDING / HOLD / anything else
  return {
    icon: <Clock size={18} />,
    bg: "bg-muted text-muted-foreground",
    label: "Pending",
  };
}

function formatAmount(amount: number): string {
  return `RM${amount.toFixed(2)}`;
}

function formatRelativeTime(timestamp: string): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

function AIMonitor() {
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AuditLogResponse>({
    queryKey: ["audit-log", DEFAULT_USER_ID],
    queryFn: () => fetchTransactions(DEFAULT_USER_ID),
  });

  const transactions = data
    ? sortTransactionsByTimestampDesc(data.transactions)
    : [];

  const totalCount = data?.total ?? 0;
  const blockedCount = getBlockedCount(data?.transactions ?? []);

  function handleReview(txn: TransactionRecord) {
    setSelectedTransaction(txn);
    setSheetOpen(true);
  }

  return (
    <PhoneShell title="AI Guardian" showBack backTo="/guardian">
      <div className="px-5 pt-6 space-y-5">
        {/* Status */}
        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-3xl p-6 shadow-elevated">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
              <Bot size={30} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80">
                Active
              </p>
              <h2 className="text-xl font-bold">
                AI is monitoring your transactions
              </h2>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 text-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
            </span>
            <span className="opacity-95">
              Live · checked {totalCount} transactions · {blockedCount} blocked
            </span>
          </div>
        </div>

        {/* Activity log */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Activity size={18} className="text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Recent activity
            </h3>
          </div>

          {isLoading && <TransactionListSkeleton />}

          {isError && (
            <div className="bg-card rounded-3xl shadow-card border border-border p-6 text-center space-y-3">
              <p className="text-sm text-destructive font-medium">
                {error?.message ?? "Failed to load transactions"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-2"
              >
                <RefreshCw size={14} />
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !isError && transactions.length === 0 && (
            <div className="bg-card rounded-3xl shadow-card border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No transactions monitored yet. Your activity will appear here.
              </p>
            </div>
          )}

          {!isLoading && !isError && transactions.length > 0 && (
            <div className="bg-card rounded-3xl shadow-card border border-border divide-y divide-border overflow-hidden">
              {transactions.map((txn) => {
                const style = getDecisionStyle(txn.decision);
                return (
                  <div key={txn.txnId} className="flex items-start gap-3 p-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${style.bg}`}
                    >
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {txn.receiverName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatAmount(txn.amount)} ·{" "}
                        {formatRelativeTime(txn.timestamp)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0 text-xs" onClick={() => handleReview(txn)}>
                      Review
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Button
          asChild
          size="lg"
          className="w-full h-14 text-base font-semibold rounded-2xl shadow-card"
        >
          <Link to="/demo" search={{ mode: "ai", step: "alert" } as never}>
            Try a demo alert
          </Link>
        </Button>

        <TransactionReview
          transaction={selectedTransaction}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      </div>
    </PhoneShell>
  );
}

function TransactionListSkeleton() {
  return (
    <div className="bg-card rounded-3xl shadow-card border border-border divide-y divide-border overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-16 rounded-md shrink-0" />
        </div>
      ))}
    </div>
  );
}
