"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadProposalPdf, type ProposalData } from "@/lib/pdf";

export type { ProposalData };

type ButtonVariant = React.ComponentProps<typeof Button>["variant"];

interface ProposalButtonProps {
  data: ProposalData;
  label?: string;
  variant?: ButtonVariant;
  className?: string;
}

export function ProposalButton({
  data,
  label = "Download proposal (PDF)",
  variant = "ai",
  className,
}: ProposalButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleClick = () => {
    setBusy(true);
    try {
      downloadProposalPdf(data);
    } catch (err) {
      console.error("Failed to generate proposal PDF", err);
      alert("Sorry, the proposal could not be generated. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant={variant} className={className} onClick={handleClick} disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
      {label}
    </Button>
  );
}
