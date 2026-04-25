import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { ShieldCheck, XCircle } from "lucide-react";

export const Route = createFileRoute("/blocked")({
  head: () => ({
    meta: [{ title: "Transaction Blocked — TNG eWallet" }],
  }),
  component: Blocked,
});

function Blocked() {
  return (
    <PhoneShell hideNav>
      <div className="flex flex-col h-[calc(100vh-44px)] px-6 pt-12 pb-8">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-destructive-soft flex items-center justify-center">
              <XCircle size={64} className="text-destructive" strokeWidth={2.2} />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-2 shadow-card">
              <ShieldCheck size={22} className="text-primary" />
            </div>
          </div>

          <h1 className="mt-8 text-2xl font-bold text-foreground">
            Transaction Blocked
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-xs leading-relaxed">
            GOGuardian AI blocked this transfer to protect you from a potential scam.
          </p>

          <div className="mt-8 w-full bg-primary-soft rounded-2xl p-5 text-left">
            <p className="text-sm font-semibold text-primary mb-1">You're safe</p>
            <p className="text-sm text-foreground leading-relaxed">
              No money has left your wallet. This transaction has been flagged and saved to your transaction history.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-6">
          <Button asChild size="lg" className="w-full h-14 text-base font-semibold rounded-2xl shadow-card">
            <Link to="/home">Back to Home</Link>
          </Button>
          <Link to="/me" className="block text-center text-sm text-primary font-medium py-2">
            View transaction history
          </Link>
        </div>
      </div>
    </PhoneShell>
  );
}
