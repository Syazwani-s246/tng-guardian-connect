import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import type { TransactionRecord } from "@/types/transaction";

interface TransactionReviewProps {
  transaction: TransactionRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Converts a score in [0.0, 1.0] to a rounded percentage integer in [0, 100].
 */
export function formatScoreAsPercentage(score: number): number {
  return Math.round(score * 100);
}

function getDecisionBadgeClass(decision: string): string {
  const normalized = decision.toUpperCase();
  if (normalized === "APPROVE" || normalized === "APPROVED") {
    return "bg-success text-success-foreground";
  }
  if (normalized === "BLOCK" || normalized === "BLOCKED") {
    return "bg-warning text-warning-foreground";
  }
  // HOLD / PENDING
  return "bg-muted text-muted-foreground";
}

function getVerdictBadgeClass(
  verdict: "CONFIRMED" | "OVERRIDDEN" | "FLAGGED" | null,
): string {
  if (verdict === "CONFIRMED") {
    return "bg-success text-success-foreground";
  }
  if (verdict === "OVERRIDDEN") {
    return "bg-destructive text-destructive-foreground";
  }
  if (verdict === "FLAGGED") {
    return "bg-warning text-warning-foreground";
  }
  return "bg-muted text-muted-foreground";
}

function formatAmount(amount: number): string {
  return `RM${amount.toFixed(2)}`;
}

export function TransactionReview({
  transaction,
  open,
  onOpenChange,
}: TransactionReviewProps) {
  if (!transaction) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Transaction Review</SheetTitle>
            <SheetDescription>No transaction selected.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const isBypassOrXgboost =
    transaction.decisionBy === "BYPASS" ||
    transaction.decisionBy === "XGBOOST";

  const isOverridden = transaction.auditVerdict === "OVERRIDDEN";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-3xl pb-8"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>Transaction Review</SheetTitle>
          <SheetDescription>
            Full AI verification details for this transaction.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-1">
          {/* Transaction Info */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">
              Transaction Info
            </h4>
            <div className="bg-secondary/50 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Receiver</span>
                <span className="font-medium text-foreground">
                  {transaction.receiverName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium text-foreground">
                  {formatAmount(transaction.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium text-foreground">
                  {format(new Date(transaction.timestamp), "dd MMM yyyy, h:mm a")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risk Score</span>
                <span className="font-medium text-foreground">
                  {formatScoreAsPercentage(transaction.riskScore)}%
                </span>
              </div>
            </div>
          </section>

          {/* Override Alert */}
          {isOverridden && !isBypassOrXgboost && (
            <Alert variant="destructive" className="rounded-2xl">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Decision Overridden</AlertTitle>
              <AlertDescription>
                Layer 3 Audit overrode the Layer 2 decision. The AI decision of{" "}
                <strong>{transaction.decision}</strong> was found to be
                inconsistent and has been flagged for review.
              </AlertDescription>
            </Alert>
          )}

          {/* Layer 2 Decision */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">
              AI Decision (Layer 2)
            </h4>
            {isBypassOrXgboost ? (
              <div className="bg-secondary/50 rounded-2xl p-4">
                <p className="text-sm text-muted-foreground">
                  AI analysis was not performed for this transaction.
                </p>
              </div>
            ) : (
              <div className="bg-secondary/50 rounded-2xl p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Decision</span>
                  <Badge className={getDecisionBadgeClass(transaction.decision)}>
                    {transaction.decision}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Decided By</span>
                  <span className="font-medium text-foreground">
                    {transaction.decisionBy}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium text-foreground">
                    {transaction.confidence != null
                      ? `${formatScoreAsPercentage(transaction.confidence)}%`
                      : "—"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Reason (EN)</span>
                  <p className="text-foreground">{transaction.reason}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Reason (BM)</span>
                  <p className="text-foreground">{transaction.reasonBM}</p>
                </div>
              </div>
            )}
          </section>

          {/* Layer 3 Audit */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">
              Audit Verification (Layer 3)
            </h4>
            {isBypassOrXgboost ? (
              <div className="bg-secondary/50 rounded-2xl p-4">
                <p className="text-sm text-muted-foreground">
                  Audit verification is not applicable for this transaction.
                </p>
              </div>
            ) : (
              <div className="bg-secondary/50 rounded-2xl p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Verdict</span>
                  <Badge
                    className={getVerdictBadgeClass(transaction.auditVerdict)}
                  >
                    {transaction.auditVerdict ?? "—"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Consistency Score
                  </span>
                  <span className="font-medium text-foreground">
                    {transaction.consistencyScore != null
                      ? `${formatScoreAsPercentage(transaction.consistencyScore)}%`
                      : "—"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">
                    Audit Reason (EN)
                  </span>
                  <p className="text-foreground">
                    {transaction.auditReason ?? "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">
                    Audit Reason (BM)
                  </span>
                  <p className="text-foreground">
                    {transaction.auditReasonBM ?? "—"}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
