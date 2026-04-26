import { createFileRoute } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { ShieldCheck, Info } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — TNG eWallet" }],
  }),
  component: SettingsScreen,
});

function SettingsScreen() {
  return (
    <PhoneShell title="Settings" showBack backTo="/me">
      <div className="px-5 pt-6 space-y-5">
        {/* GOGuardian AI Protection toggle */}
        <div className="bg-card rounded-2xl border border-border shadow-card px-5 py-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-4">
            Protection
          </p>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  GOGuardian AI Protection
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Scans every transaction in real time
                </p>
              </div>
            </div>

            {/* Disabled toggle */}
            <div className="relative shrink-0 group">
              <button
                disabled
                aria-checked="true"
                role="switch"
                className="w-12 h-7 rounded-full bg-primary opacity-60 cursor-not-allowed relative flex items-center transition-colors"
                aria-label="GOGuardian AI Protection — always on"
              >
                <span className="absolute right-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all" />
              </button>
              {/* Tooltip */}
              <div className="absolute right-0 top-9 w-52 bg-foreground text-background text-xs rounded-xl px-3 py-2 hidden group-hover:block z-10 shadow-elevated">
                Required for your protection
              </div>
            </div>
          </div>
        </div>

        {/* Protection level info */}
        <div className="bg-primary-soft rounded-2xl px-5 py-4 flex items-start gap-3">
          <Info size={16} className="text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-primary">
              Current Protection Level
            </p>
            <p className="text-xs text-primary/80 mt-1 leading-relaxed">
              GOGuardian AI is <span className="font-bold">Active</span> and monitoring all your transactions. This feature cannot be disabled to keep your account safe.
            </p>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}
