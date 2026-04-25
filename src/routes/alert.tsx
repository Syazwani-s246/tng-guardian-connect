import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

function useCountdown(totalSeconds: number, speedMultiplier = 1) {
  const [remaining, setRemaining] = useState(totalSeconds);
  useEffect(() => {
    setRemaining(totalSeconds);
    const interval = 1000 / speedMultiplier;
    const id = setInterval(() => {
      setRemaining((s) => Math.max(0, s - 1));
    }, interval);
    return () => clearInterval(id);
  }, [totalSeconds, speedMultiplier]);
  const mins = String(Math.floor(remaining / 60)).padStart(2, "0");
  const secs = String(remaining % 60).padStart(2, "0");
  return { display: `${mins}:${secs}`, remaining };
}

function CountdownBlock() {
  const { display, remaining } = useCountdown(90, 10);
  const urgent = remaining <= 20;
  return (
    <div className="mt-4 flex flex-col items-center gap-1">
      <span className={`text-3xl font-mono font-bold tabular-nums ${urgent ? "text-destructive" : "text-foreground"}`}>
        {display}
      </span>
      <p className="text-xs text-muted-foreground text-center">
        Guardian has 1.5 minutes to respond. AI will decide if no response.
      </p>
    </div>
  );
}

export const Route = createFileRoute("/alert")({
  head: () => ({
    meta: [
      { title: "Suspicious Transaction Alert — GOGuardian" },
      { name: "description", content: "Review a flagged transaction and approve or block it." },
    ],
  }),
  component: AlertScreen,
});

function AlertScreen() {
  return (
    <PhoneShell title="Transaction Review" showBack backTo="/family">
      <div className="px-5 pt-6">
        {/* Alert badge */}
        <div className="flex items-center gap-2 bg-warning-soft text-warning-foreground rounded-full px-4 py-2 w-fit text-sm font-semibold">
          <AlertTriangle size={16} />
          GOGuardian Alert
        </div>

        {/* Transaction card */}
        <div className="mt-5 bg-card rounded-3xl p-6 shadow-card border border-border">
          <p className="text-sm text-muted-foreground">Pending transfer</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground">RM500</span>
            <span className="text-sm text-muted-foreground">.00</span>
          </div>

          <div className="mt-5 py-3 border-y border-border">
            <Link to="/recipient-detail" className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-destructive-soft flex items-center justify-center text-destructive font-bold shrink-0">
                ?
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">Unknown Recipient</p>
                <p className="text-xs text-muted-foreground">First time recipient</p>
              </div>
              <ArrowRight className="text-muted-foreground shrink-0" size={18} />
            </Link>
            <div className="mt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
              <div>
                <p className="text-muted-foreground">Contact Number</p>
                <p className="font-medium text-foreground">+60 1•-•••• 2847</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p className="font-medium text-foreground">RM 500.00</p>
              </div>
              <div>
                <p className="text-muted-foreground">Country</p>
                <p className="font-medium text-foreground">Unknown</p>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-warning-soft/60 rounded-xl p-4">
            <p className="text-sm text-foreground leading-relaxed">
              <span className="font-semibold">Why we flagged this: </span>
              Recipient is new and the amount is higher than your usual transfers.
            </p>
          </div>

          <CountdownBlock />
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <Button asChild size="lg" variant="destructive" className="w-full h-14 text-base font-semibold rounded-2xl shadow-card">
            <Link to="/blocked">Block Transaction</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full h-14 text-base font-semibold rounded-2xl border-2">
            <Link to="/blocked" search={{ approved: true } as never}>Approve Anyway</Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground pt-1">
            Take your time. Nothing happens until you choose.
          </p>
        </div>
      </div>
    </PhoneShell>
  );
}
