import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { getDemoTransaction } from "@/lib/api";

export const Route = createFileRoute("/transfer")({
  head: () => ({
    meta: [{ title: "Transfer — TNG eWallet" }],
  }),
  component: TransferScreen,
});

type Stage = "form" | "analysing";

function TransferScreen() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("form");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    getDemoTransaction().then((tx) => {
      setRecipient(tx.recipient_phone);
      setAmount(String(tx.amount));
    });
  }, []);

  function handleSend() {
    setStage("analysing");
    setTimeout(() => {
      navigate({
        to: "/risk-score",
        search: {
          recipient_phone: recipient,
          recipient_name: "Unknown Recipient",
          amount: parseFloat(amount) || 0,
          country: "Malaysia",
        },
      });
    }, 2000);
  }

  if (stage === "analysing") {
    return (
      <PhoneShell title="Transfer" showBack backTo="/home" hideNav>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-88px)] px-6 text-center">
          <div className="relative w-24 h-24 mb-6">
            {/* Pulsing rings */}
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <span className="absolute inset-2 rounded-full bg-primary/30 animate-ping [animation-delay:200ms]" />
            <div className="relative w-24 h-24 rounded-full bg-primary-soft flex items-center justify-center">
              <ArrowRightLeft size={36} className="text-primary" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground">Analysing transaction...</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            GOGuardian AI is scanning for risks
          </p>
          <div className="mt-6 flex items-center gap-2">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell title="Transfer" showBack backTo="/home" hideNav>
      <div className="px-5 pt-6 space-y-5 pb-8">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Recipient Phone / Account No.
            </label>
            <input
              type="tel"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="+60 1X-XXXX XXXX"
              className="w-full border border-input rounded-xl px-4 py-3.5 text-sm outline-none bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Amount (RM)
            </label>
            <div className="flex items-center border border-input rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary bg-background transition-all">
              <span className="px-4 py-3.5 text-foreground font-semibold bg-muted border-r border-input text-sm select-none">
                RM
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 px-4 py-3.5 text-sm outline-none bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* GOGuardian notice */}
        <div className="flex items-center gap-2 bg-primary-soft px-4 py-3 rounded-xl text-xs text-primary font-medium">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
          </svg>
          GOGuardian AI will scan this transaction before sending
        </div>

        <Button
          size="lg"
          className="w-full h-14 text-base font-semibold rounded-2xl shadow-card"
          onClick={handleSend}
          disabled={!recipient || !amount}
        >
          Send
        </Button>
      </div>
    </PhoneShell>
  );
}
