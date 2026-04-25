const BOT_TOKEN = "REDACTED_TELEGRAM_TOKEN";
const DEFAULT_CHAT_ID = "6817798193";

export async function sendGuardianAlert(params: {
  chatId?: string;
  receiverName: string;
  receiverPhone: string;
  amount: number;
  xgboostScore: number;
  decision: string;
  reasonBM: string;
  txnId: string;
}) {
  const {
    chatId = DEFAULT_CHAT_ID,
    receiverName,
    receiverPhone,
    amount,
    xgboostScore,
    decision,
    reasonBM,
    txnId,
  } = params;

  const emoji =
    decision === "BLOCKED" ? "🚫" :
    decision === "HOLD" ? "⚠️" :
    decision === "PENDING" ? "👁️" : "✅";

  const riskScore = Math.round(xgboostScore * 100);
  const riskLabel =
    riskScore <= 30 ? "Low Risk 🟢" :
    riskScore <= 60 ? "Medium Risk 🟡" : "High Risk 🔴";

  const message = `
${emoji} *GOGuardian Alert*
━━━━━━━━━━━━━━━━━━━━

👤 *Recipient:* ${receiverName}
📱 *Phone:* ${receiverPhone}
💰 *Amount:* RM${amount.toFixed(2)}
🎯 *Risk Score:* ${riskScore}/100 — ${riskLabel}
⚡ *Decision:* *${decision}*

📝 *Penjelasan:*
${reasonBM}

🔗 *Txn ID:* \`${txnId}\`
━━━━━━━━━━━━━━━━━━━━
_GOGuardian AI — Melindungi pengguna yang terdedah_
  `.trim();

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Telegram error:", err);
    }

    return res.ok;
  } catch (error) {
    console.error("Telegram send failed:", error);
    return false;
  }
}

export async function sendPendingAlert(params: {
  receiverName: string;
  receiverPhone: string;
  amount: number;
}) {
  return sendGuardianAlert({
    receiverName: params.receiverName,
    receiverPhone: params.receiverPhone,
    amount: params.amount,
    xgboostScore: 0.5,
    decision: "PENDING",
    reasonBM: "Pengesahan diperlukan. Sila semak dan balas dalam masa 1 minit.",
    txnId: "pending-guardian-review",
  });
}