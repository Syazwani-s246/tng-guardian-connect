import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { ArrowRightLeft } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/transfer")({
  head: () => ({
    meta: [{ title: "Transfer — TNG eWallet" }],
  }),
  component: TransferScreen,
});

function TransferScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      navigate({ to: "/alert" });
    }, 2000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <PhoneShell title="Transfer" showBack backTo="/home" hideNav>
      <div className="flex flex-col items-center justify-center h-[calc(100vh-88px)] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary-soft flex items-center justify-center mb-5">
          <ArrowRightLeft size={36} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Processing Transfer</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Verifying transaction details with your recipient…
        </p>

        {/* Animated dots */}
        <div className="mt-6 flex items-center gap-2">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>

        {/* GOGuardian notice */}
        <div className="mt-10 flex items-center gap-2 bg-warning-soft text-warning-foreground px-4 py-2.5 rounded-full text-xs font-medium">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
          </svg>
          GOGuardian is reviewing this transaction
        </div>
      </div>
    </PhoneShell>
  );
}
