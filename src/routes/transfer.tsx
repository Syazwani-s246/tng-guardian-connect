import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { checkTransaction, mapApiResponseToRiskScore } from "@/lib/api";
import { walletStore } from "@/lib/walletStore";
import mockData from "@/data/mockData.json";

export const Route = createFileRoute("/transfer")({
  head: () => ({
    meta: [{ title: "Transfer — TNG eWallet" }],
  }),
  component: TransferScreen,
});

type Stage = "form" | "checking" | "first-time" | "trustee-wait" | "analysing" | "known-confirm";

// global store for passing data between routes (simple for hackathon)
export const transactionStore = { result: null as any };

const BUSINESS_KEYWORDS = ["Sdn Bhd", "Berhad", "Enterprise", "Trading", "Holdings", "Sdn", "Bhd"];

const TRUSTEES = [
  { name: "Ahmad Hafizi", initials: "AH" },
  { name: "Siti Norzahra", initials: "SN" },
  { name: "Razif Ikhwan", initials: "RI" },
];

function isKnownRecipient(name: string): boolean {
  if (!name.trim()) return false;
  const lower = name.toLowerCase();
  const verifiedNames = mockData.verified_recipients.map((r) => r.name.toLowerCase());
  if (verifiedNames.includes(lower)) return true;
  return BUSINESS_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

function WhatsAppIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TransferScreen() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("form");
  const [recipient, setRecipient] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [trusteeNote, setTrusteeNote] = useState("Waiting for Trustee response...");
  const apiPromiseRef = useRef<Promise<any> | null>(null);

  // checking → first-time after 1.5s
  useEffect(() => {
    if (stage !== "checking") return;
    const t = setTimeout(() => setStage("first-time"), 1500);
    return () => clearTimeout(t);
  }, [stage]);

  // first-time: start API call, then → trustee-wait after 1s
  useEffect(() => {
    if (stage !== "first-time") return;
    const amountNum = parseFloat(amount);
    const name = recipientName || "Unknown Recipient";
    apiPromiseRef.current = checkTransaction({
      receiverPhone: recipient,
      receiverName: name,
      amount: amountNum,
    }).then((resp) =>
      mapApiResponseToRiskScore(resp, {
        receiverPhone: recipient,
        receiverName: name,
        amount: amountNum,
      })
    );
    const t = setTimeout(() => setStage("trustee-wait"), 1000);
    return () => clearTimeout(t);
  }, [stage]);

  // trustee-wait: countdown 60→0 at 10x speed (100ms per display-second = 6 real seconds)
  useEffect(() => {
    if (stage !== "trustee-wait") return;
    setCountdown(60);
    setTrusteeNote("Waiting for Trustee response...");
    let count = 60;
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        setTrusteeNote("No response received. Passing to GOGuardian AI...");
        setTimeout(async () => {
          setStage("analysing");
          try {
            const result = await apiPromiseRef.current!;
            transactionStore.result = result;
            navigate({ to: "/risk-score" });
          } catch {
            setError("Connection error. Please try again.");
            setStage("form");
          }
        }, 1500);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [stage]);

  function handleSend() {
    if (!recipient || !amount) return;
    const amountNum = parseFloat(amount);

    if (amountNum > walletStore.balance) {
      setError("Insufficient balance");
      return;
    }

    setError("");
    if (isKnownRecipient(recipientName)) {
      setStage("known-confirm");
    } else {
      setStage("checking");
    }
  }

  function handleKnownConfirm() {
    const amountNum = parseFloat(amount);
    walletStore.deduct(amountNum);
    transactionStore.result = {
      recipient_name: recipientName || "Unknown",
      recipient_phone: recipient,
      amount: amountNum,
    };
    navigate({ to: "/payment-success" });
  }

  // ── Known recipient: simple confirmation ──────────────────────────────────
  if (stage === "known-confirm") {
    return (
      <PhoneShell title="Confirm Transfer" showBack onBack={() => setStage("form")} hideNav>
        <div className="px-5 pt-6 pb-10 space-y-5">
          <div className="bg-card rounded-2xl px-5 py-4 border border-border shadow-card">
            <p className="text-xs text-muted-foreground mb-1">Transfer to</p>
            <p className="font-semibold text-foreground">{recipientName || "Unknown"}</p>
            <p className="text-xs text-muted-foreground">{recipient}</p>
            <p className="text-2xl font-bold text-foreground mt-2">
              RM {parseFloat(amount).toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-3">
            <svg className="w-7 h-7 shrink-0 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <div>
              <p className="font-semibold text-green-700 text-sm">Verified Recipient</p>
              <p className="text-xs text-green-600">This recipient is in your verified contacts. No additional verification needed.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold rounded-2xl shadow-card"
              onClick={handleKnownConfirm}
            >
              Confirm Transfer
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full h-14 text-base font-semibold rounded-2xl border-2"
              onClick={() => setStage("form")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </PhoneShell>
    );
  }

  // ── Checking recipient ────────────────────────────────────────────────────
  if (stage === "checking") {
    return (
      <PhoneShell title="Transfer" showBack backTo="/home" hideNav>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-88px)] px-6 text-center">
          <div className="relative w-20 h-20 mb-6">
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-primary-soft flex items-center justify-center">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
                <path d="M11 8v6M8 11h6" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground">Checking recipient...</h2>
          <p className="mt-2 text-sm text-muted-foreground">Verifying recipient details</p>
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

  // ── First-time transfer detected ──────────────────────────────────────────
  if (stage === "first-time") {
    return (
      <PhoneShell title="Transfer" showBack backTo="/home" hideNav>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-88px)] px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground">First-time transfer detected</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            This recipient is not in your contacts. Notifying your Trustees...
          </p>
        </div>
      </PhoneShell>
    );
  }

  // ── Trustee wait with countdown ───────────────────────────────────────────
  if (stage === "trustee-wait") {
    return (
      <PhoneShell title="Transfer" showBack backTo="/home" hideNav>
        <div className="px-5 pt-6 pb-10 space-y-5 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground text-center">Trustees Notified</h2>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              An alert has been sent to your Trustees via WhatsApp. They have 1 minute to respond.
            </p>
          </div>

          {/* Transaction summary */}
          <div className="bg-card rounded-2xl px-5 py-3.5 border border-border shadow-card">
            <p className="text-xs text-muted-foreground mb-0.5">Pending transfer to</p>
            <p className="font-semibold text-foreground">{recipientName || "Unknown Recipient"}</p>
            <p className="text-lg font-bold text-foreground mt-1">RM {parseFloat(amount).toFixed(2)}</p>
          </div>

          {/* Trustee list */}
          {/* TODO: Backend to integrate WhatsApp Business API */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            {TRUSTEES.map((t) => (
              <div key={t.name} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center font-bold text-xs text-primary shrink-0">
                  {t.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <WhatsAppIcon />
                    <span className="text-xs text-green-600">via WhatsApp</span>
                  </div>
                </div>
                <span className="text-xs text-green-600 font-semibold shrink-0">Alert sent</span>
              </div>
            ))}
          </div>

          {/* Countdown */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full border-4 border-primary flex items-center justify-center">
              <span className="text-3xl font-bold text-primary tabular-nums">{countdown}</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">{trusteeNote}</p>
          </div>
        </div>
      </PhoneShell>
    );
  }

  // ── AI Analysing ──────────────────────────────────────────────────────────
  if (stage === "analysing") {
    return (
      <PhoneShell title="Transfer" showBack backTo="/home" hideNav>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-88px)] px-6 text-center">
          <div className="relative w-24 h-24 mb-6">
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
          <p className="mt-1 text-xs text-muted-foreground">
            XGBoost → Bedrock Nova → Qwen Guardrail
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

  // ── Transfer form ─────────────────────────────────────────────────────────
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
              Recipient Name (optional)
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Ahmad bin Ali"
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

        {error && (
          <p className="text-sm text-red-500 text-center font-medium">{error}</p>
        )}

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
