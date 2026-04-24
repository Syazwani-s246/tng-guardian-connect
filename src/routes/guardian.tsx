import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Users, UsersRound, Bot, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/guardian")({
  head: () => ({
    meta: [
      { title: "Choose Your Guardian — GOGuardian" },
      { name: "description", content: "Pick a Family, Community, or AI Guardian to watch over your TNG eWallet." },
    ],
  }),
  component: GuardianSelect,
});

const options = [
  {
    to: "/family",
    icon: Users,
    title: "Family Guardian",
    desc: "A trusted family member reviews unusual activity.",
    tone: "primary" as const,
  },
  {
    to: "/family",
    icon: UsersRound,
    title: "Community Guardian",
    desc: "Verified community volunteers help when family isn't around.",
    tone: "success" as const,
  },
  {
    to: "/family",
    icon: Bot,
    title: "AI Guardian",
    desc: "Smart AI flags suspicious transfers in real time.",
    tone: "warning" as const,
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
          Pick the type of guardian that fits you best. You can change this anytime.
        </p>

        <div className="space-y-4">
          {options.map(({ to, icon: Icon, title, desc, tone }) => (
            <Link
              key={title}
              to={to}
              className="block bg-card rounded-2xl p-5 shadow-card border border-border hover:border-primary transition group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${toneStyles[tone]}`}>
                  <Icon size={28} strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                </div>
                <ChevronRight className="text-muted-foreground group-hover:text-primary mt-3 shrink-0" size={22} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PhoneShell>
  );
}
