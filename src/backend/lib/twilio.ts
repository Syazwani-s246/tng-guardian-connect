const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DEFAULT_CHAT_ID = process.env.TELEGRAM_DEFAULT_CHAT_ID;

// Escape special chars for Telegram HTML mode (safer than Markdown for dynamic content)
function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Escape special chars for Telegram HTML mode (safer than Markdown for dynamic content)
function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

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

  // Guard: missing env vars
  if (!BOT_TOKEN || BOT_TOKEN === "your_bot_token") {
    console.error("Telegram BOT_TOKEN is missing or is a placeholder");
    return false;
  }
  if (!chatId) {
    console.error("Telegram chat_id is missing");
    return false;
  }

  const emoji =
    decision === "BLOCKED" ? "🚫" :
    decision === "HOLD" ? "⚠️" :
    decision === "PENDING" ? "👁️" : "✅";

  const riskScore = Math.round(xgboostScore * 100);
  const riskLabel =
    riskScore <= 30 ? "Low Risk 🟢" :
    riskScore <= 60 ? "Medium Risk 🟡" : "High Risk 🔴";

  // Use HTML parse_mode — safe against special chars in names/phones
  const message = [
    `${emoji} <b>GOGuardian Alert</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `👤 <b>Recipient:</b> ${escapeHtml(receiverName)}`,
    `📱 <b>Phone:</b> ${escapeHtml(receiverPhone)}`,
    `💰 <b>Amount:</b> RM${amount.toFixed(2)}`,
    `🎯 <b>Risk Score:</b> ${riskScore}/100 — ${riskLabel}`,
    `⚡ <b>Decision:</b> <b>${escapeHtml(decision)}</b>`,
    ``,
    `📝 <b>Penjelasan:</b>`,
    escapeHtml(reasonBM),
    ``,
    `🔗 <b>Txn ID:</b> <code>${escapeHtml(txnId)}</code>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `<i>GOGuardian AI — Melindungi pengguna yang terdedah</i>`,
  ].join("\n");

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",  // HTML is safer than Markdown for dynamic content
          reply_markup: {
            inline_keyboard: [
              [
                { text: "✅ Approve", callback_data: `approve:${txnId}` },
                { text: "🚫 Block", callback_data: `block:${txnId}` },
              ],
            ],
          },
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
  txnId?: string; // allow caller to pass real txnId to avoid callback collision
}) {
  return sendGuardianAlert({
    receiverName: params.receiverName,
    receiverPhone: params.receiverPhone,
    amount: params.amount,
    xgboostScore: 0.5,
    decision: "PENDING",
    reasonBM: "Pengesahan diperlukan. Sila semak dan balas dalam masa 1 minit.",
    // Fall back to a unique ID so concurrent pending alerts don't collide
    txnId: params.txnId ?? `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  });
}