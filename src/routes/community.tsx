import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { UsersRound, Star, Award, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community Guardian — GOGuardian" },
      { name: "description", content: "Pair with a verified community volunteer to watch over your wallet." },
    ],
  }),
  component: CommunityScreen,
});

function CommunityScreen() {
  const [paired, setPaired] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPaired(true), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <PhoneShell title="Community Guardian" showBack backTo="/guardian">
      <div className="px-5 pt-6 space-y-5">
        <div className="bg-card rounded-3xl p-6 shadow-card border border-border text-center">
          <div className="w-16 h-16 rounded-2xl bg-success-soft text-success flex items-center justify-center mx-auto">
            <UsersRound size={32} strokeWidth={2.2} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-foreground">
            We will pair you with a verified community volunteer
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Trained volunteers from your area help review unusual transactions when family isn't around.
          </p>

          <div className="mt-5 flex items-center justify-center gap-2 text-sm font-medium">
            {paired ? (
              <span className="inline-flex items-center gap-2 bg-success-soft text-success px-4 py-2 rounded-full">
                <CheckCircle2 size={16} /> Volunteer matched
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 bg-primary-soft text-primary px-4 py-2 rounded-full">
                <Loader2 size={16} className="animate-spin" /> Finding a volunteer near you…
              </span>
            )}
          </div>
        </div>

        {/* Volunteer card */}
        <div className={`bg-card rounded-3xl p-5 shadow-card border border-border transition-opacity ${paired ? "opacity-100" : "opacity-50"}`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-soft text-primary flex items-center justify-center text-2xl font-bold">
              SN
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-lg">Siti Nurhaliza</p>
              <p className="text-xs text-muted-foreground">Verified · Kuala Lumpur</p>
              <div className="flex items-center gap-1 mt-1 text-sm">
                <Star size={14} className="text-warning fill-warning" />
                <span className="font-semibold text-foreground">4.9</span>
                <span className="text-muted-foreground">· 128 helps</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 bg-success-soft text-success rounded-2xl px-4 py-3">
            <Award size={20} />
            <span className="text-sm font-semibold">2,450 GORewards points earned</span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            Bahasa Malaysia · English. Available evenings & weekends.
          </p>
        </div>

        <Button
          asChild
          size="lg"
          disabled={!paired}
          className="w-full h-14 text-base font-semibold rounded-2xl shadow-card"
        >
          <Link to="/demo" search={{ mode: "community", step: "alert" } as never}>
            Try a demo alert
          </Link>
        </Button>
      </div>
    </PhoneShell>
  );
}
