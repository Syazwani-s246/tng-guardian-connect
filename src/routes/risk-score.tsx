import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { getDemoTransaction } from "@/lib/api";
import { useEffect, useState } from "react";
import { AlertTriangle, AlertCircle, ShieldCheck, Loader2 } from "lucide-react";
import type { ScamCheckResponse } from "@/components/ScamWarningCard";
import { sampleComplaints } from "@/data/sampleComplaints";
import { classifyRiskLevel } from "@/backend/functions/scamCheck";

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
  const [scamResult, setScamResult] = useState<ScamCheckResponse | null>(null);
  const [scamLoading, setScamLoading] = useState(false);

  useEffect(() => {
    getDemoTransaction().then((data) => {
      setTx(data);
      setScamLoading(true);

      // Try API first (Vite proxy in dev, same origin in prod)
      fetch("/receiver/scam-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverPhone: data.recipient_phone }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((result) => setScamResult(result))
        .catch(() => {
          // Fallback to local sample data if API is unreachable
          const complaints = sampleComplaints.filter(
            (c) => c.receiverPhone === data.recipient_phone,
          );
          const complaintCount = complaints.length;
          const riskLevel = classifyRiskLevel(complaintCount);

          const warningEN =
            complaintCount === 0
              ? "No complaints found against this receiver. This receiver appears safe."
              : complaintCount <= 2
                ? `This receiver has ${complaintCount} complaint${complaintCount !== 1 ? "s" : ""} from other users. Proceed with caution.`
                : `Warning: This receiver has ${complaintCount} complaints filed against them by other users. High risk of scam. We strongly advise against proceeding.`;

          const warningBM =
            complaintCount === 0
              ? "Tiada aduan ditemui terhadap penerima ini. Penerima ini kelihatan selamat."
              : complaintCount <= 2
                ? `Penerima ini mempunyai ${complaintCount} aduan daripada pengguna lain. Sila berhati-hati.`
                : `Amaran: Penerima ini mempunyai ${complaintCount} aduan daripada pengguna lain. Risiko tinggi penipuan. Kami sangat menasihatkan agar tidak meneruskan.`;

          setScamResult({
            receiverPhone: data.recipient_phone,
            complaintCount,
            riskLevel,
            warningEN,
            warningBM,
            error: false,
          });
        })
        .finally(() => setScamLoading(false));
    });
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

        {/* Receiver Complaint Check (AI Scam Check) */}
        {scamLoading ? (
          <div className="rounded-2xl border border-border bg-card px-5 py-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Checking receiver history...</p>
          </div>
        ) : scamResult ? (
          <div
            className={`rounded-2xl border px-5 py-4 space-y-3 ${
              scamResult.error
                ? "bg-amber-50 border-amber-200"
                : scamResult.riskLevel === "HIGH"
                  ? "bg-red-50 border-red-200"
                  : scamResult.riskLevel === "MEDIUM"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-green-50 border-green-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {scamResult.error || scamResult.riskLevel === "MEDIUM" ? (
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              ) : scamResult.riskLevel === "HIGH" ? (
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
              )}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Receiver Complaint Check
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                  scamResult.error
                    ? "bg-amber-100 text-amber-800"
                    : scamResult.riskLevel === "HIGH"
                      ? "bg-red-100 text-red-800"
                      : scamResult.riskLevel === "MEDIUM"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-green-100 text-green-800"
                }`}
              >
                {scamResult.riskLevel} RISK
              </span>
              <span className="text-sm text-foreground">
                {scamResult.complaintCount >= 0
                  ? `${scamResult.complaintCount} complaint${scamResult.complaintCount !== 1 ? "s" : ""} filed`
                  : "Unable to retrieve complaints"}
              </span>
            </div>
            <p className="text-sm text-foreground">{scamResult.warningEN}</p>
          </div>
        ) : null}

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
