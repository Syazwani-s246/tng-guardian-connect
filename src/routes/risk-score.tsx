import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import mockData from "@/data/mockData.json";
import { useState } from "react";

export const Route = createFileRoute("/risk-score")({
  validateSearch: (search: Record<string, unknown>) => ({
    recipient_phone: (search.recipient_phone as string) ?? "",
    recipient_name: (search.recipient_name as string) ?? "",
    amount: search.amount != null ? Number(search.amount) : NaN,
    country: (search.country as string) ?? "Malaysia",
  }),
  head: () => ({
    meta: [{ title: "Risk Score — TNG eWallet" }],
  }),
  component: RiskScoreScreen,
});

interface RiskResult {
  risk_score: number;
  risk_level: string;
  reasons: string[];
}

// TODO: Replace with API call to backend risk scoring endpoint
function calculateRiskScore(recipient_name: string, amount: number): RiskResult {
  const isVerified = mockData.verified_recipients.some(
    (r) => r.name.toLowerCase() === recipient_name.toLowerCase()
  );

  let score = 0;
  const reasons: string[] = [];

  if (!isVerified) {
    score += 40;
    reasons.push("New recipient, never transacted before");
    reasons.push("No transaction history found for this number");
  } else {
    reasons.push("Recipient is in your verified contacts");
    reasons.push("Consistent transfer pattern detected");
  }

  if (amount > 400) {
    score += 35;
    reasons.push("Amount is higher than your usual transfers");
  } else if (amount > 200) {
    score += 18;
    reasons.push("Transfer amount is above your 30-day average");
  } else if (isVerified) {
    reasons.push("Amount is within your usual transfer range");
  }

  const risk_level = score > 70 ? "High" : score >= 40 ? "Medium" : "Low";
  return { risk_score: Math.min(score, 100), risk_level, reasons };
}

function RiskGauge({ score }: { score: number }) {
  const radius = 72;
  const cx = 100;
  const cy = 100;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (score / 100);

  const color =
    score < 40 ? "#22c55e" : score <= 70 ? "#f59e0b" : "#ef4444";
  const bgColor = "#e5e7eb";

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 200"
        width={200}
        height={200}
        aria-label={`Risk score ${score} out of 100`}
      >
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke={bgColor} strokeWidth={16} />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={16}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="middle" fontSize="40" fontWeight="bold" fill={color}>
          {score}
        </text>
        <text x={cx} y={cy + 24} textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="#6b7280">
          / 100
        </text>
      </svg>
    </div>
  );
}

