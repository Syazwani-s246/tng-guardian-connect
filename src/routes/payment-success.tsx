import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { transactionStore } from "./transfer";

const notifStyles = `
  @keyframes notif-slide-down {
    from { transform: translateY(-110%); opacity: 0; }
    to   { transform: translateY(0);     opacity: 1; }
  }
  @keyframes notif-slide-up {
    from { transform: translateY(0);     opacity: 1; }
    to   { transform: translateY(-110%); opacity: 0; }
  }
  .notif-enter { animation: notif-slide-down 0.35s ease forwards; }
  .notif-exit  { animation: notif-slide-up  0.35s ease forwards; }
`;

export const Route = createFileRoute("/payment-success")({
  head: () => ({
    meta: [{ title: "Transfer Successful — TNG eWallet" }],
  }),
  component: PaymentSuccessScreen,
});

function PaymentSuccessScreen() {
  const navigate = useNavigate();
  const [tx, setTx] = useState<any>(null);
  const [txnId] = useState(() => "TXN" + Math.floor(Math.random() * 9000000000 + 1000000000));
  const [timestamp] = useState(() => new Date().toLocaleString("en-MY", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }));
  const [notifPhase, setNotifPhase] = useState<"hidden" | "enter" | "exit">("hidden");

  useEffect(() => {
    if (transactionStore.result) {
      setTx(transactionStore.result);
    } else {
      navigate({ to: "/home" });
    }
  }, []);

  useEffect(() => {
    if (!tx) return;
    const t1 = setTimeout(() => setNotifPhase("enter"), 1000);
    const t2 = setTimeout(() => setNotifPhase("exit"), 4000);  // 1s delay + 3s visible
    const t3 = setTimeout(() => setNotifPhase("hidden"), 4400); // after exit animation
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [tx]);

  if (!tx) return null;

  const { recipient_name, recipient_phone, amount } = tx;

  const notification = notifPhase !== "hidden" ? (
    <>
      <style>{notifStyles}</style>
      <div
        className={`pointer-events-auto bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 ${
          notifPhase === "exit" ? "notif-exit" : "notif-enter"
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <span className="text-white text-[10px] font-extrabold tracking-tight">TNG</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">Transfer Successful</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            RM {amount.toFixed(2)} sent to {recipient_name}
          </p>
        </div>
      </div>
    </>
  ) : undefined;

  return (
    <PhoneShell title="" hideNav notification={notification}>
      <div className="px-5 pt-10 pb-10 flex flex-col items-center space-y-6">

        {/* Success icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Transfer Successful</h1>
          <p className="text-3xl font-bold text-foreground">RM {amount.toFixed(2)}</p>
        </div>

        {/* Details card */}
        <div className="w-full bg-card rounded-2xl border border-border shadow-card divide-y divide-border">
          <div className="px-5 py-3.5 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Recipient</span>
            <span className="text-sm font-semibold text-foreground text-right">{recipient_name}</span>
          </div>
          <div className="px-5 py-3.5 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Phone / Account</span>
            <span className="text-sm font-medium text-foreground">{recipient_phone}</span>
          </div>
          <div className="px-5 py-3.5 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Transaction ID</span>
            <span className="text-xs font-mono font-medium text-foreground">{txnId}</span>
          </div>
          <div className="px-5 py-3.5 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Date & Time</span>
            <span className="text-xs font-medium text-foreground text-right">{timestamp}</span>
          </div>
        </div>

        <div className="w-full pt-2">
          <Button
            size="lg"
            className="w-full h-14 text-base font-semibold rounded-2xl"
            onClick={() => navigate({ to: "/home" })}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </PhoneShell>
  );
}
