"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadDocumentPdf, type DocumentMeta } from "@/lib/pdf";

export function DocumentDownloadButton({ doc }: { doc: DocumentMeta }) {
  const [busy, setBusy] = useState(false);

  const handleClick = () => {
    setBusy(true);
    try {
      downloadDocumentPdf(doc);
    } catch (err) {
      console.error("Failed to generate document PDF", err);
      alert("Sorry, the document could not be generated. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleClick} disabled={busy} aria-label={`Download ${doc.name}`}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
    </Button>
  );
}
