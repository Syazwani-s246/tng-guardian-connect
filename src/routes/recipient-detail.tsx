import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/recipient-detail")({
  head: () => ({
    meta: [
      { title: "Recipient Details — GOGuardian" },
      { name: "description", content: "View details and risk assessment for this recipient." },
    ],
  }),
  component: RecipientDetailScreen,
});

function RecipientDetailScreen() {
  return (
    <PhoneShell title="Recipient Details" showBack backTo="/alert">
      <div className="px-5 pt-6 pb-8 space-y-4">
        {/* Recipient card */}
        <div className="bg-card rounded-3xl p-6 shadow-card border border-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-destructive-soft flex items-center justify-center text-destructive text-2xl font-bold shrink-0">
              ?
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Unknown Recipient</p>
              <p className="text-xs text-muted-foreground mt-0.5">Unverified · First time</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Transfer via</p>
              <p className="font-medium text-foreground mt-0.5">Phone Number</p>
              <p className="text-xs text-muted-foreground">+60 1x-xxxx 2847</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Country</p>
              <p className="font-medium text-foreground mt-0.5">Malaysia</p>
              <p className="text-xs text-muted-foreground">Unverified</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">First time</p>
              <p className="font-medium text-foreground mt-0.5">Yes</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Transaction history</p>
              <p className="font-medium text-foreground mt-0.5">None recorded</p>
            </div>
          </div>
        </div>

        {/* Risk card */}
        <div className="bg-warning-soft rounded-3xl p-6 border border-warning/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
              <ShieldAlert size={20} className="text-warning-foreground" />
            </div>
            <div>
              <p className="text-xs text-warning-foreground/70 font-medium uppercase tracking-wide">Risk Level</p>
              <p className="text-base font-bold text-warning-foreground">High</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="text-warning-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-warning-foreground">New recipient — never transacted before</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="text-warning-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-warning-foreground">Amount higher than your usual transfers</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="text-warning-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-warning-foreground">No transaction history found</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Button asChild size="lg" variant="destructive" className="w-full h-14 text-base font-semibold rounded-2xl shadow-card">
            <Link to="/blocked">Block Transaction</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full h-14 text-base font-semibold rounded-2xl border-2">
            <Link to="/blocked" search={{ approved: true } as never}>Approve Anyway</Link>
          </Button>
        </div>
      </div>
    </PhoneShell>
  );
}
