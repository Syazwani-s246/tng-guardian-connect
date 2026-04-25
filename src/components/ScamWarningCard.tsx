import { AlertTriangle, AlertCircle, ShieldCheck } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ScamCheckResponse {
  receiverPhone: string;
  complaintCount: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  warningEN: string;
  warningBM: string;
  error: boolean;
}

export interface ScamWarningCardProps {
  result: ScamCheckResponse;
  onProceed: () => void;
  onCancel: () => void;
}

function getRiskConfig(result: ScamCheckResponse) {
  // Error state always uses amber regardless of riskLevel
  if (result.error) {
    return {
      bg: "bg-amber-50 border-amber-300",
      icon: <AlertCircle className="h-6 w-6 text-amber-600" />,
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    };
  }

  switch (result.riskLevel) {
    case "HIGH":
      return {
        bg: "bg-destructive/10 border-destructive/30",
        icon: <AlertTriangle className="h-6 w-6 text-destructive" />,
        badgeClass:
          "bg-destructive/10 text-destructive border-destructive/30",
      };
    case "MEDIUM":
      return {
        bg: "bg-amber-50 border-amber-300",
        icon: <AlertCircle className="h-6 w-6 text-amber-600" />,
        badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
      };
    case "LOW":
    default:
      return {
        bg: "bg-green-50 border-green-300",
        icon: <ShieldCheck className="h-6 w-6 text-green-600" />,
        badgeClass: "bg-green-100 text-green-800 border-green-300",
      };
  }
}

export function ScamWarningCard({
  result,
  onProceed,
  onCancel,
}: ScamWarningCardProps) {
  const config = getRiskConfig(result);

  return (
    <Card className={`border ${config.bg}`}>
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        {config.icon}
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">Scam Warning</CardTitle>
          <Badge className={config.badgeClass}>{result.riskLevel} RISK</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {result.complaintCount >= 0
              ? `${result.complaintCount} complaint${result.complaintCount !== 1 ? "s" : ""}`
              : "Unknown complaints"}
          </span>{" "}
          filed against this receiver
        </div>

        <p className="text-sm text-foreground">{result.warningEN}</p>
      </CardContent>

      <CardFooter className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onProceed}>
          Proceed Anyway
        </Button>
        <Button className="flex-1" onClick={onCancel}>
          Cancel Transfer
        </Button>
      </CardFooter>
    </Card>
  );
}
