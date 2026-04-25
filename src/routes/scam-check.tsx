import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import {
  ScamWarningCard,
  type ScamCheckResponse,
} from "@/components/ScamWarningCard";
import { Loader2 } from "lucide-react";

interface ScamCheckSearch {
  receiverPhone: string;
  amount: string;
}

export const Route = createFileRoute("/scam-check")({
  validateSearch: (search: Record<string, unknown>): ScamCheckSearch => ({
    receiverPhone: (search.receiverPhone as string) ?? "",
    amount: (search.amount as string) ?? "0",
  }),
  head: () => ({
    meta: [{ title: "Scam Check — TNG eWallet" }],
  }),
  component: ScamCheckScreen,
});

function ScamCheckScreen() {
  const navigate = useNavigate();
  const { receiverPhone } = Route.useSearch();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ScamCheckResponse | null>(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function checkReceiver() {
      try {
        const res = await fetch("/receiver/scam-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receiverPhone }),
          signal: controller.signal,
        });
        const data = await res.json();
        setResult(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setFetchError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    checkReceiver();
    return () => controller.abort();
  }, [receiverPhone]);

  const handleProceed = () => {
    navigate({ to: "/risk-score" });
  };

  const handleCancel = () => {
    navigate({ to: "/home" });
  };

  // Fallback result for network errors
  const fallbackResult: ScamCheckResponse = {
    receiverPhone,
    complaintCount: -1,
    riskLevel: "MEDIUM",
    warningEN:
      "Unable to verify receiver history. Proceed with caution.",
    warningBM:
      "Tidak dapat mengesahkan sejarah penerima. Sila berhati-hati.",
    error: true,
  };

  return (
    <PhoneShell title="Scam Check" showBack backTo="/home" hideNav>
      <div className="px-5 pt-6 pb-10 space-y-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Checking receiver history...
            </p>
          </div>
        ) : (
          <ScamWarningCard
            result={fetchError ? fallbackResult : result!}
            onProceed={handleProceed}
            onCancel={handleCancel}
          />
        )}
      </div>
    </PhoneShell>
  );
}
