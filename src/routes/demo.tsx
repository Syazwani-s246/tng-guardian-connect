import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Bot,
  CheckCircle2,
  ShieldCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { useEffect } from "react";

type Mode = "family" | "community" | "ai";
type Step = "alert" | "notify" | "resolved";

interface Search {
  mode: Mode;
  step: Step;
  decision?: "blocked" | "approved";
}

export const Route = createFileRoute("/demo")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: (s.mode as Mode) ?? "family",
    step: (s.step as Step) ?? "alert",
    decision: s.decision as "blocked" | "approved" | undefined,
  }),
  head: () => ({
    meta: [
      { title: "Demo — GOGuardian" },
      { name: "description", content: "Walk through a guardian flow end-to-end." },
    ],
  }),
  component: Demo,
});

const modeMeta: Record<Mode, { label: string; icon: typeof Users; tone: string }> = {
  family: { label: "Family Guardian", icon: Users, tone: "bg-primary-soft text-primary" },
  community: { label: "Community Guardian", icon: UsersRound, tone: "bg-success-soft text-success" },
  ai: { label: "AI Guardian", icon: Bot, tone: "bg-warning-soft text-warning-foreground" },
};

function Demo() {
  const { mode, step, decision } = Route.useSearch();

  if (step === "alert") return <AlertStep mode={mode} />;
  if (step === "notify") return <NotifyStep mode={mode} decision={decision ?? "blocked"} />;
  return <ResolvedStep mode={mode} decision={decision ?? "blocked"} />;
}

