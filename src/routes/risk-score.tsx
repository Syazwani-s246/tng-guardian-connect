import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { transactionStore } from "./transfer";
import { walletStore } from "@/lib/walletStore";

export const Route = createFileRoute("/risk-score")({
  head: () => ({
    meta: [{ title: "Risk Score — TNG eWallet" }],
  }),
  component: RiskScoreScreen,
});

function RiskGauge({ score }: { score: number }) {
  const radius = 54;
  const cx = 80;
  const cy = 80;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (score / 100);
  const color = score <= 30 ? "#22c55e" : score <= 60 ? "#f59e0b" : "#ef4444";

  return (
    <svg viewBox="0 0 160 160" width={160} height={160}>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={14} />
      <circle
        cx={cx} cy={cy} r={radius} fill="none"
        stroke={color} strokeWidth={14} strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle"
        fontSize="32" fontWeight="bold" fill={color}>{score}</text>
      <text x={cx} y={cy + 20} textAnchor="middle" dominantBaseline="middle"
        fontSize="11" fill="#6b7280">/ 100</text>
    </svg>
  );
}

function RiskScoreScreen() {
  const navigate = useNavigate();
  const [tx, setTx] = useState<any>(null);

  useEffect(() => {
    if (transactionStore.result) {
      setTx(transactionStore.result);
    } else {
      navigate({ to: "/transfer" });
    }
  }, []);

  if (!tx) return null;

  const { risk_score, risk_level, recipient_name, amount,
    recipient_phone, isBlocked, isHold, guardrailVerdict, pipeline, reasonBM } = tx;

  const riskColor = risk_score <= 30 ? "text-green-600" : risk_score <= 60 ? "text-amber-500" : "text-red-500";

  const statusConfig = isBlocked
    ? { bg: "bg-red-50 border-red-200", label: "Auto-Blocked", labelColor: "text-red-700", dot: "bg-red-500" }
    : isHold
    ? { bg: "bg-amber-50 border-amber-200", label: "On Hold", labelColor: "text-amber-700", dot: "bg-amber-500" }
    : { bg: "bg-green-50 border-green-200", label: "Approved", labelColor: "text-green-700", dot: "bg-green-500" };

  const layer2Name = pipeline?.layer2_bedrock ? "AWS Bedrock" : "Groq Llama";
  const layer3Name = pipeline?.layer3_qwen ? "Alibaba Qwen" : "Groq Guardrail";

  return (
    <PhoneShell title="AI Risk Analysis" showBack backTo="/home" hideNav>
      <div className="flex flex-col h-full px-4 pt-4 pb-5 gap-3 overflow-hidden">

        {/* Transaction summary */}
        <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Transfer to</p>
            <p className="font-semibold text-sm text-gray-800">{recipient_name}</p>
            <p className="text-xs text-gray-400">{recipient_phone}</p>
          </div>
          <p className="text-xl font-bold text-gray-900">RM {amount.toFixed(2)}</p>
        </div>

        {/* Gauge + risk level */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-4 flex flex-col items-center">
          <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            GOGuardian AI Risk Score
          </p>
          <RiskGauge score={risk_score} />
          <span className={`text-xl font-bold ${riskColor}`}>{risk_level} Risk</span>
          <p className="text-xs text-gray-400 mt-0.5">
            {risk_score <= 30 ? "Safe to proceed" : risk_score <= 60 ? "Proceed with caution" : "High probability of scam"}
          </p>
        </div>

        {/* AI Summary — human readable */}
<div className={`rounded-2xl border px-4 py-3 space-y-3 ${statusConfig.bg} flex-1`}>
  <div className="flex items-center justify-between">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Summary</p>
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusConfig.labelColor} bg-white border`}>
      {statusConfig.label}
    </span>
  </div>

  {/* Main reason in BM */}
  {reasonBM && (
    <p className="text-sm text-gray-700 leading-relaxed">{reasonBM}</p>
  )}

  {/* Context signals — human readable */}
  <div className="space-y-2 pt-2 border-t border-gray-200">
    {pipeline?.layer1_xgboost?.amountDeviation > 2 && (
      <div className="flex items-start gap-2 text-xs text-gray-600">
        <span className="mt-0.5">⚠️</span>
        <span>Amount is <strong>{pipeline.layer1_xgboost.amountDeviation}x</strong> your usual transaction size</span>
      </div>
    )}
    {pipeline?.layer1_xgboost?.strikeCount >= 1 && (
      <div className="flex items-start gap-2 text-xs text-gray-600">
        <span className="mt-0.5">🚨</span>
        <span>This number has been reported as a scam <strong>{pipeline.layer1_xgboost.strikeCount}</strong> time(s) by other users</span>
      </div>
    )}
    {pipeline?.layer1_xgboost?.strikeCount === 0 && (
      <div className="flex items-start gap-2 text-xs text-gray-600">
        <span className="mt-0.5">👤</span>
        <span>This is your <strong>first time</strong> transferring to this recipient</span>
      </div>
    )}
    {pipeline?.layer2_bedrock?.evidence_used?.includes("Sender Age: 75") && (
      <div className="flex items-start gap-2 text-xs text-gray-600">
        <span className="mt-0.5">🛡️</span>
        <span>Extra protection enabled for your profile</span>
      </div>
    )}
    {guardrailVerdict === "OVERRIDE" && (
      <div className="flex items-start gap-2 text-xs text-gray-600">
        <span className="mt-0.5">🔍</span>
        <span>AI reasoning was independently verified and flagged for review</span>
      </div>
    )}
  </div>
</div>

        {/* Actions */}
        {isBlocked ? (
          <Button size="lg" className="w-full h-12 text-sm font-semibold rounded-2xl"
            onClick={() => navigate({ to: "/home" })}>
            Back to Home
          </Button>
        ) : isHold ? (
          <div className="space-y-2">
            <Button size="lg" className="w-full h-12 text-sm font-semibold rounded-2xl"
              onClick={() => { walletStore.deduct(amount); navigate({ to: "/payment-success" }); }}>
              Proceed Anyway
            </Button>
            <Button size="lg" variant="outline" className="w-full h-12 text-sm font-semibold rounded-2xl border-2"
              onClick={() => navigate({ to: "/home" })}>
              Cancel Transaction
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button size="lg" className="w-full h-12 text-sm font-semibold rounded-2xl"
              onClick={() => { walletStore.deduct(amount); navigate({ to: "/payment-success" }); }}>
              Proceed with Transfer
            </Button>
            <Button size="lg" variant="outline" className="w-full h-12 text-sm font-semibold rounded-2xl border-2"
              onClick={() => navigate({ to: "/home" })}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </PhoneShell>
  );
}