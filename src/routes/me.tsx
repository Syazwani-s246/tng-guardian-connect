import { createFileRoute } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Bot, ShieldAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";

type TxStatus = "Approved" | "Blocked" | "AI Decided";

interface Transaction {
  id: string;
  amount: string;
  recipient: string;
  date: Date;
  status: TxStatus;
  preMarked?: boolean;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx1",
    amount: "RM 500.00",
    recipient: "Unknown Recipient",
    date: new Date("2026-04-22"),
    status: "Approved",
  },
  {
    id: "tx2",
    amount: "RM 1,200.00",
    recipient: "Fast Investment Co",
    date: new Date("2026-04-20"),
    status: "Approved",
    preMarked: true,
  },
  {
    id: "tx3",
    amount: "RM 350.00",
    recipient: "Ali bin Ahmad",
    date: new Date("2026-04-24"),
    status: "Blocked",
  },
  {
    id: "tx4",
    amount: "RM 200.00",
    recipient: "John Tan",
    date: new Date("2026-04-13"),
    status: "Approved",
  },
];

function daysSince(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: TxStatus }) {
  if (status === "Approved") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-success-soft text-success-foreground">
        <CheckCircle2 size={10} />
        Approved
      </span>
    );
  }
  if (status === "Blocked") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-destructive-soft text-destructive">
        <AlertTriangle size={10} />
        Blocked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-soft text-primary">
      <Bot size={10} />
      AI Decided
    </span>
  );
}

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "My Profile — GOGuardian" },
      { name: "description", content: "View your profile and recent flagged transactions." },
    ],
  }),
  component: MeScreen,
});

function MeScreen() {
  const [markedScam, setMarkedScam] = useState<Set<string>>(
    () => new Set(MOCK_TRANSACTIONS.filter((t) => t.preMarked).map((t) => t.id))
  );

  return (
    <PhoneShell title="My Profile">
      <div className="px-5 pt-6 space-y-6">
        {/* Profile card */}
        <div className="bg-card rounded-3xl p-5 shadow-card border border-border flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-soft text-primary flex items-center justify-center text-2xl font-bold shrink-0">
            M
          </div>
          <div>
            <p className="font-semibold text-foreground text-lg">Mak Cik Rohani</p>
            <p className="text-sm text-muted-foreground">rohani@example.com</p>
            <p className="text-xs text-muted-foreground mt-0.5">Protected Member</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">Recent Flagged Transactions</h2>
          <div className="bg-card rounded-3xl shadow-card border border-border overflow-hidden">
            {MOCK_TRANSACTIONS.map((tx, i) => {
              const days = daysSince(tx.date);
              const isMarked = markedScam.has(tx.id);
              const canMark = tx.status === "Approved" && days <= 7 && !isMarked;
              const showSafe = tx.status === "Approved" && days > 7 && !isMarked;

              return (
                <div
                  key={tx.id}
                  className={`px-5 py-4 ${i < MOCK_TRANSACTIONS.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-base">{tx.amount}</span>
                        <StatusBadge status={tx.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">{tx.recipient}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(tx.date)}</p>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2 pt-0.5">
                      {isMarked && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-destructive-soft text-destructive">
                          <ShieldAlert size={10} />
                          Reported as Scam
                        </span>
                      )}
                      {showSafe && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-success-soft text-success-foreground">
                          <ShieldCheck size={10} />
                          Safe
                        </span>
                      )}
                      {canMark && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs font-semibold rounded-xl border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => setMarkedScam((prev) => new Set([...prev, tx.id]))}
                        >
                          Mark as Scam
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Approved transactions can be reported within 7 days.
          </p>
        </div>
      </div>
    </PhoneShell>
  );
}
