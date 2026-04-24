import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/blocked")({
  head: () => ({
    meta: [
      { title: "Transaction Blocked — GOGuardian" },
      { name: "description", content: "Your transaction was blocked and your guardian was notified." },
    ],
  }),
  component: Blocked,
});

function Blocked() {
  return (
    <PhoneShell hideNav>
      <div className="flex flex-col h-[calc(100vh-44px)] px-6 pt-12 pb-8">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-success-soft flex items-center justify-center">
              <CheckCircle2 size={64} className="text-success" strokeWidth={2.2} />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-2 shadow-card">
              <ShieldCheck size={22} className="text-primary" />
            </div>
          </div>

          <h1 className="mt-8 text-2xl font-bold text-foreground">
            Transaction blocked
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-xs leading-relaxed">
            Your guardian has been notified and will check in with you shortly.
          </p>

          {/* Bilingual reassurance */}
          <div className="mt-8 w-full bg-primary-soft rounded-2xl p-5 text-left space-y-4">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">English</p>
              <p className="text-sm text-foreground mt-1 leading-relaxed">
                You're safe. No money has left your wallet.
              </p>
            </div>
            <div className="border-t border-primary/10 pt-4">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">Bahasa Malaysia</p>
              <p className="text-sm text-foreground mt-1 leading-relaxed">
                Anda selamat. Tiada wang yang keluar dari dompet anda. Penjaga anda telah dimaklumkan.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-6">
          <Button asChild size="lg" className="w-full h-14 text-base font-semibold rounded-2xl shadow-card">
            <Link to="/">Back to Wallet</Link>
          </Button>
          <Link to="/guardian" className="block text-center text-sm text-primary font-medium py-2">
            View Guardian settings
          </Link>
        </div>
      </div>
    </PhoneShell>
  );
}
