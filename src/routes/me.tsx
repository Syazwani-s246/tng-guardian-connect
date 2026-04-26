import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { getUser, getRecentTransactions } from "@/lib/api";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [{ title: "My Profile — TNG eWallet" }],
  }),
  component: MeScreen,
});

type RawTx = Awaited<ReturnType<typeof getRecentTransactions>>[number];

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-success-soft text-success-foreground">
        <CheckCircle2 size={10} />
        Approved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-destructive-soft text-destructive">
      <AlertTriangle size={10} />
      Blocked
    </span>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MeScreen() {
  const [user, setUser] = useState<{ name: string; phone: string; protection: string } | null>(null);
  const [transactions, setTransactions] = useState<RawTx[]>([]);
  const [markedScam, setMarkedScam] = useState<Set<number>>(new Set());

  useEffect(() => {
    getUser().then(setUser);
    getRecentTransactions().then((txs) => {
      setTransactions(txs);
      setMarkedScam(new Set(txs.filter((t) => t.scam_marked).map((t) => t.id)));
    });
  }, []);

  return (
    <PhoneShell title="My Profile">
      <div className="px-5 pt-6 space-y-6">
        {/* Profile card */}
        <div className="bg-card rounded-3xl p-5 shadow-card border border-border flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-soft text-primary flex items-center justify-center text-2xl font-bold shrink-0">
            M
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-lg">{user?.name ?? "Loading..."}</p>
            <p className="text-sm text-muted-foreground">{user?.phone}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{user?.protection}</p>
          </div>
          <Link to="/settings" aria-label="Settings">
            <Settings size={20} className="text-muted-foreground hover:text-foreground transition-colors" />
          </Link>
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">Transaction History</h2>
          <div className="bg-card rounded-3xl shadow-card border border-border overflow-hidden">
            {transactions.map((tx, i) => {
              const isMarked = markedScam.has(tx.id);
              const canMark =
                tx.status === "approved" &&
                !tx.scam_marked &&
                !isMarked &&
                "mark_deadline" in tx &&
                new Date() <= new Date(tx.mark_deadline as string);
              const showSafe = "safe" in tx && tx.safe === true;

              return (
                <div
                  key={tx.id}
                  className={`px-5 py-4 ${i < transactions.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-base">
                          RM {tx.amount.toFixed(2)}
                        </span>
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
                      {showSafe && !isMarked && (
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
