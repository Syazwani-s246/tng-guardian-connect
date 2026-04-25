import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import {
  ShieldCheck,
  QrCode,
  ArrowRightLeft,
  Receipt,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getUser, getRecentTransactions } from "@/lib/api";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [{ title: "Home — TNG eWallet" }],
  }),
  component: HomeScreen,
});

const txMeta: Record<string, { initials: string; bg: string; text: string; category: string }> = {
  Grab:               { initials: "G", bg: "bg-green-100",  text: "text-green-700",  category: "Transport" },
  TNB:                { initials: "T", bg: "bg-yellow-100", text: "text-yellow-700", category: "Utilities" },
  "99 Speedmart":     { initials: "9", bg: "bg-red-100",    text: "text-red-700",    category: "Groceries" },
  "Unknown Recipient":{ initials: "?", bg: "bg-gray-100",   text: "text-gray-500",   category: "Unknown" },
  "Fast Investment Co":{ initials: "F", bg: "bg-orange-100", text: "text-orange-700", category: "Investment" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}

function HomeScreen() {
  const [showBalance, setShowBalance] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [userName, setUserName] = useState("Hi there");
  const [transactions, setTransactions] = useState<Awaited<ReturnType<typeof getRecentTransactions>>>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getUser().then((u) => {
      setBalance(u.balance);
      setUserName(u.name);
    });
    getRecentTransactions().then(setTransactions);
  }, []);

  return (
    <PhoneShell>
      {/* Blue header */}
      <div className="bg-primary text-primary-foreground px-5 pt-3 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/70 text-xs mb-0.5">Good morning,</p>
            <h1 className="text-[17px] font-semibold leading-tight">Hi, {userName} 👋</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-xs font-bold tracking-wide">
            MR
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-3 pb-6">
        {/* Balance card */}
        <div className="bg-card rounded-2xl px-5 py-4 shadow-elevated border border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground font-medium">eWallet Balance</span>
            <button
              onClick={() => setShowBalance((v) => !v)}
              className="text-muted-foreground p-1 -mr-1 rounded-full hover:bg-muted transition-colors"
              aria-label={showBalance ? "Hide balance" : "Show balance"}
            >
              {showBalance ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <div className="text-[28px] font-bold text-foreground tracking-tight">
            {showBalance
              ? balance !== null
                ? `RM ${balance.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`
                : "Loading..."
              : "RM ••••••"}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Updated just now</p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              { icon: QrCode, label: "Scan QR", onClick: undefined },
              {
                icon: ArrowRightLeft,
                label: "Transfer",
                onClick: () => navigate({ to: "/transfer" }),
              },
              { icon: Receipt, label: "Pay Bills", onClick: undefined },
              { icon: RefreshCw, label: "Reload", onClick: undefined },
            ] as const
          ).map(({ icon: Icon, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex flex-col items-center gap-2 py-3 px-1 rounded-2xl bg-card border border-border hover:bg-primary-soft active:scale-95 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center">
                <Icon size={18} className="text-primary" />
              </div>
              <span className="text-[11px] font-medium text-foreground text-center leading-tight">
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* GOGuardian AI Protection banner */}
        <Link to="/ai-monitor" className="block">
          <div className="flex items-center gap-3 bg-card rounded-2xl px-4 py-3.5 border border-border shadow-card hover:bg-primary-soft/30 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">GOGuardian AI</p>
              <p className="text-xs text-muted-foreground">AI Protection Active</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="bg-success-soft text-success text-[11px] font-semibold px-2 py-0.5 rounded-full">
                Active
              </span>
              <ChevronRight size={15} className="text-muted-foreground" />
            </div>
          </div>
        </Link>

        {/* Recent transactions */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-semibold text-foreground">Recent Transactions</h2>
            <Link to="/me" className="text-xs text-primary font-medium">See all</Link>
          </div>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            {transactions.slice(0, 3).map((tx) => {
              const meta = txMeta[tx.recipient] ?? {
                initials: tx.recipient[0],
                bg: "bg-gray-100",
                text: "text-gray-500",
                category: "Transfer",
              };
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${meta.bg} ${meta.text}`}>
                    {meta.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{tx.recipient}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {meta.category} · {formatDate(tx.date)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground shrink-0">
                    -RM {tx.amount.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}
