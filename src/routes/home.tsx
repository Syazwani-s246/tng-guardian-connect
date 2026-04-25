import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import {
  ShieldCheck,
  QrCode,
  ArrowRightLeft,
  Receipt,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getUser, getRecentTransactions } from "@/lib/api";
import { walletStore } from "@/lib/walletStore";

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

const SUPPORT_OPTIONS = [
  "Report a Scam",
  "Dispute a Transaction",
  "Contact Us",
];

function HomeScreen() {
  const [showBalance, setShowBalance] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [userName, setUserName] = useState("Hi there");
  const [transactions, setTransactions] = useState<Awaited<ReturnType<typeof getRecentTransactions>>>([]);
  const [showSupport, setShowSupport] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getUser().then((u) => {
      setUserName(u.name);
    });
    setBalance(walletStore.balance);
    getRecentTransactions().then(setTransactions);
  }, []);

  function triggerToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    setShowToast(true);
    toastTimer.current = setTimeout(() => setShowToast(false), 2500);
  }

  return (
    <PhoneShell>
      {/* Support bottom sheet overlay */}
      {showSupport && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowSupport(false)}
          />
          <div className="relative bg-background rounded-t-3xl z-10 pb-8">
            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <h2 className="text-base font-bold text-foreground">Customer Support</h2>
              <button
                onClick={() => setShowSupport(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Options */}
            <div className="divide-y divide-border">
              {SUPPORT_OPTIONS.map((option) => (
                <button
                  key={option}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted active:bg-muted transition-colors text-left"
                  onClick={() => {
                    setShowSupport(false);
                    triggerToast("Connecting to support...");
                  }}
                >
                  <span className="text-sm font-medium text-foreground">{option}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {showToast && (
        <div className="absolute top-14 left-4 right-4 z-50 bg-foreground text-background text-sm font-medium px-4 py-3 rounded-2xl shadow-elevated text-center">
          {toastMsg}
        </div>
      )}

      {/* Blue header */}
      <div className="bg-primary text-primary-foreground px-5 pt-3 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/70 text-xs mb-0.5">Good morning,</p>
            <h1 className="text-[17px] font-semibold leading-tight">Hi, {userName}</h1>
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
              { icon: QrCode, label: "Scan QR", onClick: undefined, svg: null },
              {
                icon: ArrowRightLeft,
                label: "Transfer",
                onClick: () => navigate({ to: "/transfer" }),
                svg: null,
              },
              { icon: Receipt, label: "Pay Bills", onClick: undefined, svg: null },
              {
                icon: null,
                label: "Support",
                onClick: () => setShowSupport(true),
                svg: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
                    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                  </svg>
                ),
              },
            ] as const
          ).map(({ icon: Icon, label, onClick, svg }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex flex-col items-center gap-2 py-3 px-1 rounded-2xl bg-card border border-border hover:bg-primary-soft active:scale-95 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center text-primary">
                {svg ?? (Icon ? <Icon size={18} className="text-primary" /> : null)}
              </div>
              <span className="text-[11px] font-medium text-foreground text-center leading-tight">
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* GOGuardian AI Protection banner */}
        <div className="flex items-center gap-3 bg-card rounded-2xl px-4 py-3.5 border border-border shadow-card">
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
          </div>
        </div>

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