function RiskScoreScreen() {
  const navigate = useNavigate();
  const params = Route.useSearch();
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  const hasParams = params.recipient_phone !== "" && !isNaN(params.amount);
  const fallback = mockData.demo_transaction;

  const recipient_phone = hasParams ? params.recipient_phone : fallback.recipient_phone;
  const recipient_name = hasParams ? params.recipient_name || "Unknown Recipient" : fallback.recipient_name;
  const amount = hasParams ? params.amount : fallback.amount;

  const { risk_score, risk_level, reasons } = hasParams
    ? calculateRiskScore(recipient_name, amount)
    : { risk_score: fallback.risk_score, risk_level: fallback.risk_level, reasons: fallback.reasons };

  const isHighRisk = risk_score > 70;
  const isMediumRisk = risk_score >= 40 && risk_score <= 70;
  const isLowRisk = risk_score < 40;

  // ── HIGH RISK ──────────────────────────────────────────────────────────────
  if (isHighRisk) {
    return (
      <PhoneShell title="AI Risk Analysis" hideNav>
        <div className="px-5 pt-6 pb-10 space-y-5">
          <div className="rounded-2xl bg-red-600 px-5 py-6 flex flex-col items-center gap-3 text-center">
            <span className="text-5xl">🚫</span>
            <p className="text-xl font-bold text-white">Transaction Blocked by GOGuardian AI</p>
            <p className="text-sm text-red-100">
              This transaction has been automatically blocked due to high fraud risk.
            </p>
          </div>

          <div className="bg-card rounded-2xl px-5 py-4 border border-border shadow-card">
            <p className="text-xs text-muted-foreground mb-1">Attempted transfer to</p>
            <p className="font-semibold text-foreground">{recipient_name}</p>
            <p className="text-xs text-muted-foreground">{recipient_phone}</p>
            <p className="text-2xl font-bold text-foreground mt-2">RM {amount.toFixed(2)}</p>
          </div>

          <div className="bg-card rounded-2xl border border-red-200 shadow-card py-5 flex flex-col items-center">
            <p className="text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              GOGuardian AI Risk Score
            </p>
            <RiskGauge score={risk_score} />
            <span className="mt-1 text-2xl font-bold text-red-500">{risk_level} Risk</span>
            <p className="text-xs text-muted-foreground mt-1">High probability of scam</p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Why this was blocked
            </p>
            <ul className="space-y-2">
              {reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-0.5 shrink-0 text-red-500">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          <Button
            size="lg"
            className="w-full h-14 text-base font-semibold rounded-2xl bg-red-600 hover:bg-red-700"
            onClick={() => navigate({ to: "/home" })}
          >
            Back to Home
          </Button>
        </div>
      </PhoneShell>
    );
  }

  // ── MEDIUM RISK ────────────────────────────────────────────────────────────
  if (isMediumRisk) {
    return (
      <PhoneShell title="AI Risk Analysis" showBack backTo="/home" hideNav>
        <div className="px-5 pt-6 pb-10 space-y-5">
          <div className="rounded-2xl bg-amber-50 border border-amber-300 px-5 py-4 flex items-start gap-3">
            <span className="text-2xl mt-0.5">⚠️</span>
            <div>
              <p className="font-bold text-amber-800">Caution — Flagged Transaction</p>
              <p className="text-xs text-amber-700 mt-0.5">
                GOGuardian AI has flagged this transaction. Proceed with caution.
              </p>
            </div>
          </div>

          <div className="bg-card rounded-2xl px-5 py-4 border border-border shadow-card">
            <p className="text-xs text-muted-foreground mb-1">Transfer to</p>
            <p className="font-semibold text-foreground">{recipient_name}</p>
            <p className="text-xs text-muted-foreground">{recipient_phone}</p>
            <p className="text-2xl font-bold text-foreground mt-2">RM {amount.toFixed(2)}</p>
          </div>

          <div className="bg-card rounded-2xl border border-amber-200 shadow-card py-5 flex flex-col items-center">
            <p className="text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              GOGuardian AI Risk Score
            </p>
            <RiskGauge score={risk_score} />
            <span className="mt-1 text-2xl font-bold text-amber-500">{risk_level} Risk</span>
            <p className="text-xs text-muted-foreground mt-1">Proceed with caution</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Why this was flagged
            </p>
            <ul className="space-y-2">
              {reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-0.5 shrink-0 text-amber-500">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {overrideConfirmed && (
            <div className="rounded-2xl bg-orange-50 border border-orange-300 px-5 py-4 flex items-start gap-3">
              <span className="text-xl mt-0.5">⚡</span>
              <p className="text-sm font-semibold text-orange-800">
                You have chosen to override AI protection
              </p>
            </div>
          )}

          <div className="space-y-3">
            {!overrideConfirmed ? (
              <>
                <Button
                  size="lg"
                  className="w-full h-14 text-base font-semibold rounded-2xl bg-amber-500 hover:bg-amber-600"
                  onClick={() => setOverrideConfirmed(true)}
                >
                  Proceed Anyway
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-14 text-base font-semibold rounded-2xl border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => navigate({ to: "/home" })}
                >
                  Cancel Transaction
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  className="w-full h-14 text-base font-semibold rounded-2xl"
                  onClick={() => navigate({ to: "/home" })}
                >
                  Complete Transfer
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-14 text-base font-semibold rounded-2xl"
                  onClick={() => navigate({ to: "/home" })}
                >
                  Cancel Transaction
                </Button>
              </>
            )}
          </div>
        </div>
      </PhoneShell>
    );
  }

  // ── LOW RISK ───────────────────────────────────────────────────────────────
  if (isLowRisk) {
    return (
      <PhoneShell title="AI Risk Analysis" showBack backTo="/home" hideNav>
        <div className="px-5 pt-6 pb-10 space-y-5">
          <div className="rounded-2xl bg-green-600 px-5 py-6 flex flex-col items-center gap-3 text-center">
            <span className="text-5xl">✅</span>
            <p className="text-xl font-bold text-white">Transaction Looks Safe</p>
            <p className="text-sm text-green-100">
              GOGuardian AI found no suspicious activity.
            </p>
          </div>

          <div className="bg-card rounded-2xl px-5 py-4 border border-border shadow-card">
            <p className="text-xs text-muted-foreground mb-1">Transfer to</p>
            <p className="font-semibold text-foreground">{recipient_name}</p>
            <p className="text-xs text-muted-foreground">{recipient_phone}</p>
            <p className="text-2xl font-bold text-foreground mt-2">RM {amount.toFixed(2)}</p>
          </div>

          <div className="bg-card rounded-2xl border border-green-200 shadow-card py-5 flex flex-col items-center">
            <p className="text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              GOGuardian AI Risk Score
            </p>
            <RiskGauge score={risk_score} />
            <span className="mt-1 text-2xl font-bold text-green-600">{risk_level} Risk</span>
            <p className="text-xs text-muted-foreground mt-1">Safe to proceed</p>
          </div>

          {reasons.length > 0 && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 space-y-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                What we checked
              </p>
              <ul className="space-y-2">
                {reasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-0.5 shrink-0 text-green-500">✓</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            size="lg"
            className="w-full h-14 text-base font-semibold rounded-2xl bg-green-600 hover:bg-green-700"
            onClick={() => navigate({ to: "/home" })}
          >
            Proceed with Transfer
          </Button>
        </div>
      </PhoneShell>
    );
  }

  return null;
}
