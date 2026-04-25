import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { getDemoTransaction } from "@/lib/api";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/risk-score")({
  head: () => ({
    meta: [{ title: "Risk Score — TNG eWallet" }],
  }),
  component: RiskScoreScreen,
});

interface DemoTransaction {
  recipient_phone: string;
  recipient_name: string;
  amount: number;
  country: string;
  risk_score: number;
  risk_level: string;
  reasons: string[];
}

function RiskGauge({ score }: { score: number }) {
  const radius = 72;
  const cx = 100;
  const cy = 100;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (score / 100);

  const color =
    score <= 40 ? "#22c55e" : score <= 70 ? "#f59e0b" : "#ef4444";
  const bgColor = "#e5e7eb";

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 200"
        width={200}
        height={200}
        aria-label={`Risk score ${score} out of 100`}
      >
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={16}
        />
        {/* Score arc */}
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
        {/* Score text */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="40"
          fontWeight="bold"
          fill={color}
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + 24}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="13"
          fill="#6b7280"
        >
          / 100
        </text>
      </svg>
    </div>
  );
}

function RiskScoreScreen() {
  const navigate = useNavigate();
  const [tx, setTx] = useState<DemoTransaction | null>(null);

  useEffect(() => {
    getDemoTransaction().then(setTx);
  }, []);

  if (!tx) return null;

  const { risk_score, risk_level, reasons, recipient_name, amount, recipient_phone } = tx;
  const isBlocked = risk_score > 70;

  const riskColor =
    risk_score <= 40
      ? "text-green-600"
      : risk_score <= 70
        ? "text-amber-500"
        : "text-red-500";

  const riskBg =
    risk_score <= 40
      ? "bg-green-50 border-green-200"
      : risk_score <= 70
        ? "bg-amber-50 border-amber-200"
        : "bg-red-50 border-red-200";

  return (
    <PhoneShell title="AI Risk Analysis" showBack backTo="/home" hideNav>
      <div className="px-5 pt-6 pb-10 space-y-5">
        {/* Transaction summary */}
        <div className="bg-card rounded-2xl px-5 py-4 border border-border shadow-card">
          <p className="text-xs text-muted-foreground mb-1">Transfer to</p>
          <p className="font-semibold text-foreground">{recipient_name}</p>
          <p className="text-xs text-muted-foreground">{recipient_phone}</p>
          <p className="text-2xl font-bold text-foreground mt-2">
            RM {amount.toFixed(2)}
          </p>
        </div>

        {/* Gauge */}
        <div className="bg-card rounded-2xl border border-border shadow-card py-5 flex flex-col items-center">
          <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide text-[11px]">
            GOGuardian AI Risk Score
          </p>
          <RiskGauge score={risk_score} />
          <span className={`mt-1 text-2xl font-bold ${riskColor}`}>
            {risk_level} Risk
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            {risk_score <= 40 ? "Safe to proceed" : risk_score <= 70 ? "Proceed with caution" : "High probability of scam"}
          </p>
        </div>

        {/* Result banner */}
        {isBlocked ? (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">🚫</span>
            <div>
              <p className="font-bold text-red-700">Transaction Auto-Blocked</p>
              <p className="text-xs text-red-600 mt-0.5">
                GOGuardian AI blocked this transfer to protect you.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-green-50 border border-green-200 px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-green-700">Transaction Approved</p>
              <p className="text-xs text-green-600 mt-0.5">
                Risk is within acceptable range.
              </p>
            </div>
          </div>
        )}

        {/* Risk reasons */}
        <div className={`rounded-2xl border px-5 py-4 space-y-3 ${riskBg}`}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Why this score?
          </p>
          <ul className="space-y-2">
            {reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className={`mt-0.5 shrink-0 text-base ${isBlocked ? "text-red-500" : "text-amber-500"}`}>
                  •
                </span>
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Action */}
        {isBlocked ? (
          <Button
            size="lg"
            className="w-full h-14 text-base font-semibold rounded-2xl"
            onClick={() => navigate({ to: "/home" })}
          >
            Back to Home
          </Button>
        ) : (
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold rounded-2xl"
              onClick={() => navigate({ to: "/home" })}
            >
              Proceed with Transfer
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full h-14 text-base font-semibold rounded-2xl"
              onClick={() => navigate({ to: "/home" })}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </PhoneShell>
  );
}
