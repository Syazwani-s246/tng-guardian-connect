// Telegram Bot credentials (hackathon)
const TELEGRAM_BOT_TOKEN = "REDACTED_TELEGRAM_TOKEN";
const TELEGRAM_CHAT_ID = "6355405135";

export interface GuardianNotifyResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

/**
 * Send a guardian verification message via Telegram Bot API.
 */
export async function sendGuardianWhatsApp(params: {
  txnId: string;
  senderId: string;
  receiverName: string;
  amount: number;
}): Promise<GuardianNotifyResult> {
  const text =
    `🔔 *GOGuardian Payment Verification*\n\n` +
    `A transaction requires your approval:\n\n` +
    `👤 From: \`${params.senderId}\`\n` +
    `👉 To: *${params.receiverName}*\n` +
    `💰 Amount: *RM${params.amount.toFixed(2)}*\n` +
    `🆔 TxnID: \`${params.txnId}\`\n\n` +
    `Reply *APPROVE* or *REJECT*`;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "Markdown",
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error("Telegram Error:", data);
      return { success: false, error: data.description ?? "Telegram API error" };
    }

    return { success: true, messageSid: String(data.result.message_id) };
  } catch (err: any) {
    console.error("Telegram network error:", err);
    return { success: false, error: err.message ?? "Network or Parsing Error" };
  }
}
