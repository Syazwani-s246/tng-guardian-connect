import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Users, UsersRound, Bot, ChevronRight, Play } from "lucide-react";

export const Route = createFileRoute("/guardian")({
  head: () => ({
    meta: [
      { title: "Choose Your Guardian — GOGuardian" },
      { name: "description", content: "Pick a Family, Community, or AI Guardian to watch over your TNG eWallet." },
    ],
  }),
  component: GuardianSelect,
});

type Mode = "family" | "community" | "ai";

const options: Array<{
  to: string;
  mode: Mode;
  icon: typeof Users;
  title: string;
  desc: string;
  tone: "primary" | "success" | "warning";
}> = [
  {
    to: "/family",
    mode: "family",
    icon: Users,
    title: "Family Guardian",
    desc: "A trusted family member reviews unusual activity.",
    tone: "primary",
  },
  {
    to: "/community",
    mode: "community",
    icon: UsersRound,
    title: "Community Guardian",
    desc: "Verified community volunteers help when family isn't around.",
    tone: "success",
  },
  {
    to: "/ai-monitor",
    mode: "ai",
    icon: Bot,
    title: "AI Guardian",
    desc: "Smart AI flags suspicious transfers in real time.",
    tone: "warning",
  },
];

const toneStyles = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning-foreground",
};

function GuardianSelect() {
  return (
    <PhoneShell title="Choose a Guardian" showBack backTo="/">
      <div className="px-5 pt-6">
        <p className="text-base text-muted-foreground mb-5">
          Pick the type of guardian that fits you best. Tap{" "}
          <span className="inline-flex items-center gap-1 align-middle bg-primary-soft text-primary rounded-md px-1.5 py-0.5 text-xs font-semibold">
            <Play size={10} className="fill-primary" /> Try Demo
          </span>{" "}
          to see the full flow.
        </p>

        <div className="space-y-4">
          {options.map(({ to, mode, icon: Icon, title, desc, tone }) => (
            <div
              key={title}
              className="bg-card rounded-2xl p-5 shadow-card border border-border hover:border-primary transition"
            >
              <Link to={to} className="flex items-start gap-4 group">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${toneStyles[tone]}`}>
                  <Icon size={28} strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                </div>
                <ChevronRight className="text-muted-foreground group-hover:text-primary mt-3 shrink-0" size={22} />
              </Link>

              <Link
                to="/demo"
                search={{ mode, step: "alert" } as never}
                className="mt-4 flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-card hover:bg-primary/90 transition"
              >
                <Play size={14} className="fill-current" />
                Try Demo
              </Link>
            </div>
          ))}
        </div>
      </div>
    </PhoneShell>
  );
}