function DemoBadge({ mode }: { mode: Mode }) {
  const m = modeMeta[mode];
  const Icon = m.icon;
  return (
    <div className="flex items-center justify-between gap-2 mb-4">
      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${m.tone}`}>
        <Icon size={14} /> {m.label} · Demo
      </div>
      <Link to="/guardian" className="text-xs text-muted-foreground underline">
        Exit demo
      </Link>
    </div>
  );
}

function AlertStep({ mode }: { mode: Mode }) {
  return (
    <PhoneShell title="Transaction Review" showBack backTo="/guardian">
      <div className="px-5 pt-6">
        <DemoBadge mode={mode} />

        <div className="flex items-center gap-2 bg-warning-soft text-warning-foreground rounded-full px-4 py-2 w-fit text-sm font-semibold">
          <AlertTriangle size={16} />
          GOGuardian Alert
        </div>

        <div className="mt-5 bg-card rounded-3xl p-6 shadow-card border border-border">
          <p className="text-sm text-muted-foreground">Pending transfer</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground">RM500</span>
            <span className="text-sm text-muted-foreground">.00</span>
          </div>

          <div className="mt-5 flex items-center gap-3 py-3 border-y border-border">
            <div className="w-12 h-12 rounded-full bg-destructive-soft flex items-center justify-center text-destructive font-bold">
              ?
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">Unknown Recipient</p>
              <p className="text-xs text-muted-foreground truncate">+60 1•-•••• 2847 · First time</p>
            </div>
            <ArrowRight className="text-muted-foreground" size={18} />
          </div>

          <div className="mt-4 bg-warning-soft/60 rounded-xl p-4">
            <p className="text-sm text-foreground leading-relaxed">
              <span className="font-semibold">Why we flagged this: </span>
              Recipient is new and the amount is higher than your usual transfers.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Mengapa kami menanda ini: Penerima baru dan jumlahnya lebih tinggi daripada biasa.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Button
            asChild
            size="lg"
            variant="destructive"
            className="w-full h-14 text-base font-semibold rounded-2xl shadow-card"
          >
            <Link to="/demo" search={{ mode, step: "notify", decision: "blocked" } as never}>
              Block Transaction
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full h-14 text-base font-semibold rounded-2xl border-2"
          >
            <Link to="/demo" search={{ mode, step: "notify", decision: "approved" } as never}>
              Approve Anyway
            </Link>
          </Button>
        </div>
      </div>
    </PhoneShell>
  );
}

function NotifyStep({ mode, decision }: { mode: Mode; decision: "blocked" | "approved" }) {
  const navigate = useNavigate();
  const m = modeMeta[mode];
  const Icon = m.icon;

  useEffect(() => {
    const t = setTimeout(() => {
      navigate({ to: "/demo", search: { mode, step: "resolved", decision } as never });
    }, 2200);
    return () => clearTimeout(t);
  }, [navigate, mode, decision]);

  const guardianCopy: Record<Mode, { name: string; sub: string }> = {
    family: { name: "Ahmad (your son)", sub: "Family Guardian · notified" },
    community: { name: "Siti Nurhaliza", sub: "Community Volunteer · notified" },
    ai: { name: "GOGuardian AI", sub: "Logged & monitoring" },
  };
  const g = guardianCopy[mode];

  return (
    <PhoneShell title="Notifying Guardian" showBack backTo="/guardian">
      <div className="px-5 pt-6">
        <DemoBadge mode={mode} />

        <div className="bg-card rounded-3xl p-6 shadow-card border border-border">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${m.tone}`}>
              <Icon size={28} strokeWidth={2.2} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-lg">{g.name}</p>
              <p className="text-xs text-muted-foreground">{g.sub}</p>
            </div>
          </div>

          {/* Simulated push notification */}
          <div className="mt-5 bg-secondary rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Bell size={12} /> Push notification · now
            </div>
            <p className="text-sm font-semibold text-foreground">GOGuardian Alert</p>
            <p className="text-sm text-foreground mt-0.5 leading-relaxed">
              {decision === "blocked"
                ? "A RM500 transfer was just blocked on the wallet you protect."
                : "A RM500 transfer was approved. Please check in on the user."}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Pemberitahuan kepada penjaga anda telah dihantar.
            </p>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-primary font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Sending notification…
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

function ResolvedStep({ mode, decision }: { mode: Mode; decision: "blocked" | "approved" }) {
  const isBlocked = decision === "blocked";

  return (
    <PhoneShell hideNav>
      <div className="flex flex-col h-[calc(100vh-44px)] px-6 pt-8 pb-8">
        <DemoBadge mode={mode} />

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="relative">
            <div
              className={`w-28 h-28 rounded-full flex items-center justify-center ${
                isBlocked ? "bg-success-soft" : "bg-warning-soft"
              }`}
            >
              <CheckCircle2
                size={64}
                className={isBlocked ? "text-success" : "text-warning-foreground"}
                strokeWidth={2.2}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-2 shadow-card">
              <ShieldCheck size={22} className="text-primary" />
            </div>
          </div>

          <h1 className="mt-8 text-2xl font-bold text-foreground">
            {isBlocked ? "Transaction blocked" : "Transaction approved"}
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-xs leading-relaxed">
            {isBlocked
              ? "Your guardian has been notified and will check in with you shortly."
              : "Your guardian was notified and will follow up to make sure you're safe."}
          </p>

          <div className="mt-8 w-full bg-primary-soft rounded-2xl p-5 text-left space-y-4">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">English</p>
              <p className="text-sm text-foreground mt-1 leading-relaxed">
                {isBlocked
                  ? "You're safe. No money has left your wallet."
                  : "Transfer completed. Your guardian has been informed."}
              </p>
            </div>
            <div className="border-t border-primary/10 pt-4">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">Bahasa Malaysia</p>
              <p className="text-sm text-foreground mt-1 leading-relaxed">
                {isBlocked
                  ? "Anda selamat. Tiada wang yang keluar dari dompet anda. Penjaga anda telah dimaklumkan."
                  : "Pemindahan selesai. Penjaga anda telah dimaklumkan."}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-6">
          <Button asChild size="lg" className="w-full h-14 text-base font-semibold rounded-2xl shadow-card">
            <Link to="/guardian">Back to Guardian</Link>
          </Button>
          <Link to="/demo" search={{ mode, step: "alert" } as never} className="block text-center text-sm text-primary font-medium py-2">
            Replay this demo
          </Link>
        </div>
      </div>
    </PhoneShell>
  );
}
