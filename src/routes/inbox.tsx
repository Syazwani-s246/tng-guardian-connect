import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { Shield, User, ArrowDownLeft } from "lucide-react";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [{ title: "Inbox — TNG eWallet" }],
  }),
  component: InboxScreen,
});

const initialNotifications = [
  { id: 0, type: "alert", title: "Transaction Blocked", desc: "GOGuardian blocked a transfer of RM500 to an unknown recipient.", time: "Just now", unread: true },
  { id: 1, type: "trustee", title: "Approval Request Sent", desc: "A suspicious transaction alert was sent to Ahmad Hafizi for review.", time: "Just now", unread: true },
  { id: 2, type: "transfer", title: "Transfer Received", desc: "You received RM200 from Ahmad Hafizi.", time: "Yesterday", unread: false },
  { id: 3, type: "alert", title: "GOGuardian Alert", desc: "An overseas QR payment of RM800 was flagged and blocked.", time: "2 days ago", unread: false },
  { id: 4, type: "trustee", title: "Trustee Added", desc: "Siti Norzahra has accepted your Trustee invitation.", time: "3 days ago", unread: false },
  { id: 5, type: "transfer", title: "Transfer Received", desc: "You received RM500 from Siti Norzahra.", time: "5 days ago", unread: false },
];

const iconConfig = {
  alert: { Icon: Shield, bg: "bg-destructive/10", color: "text-destructive" },
  trustee: { Icon: User, bg: "bg-primary-soft", color: "text-primary" },
  transfer: { Icon: ArrowDownLeft, bg: "bg-success-soft", color: "text-success" },
};

function InboxScreen() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [clearing, setClearing] = useState(false);

  function handleClearAll() {
    setClearing(true);
    setTimeout(() => {
      setNotifications([]);
      setClearing(false);
    }, 350);
  }

  const clearButton = notifications.length > 0 ? (
    <button
      onClick={handleClearAll}
      className="text-xs font-medium text-blue-200 hover:text-white transition-colors ml-auto"
    >
      Clear all
    </button>
  ) : null;

  return (
    <PhoneShell title="Inbox" headerRight={clearButton}>
      <div className="px-4 pt-5 pb-6 space-y-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 gap-3 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <p className="text-sm font-semibold text-foreground">No new notifications</p>
            <p className="text-xs text-muted-foreground">You are all caught up</p>
          </div>
        ) : (
          notifications.map((n) => {
            const { Icon, bg, color } = iconConfig[n.type as keyof typeof iconConfig];
            return (
              <div
                key={n.id}
                className="bg-card rounded-2xl border border-border px-4 py-4 flex items-start gap-3 shadow-card relative transition-opacity duration-300"
                style={{ opacity: clearing ? 0 : 1 }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon size={18} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-snug">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.desc}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">{n.time}</p>
                </div>
                {n.unread && (
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                )}
              </div>
            );
          })
        )}
      </div>
    </PhoneShell>
  );
}
