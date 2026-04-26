import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/alert")({
  head: () => ({
    meta: [{ title: "Transaction Alert — TNG eWallet" }],
  }),
  component: AlertScreen,
});

function AlertScreen() {
  return (
    <PhoneShell title="Transaction Review" showBack backTo="/home">
      <div className="px-5 pt-6 pb-8">
        {/* Alert badge */}
        <div className="flex items-center gap-2 bg-warning-soft text-warning-foreground rounded-full px-4 py-2 w-fit text-sm font-semibold">
          <AlertTriangle size={16} />
          GOGuardian Alert
        </div>

        {/* Transaction card */}
        <div className="mt-5 bg-card rounded-3xl p-6 shadow-card border border-border">
          <p className="text-sm text-muted-foreground">Flagged transfer</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground">RM500</span>
            <span className="text-sm text-muted-foreground">.00</span>
          </div>

          <div className="mt-5 py-3 border-y border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-destructive-soft flex items-center justify-center text-destructive font-bold shrink-0">
                ?
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">Unknown Recipient</p>
                <p className="text-xs text-muted-foreground">First time recipient</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
              <div>
                <p className="text-muted-foreground">Contact Number</p>
                <p className="font-medium text-foreground">+60 11-2345 6789</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p className="font-medium text-foreground">RM 500.00</p>
              </div>
              <div>
                <p className="text-muted-foreground">Country</p>
                <p className="font-medium text-foreground">Malaysia</p>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-warning-soft/60 rounded-xl p-4">
            <p className="text-sm text-foreground leading-relaxed">
              <span className="font-semibold">Why we flagged this: </span>
              New recipient and amount is higher than your usual transfers.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <Button asChild size="lg" variant="destructive" className="w-full h-14 text-base font-semibold rounded-2xl shadow-card">
            <Link to="/blocked">Block Transaction</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full h-14 text-base font-semibold rounded-2xl border-2">
            <Link to="/home">Approve Anyway</Link>
          </Button>
        </div>
      </div>
    </PhoneShell>
  );
}
