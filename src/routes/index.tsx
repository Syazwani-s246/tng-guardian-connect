import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Sparkles } from "lucide-react";
import illustration from "@/assets/protection-illustration.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GOGuardian — Extra Protection for Your eWallet" },
      { name: "description", content: "GOGuardian adds a trusted protection layer to TNG eWallet. Set up Family, Community, or AI Guardian in minutes." },
      { property: "og:title", content: "GOGuardian — Extra Protection for Your eWallet" },
      { property: "og:description", content: "Add a trusted guardian to help protect your TNG eWallet from suspicious transactions." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  return (
    <PhoneShell hideNav>
      <div className="flex flex-col h-[calc(100vh-44px)]">
        {/* Top brand strip */}
        <div className="bg-primary text-primary-foreground px-6 pt-4 pb-8 rounded-b-3xl">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <ShieldCheck size={18} />
            <span>TNG eWallet · GOGuardian</span>
          </div>
        </div>

        {/* Illustration */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-6">
          <div className="bg-card rounded-3xl p-6 shadow-card w-full flex justify-center">
            <img
              src={illustration}
              alt="Hands protecting a heart inside a shield"
              width={768}
              height={768}
              className="w-56 h-56 object-contain"
            />
          </div>

          <div className="mt-8 text-center max-w-xs">
            <div className="inline-flex items-center gap-1.5 bg-success-soft text-success px-3 py-1 rounded-full text-xs font-semibold mb-4">
              <Sparkles size={14} />
              Recommended for you
            </div>
            <h1 className="text-2xl font-bold leading-tight text-foreground">
              GOGuardian detected you may benefit from extra protection
            </h1>
            <p className="mt-3 text-base text-muted-foreground leading-relaxed">
              Add a trusted guardian to help review unusual transactions before they happen.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-8 pt-4 space-y-3">
          <Button asChild size="lg" className="w-full h-14 text-base font-semibold rounded-2xl shadow-card">
            <Link to="/guardian">Set Up Protection</Link>
          </Button>
          <button className="w-full text-center text-muted-foreground text-sm py-2">
            Maybe later
          </button>
        </div>
      </div>
    </PhoneShell>
  );
}
