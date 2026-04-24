import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { Bot, CheckCircle2, AlertTriangle, Activity } from "lucide-react";

export const Route = createFileRoute("/ai-monitor")({
  head: () => ({
    meta: [
      { title: "AI Guardian — GOGuardian" },
      { name: "description", content: "AI monitors your transactions in real time and flags suspicious activity." },
    ],
  }),
  component: AIMonitor,
});

const log = [
  { id: 1, kind: "flagged" as const, title: "RM500 to unknown number", time: "Just now", note: "Held for review" },
  { id: 2, kind: "cleared" as const, title: "RM35 Touch 'n Go reload", time: "2h ago", note: "Trusted merchant" },
  { id: 3, kind: "cleared" as const, title: "RM120 to Mama (saved)", time: "Yesterday", note: "Frequent contact" },
  { id: 4, kind: "flagged" as const, title: "RM800 overseas QR", time: "2d ago", note: "Blocked by you" },
  { id: 5, kind: "cleared" as const, title: "RM18 Grab ride", time: "3d ago", note: "Normal pattern" },
];

function AIMonitor() {
  return (
    <PhoneShell title="AI Guardian" showBack backTo="/guardian">
      <div className="px-5 pt-6 space-y-5">
        {/* Status */}
        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-3xl p-6 shadow-elevated">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
              <Bot size={30} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80">Active</p>
              <h2 className="text-xl font-bold">AI is monitoring your transactions</h2>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 text-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
            </span>
            <span className="opacity-95">Live · checked 24 transactions today</span>
          </div>
        </div>

        {/* Activity log */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Activity size={18} className="text-primary" />
            <h3 className="text-base font-semibold text-foreground">Recent activity</h3>
          </div>

          <div className="bg-card rounded-3xl shadow-card border border-border divide-y divide-border overflow-hidden">
            {log.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    item.kind === "flagged"
                      ? "bg-warning-soft text-warning-foreground"
                      : "bg-success-soft text-success"
                  }`}
                >
                  {item.kind === "flagged" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.note}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <Button asChild size="lg" className="w-full h-14 text-base font-semibold rounded-2xl shadow-card">
          <Link to="/demo" search={{ mode: "ai", step: "alert" } as never}>
            Try a demo alert
          </Link>
        </Button>
      </div>
    </PhoneShell>
  );
}
