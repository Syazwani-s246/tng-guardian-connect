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
import { useState } from "react";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [{ title: "Home — TNG eWallet" }],
  }),
  component: HomeScreen,
});

const transactions = [
  {
    name: "Grab",
    category: "Transport",
    amount: "-RM 15.00",
    time: "Today, 9:12 AM",
    initials: "G",
    bg: "bg-green-100",
    text: "text-green-700",
  },
  {
    name: "TNB Bill",
    category: "Utilities",
    amount: "-RM 87.50",
    time: "Yesterday",
    initials: "T",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
  },
  {
    name: "99 Speedmart",
    category: "Groceries",
    amount: "-RM 23.80",
    time: "Mon, 22 Apr",
    initials: "9",
    bg: "bg-red-100",
    text: "text-red-700",
  },
];

function HomeScreen() {
  const [showBalance, setShowBalance] = useState(true);
  const navigate = useNavigate();

  return (
    <PhoneShell>
      {/* Blue header — connects seamlessly with the blue status bar */}
      <div className="bg-primary text-primary-foreground px-5 pt-3 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/70 text-xs mb-0.5">Good morning,</p>
            <h1 className="text-[17px] font-semibold leading-tight">Hi, Mak Cik Rohani 👋</h1>
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
            {showBalance ? "RM 1,250.00" : "RM ••••••"}
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

        {/* GOGuardian banner */}
        <Link to="/guardian" className="block">
          <div className="flex items-center gap-3 bg-card rounded-2xl px-4 py-3.5 border border-border shadow-card hover:bg-primary-soft/30 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Protected by GOGuardian</p>
              <p className="text-xs text-muted-foreground">AI-powered transaction shield</p>
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
            <button className="text-xs text-primary font-medium">See all</button>
          </div>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            {transactions.map((tx) => (
              <div key={tx.name} className="flex items-center gap-3 px-4 py-3.5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${tx.bg} ${tx.text}`}
                >
                  {tx.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{tx.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {tx.category} · {tx.time}
                  </p>
                </div>
                <span className="text-sm font-semibold text-foreground shrink-0">{tx.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}
