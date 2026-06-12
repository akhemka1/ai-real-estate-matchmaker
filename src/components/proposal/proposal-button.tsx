"use client";

import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export interface ProposalData {
  title: string;
  subtitle?: string; // developer or agent line
  location: string;
  priceLabel: string;
  highlights: { label: string; value: string }[];
  description: string;
  amenities?: string[];
  paymentPlan?: { label: string; value: string }[];
}

type ButtonVariant = React.ComponentProps<typeof Button>["variant"];

function esc(value: string): string {
  return value.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function buildHtml(d: ProposalData): string {
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const highlights = d.highlights
    .map(
      (h) =>
        `<div class="cell"><div class="k">${esc(h.label)}</div><div class="v">${esc(h.value)}</div></div>`
    )
    .join("");
  const amenities = (d.amenities ?? [])
    .map((a) => `<span class="chip">${esc(a)}</span>`)
    .join("");
  const plan = (d.paymentPlan ?? [])
    .map((p) => `<tr><td>${esc(p.label)}</td><td class="right">${esc(p.value)}</td></tr>`)
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<title>Proposal — ${esc(d.title)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;padding:32px;max-width:820px;margin:0 auto}
  .header{background:linear-gradient(110deg,#2f6bff,#7c3aed 55%,#10b6a0);color:#fff;border-radius:20px;padding:28px 32px}
  .brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:18px;opacity:.95}
  .badge{display:inline-block;margin-top:14px;background:rgba(255,255,255,.18);padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600}
  h1{font-size:28px;margin-top:10px;letter-spacing:-.02em}
  .sub{opacity:.9;margin-top:4px}
  .price{font-size:30px;font-weight:800;margin-top:18px}
  .section{margin-top:28px}
  .section h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:10px}
  .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
  .cell{border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px}
  .cell .k{font-size:12px;color:#64748b}
  .cell .v{font-size:16px;font-weight:700;margin-top:2px}
  p.desc{color:#334155;line-height:1.6}
  .chip{display:inline-block;border:1px solid #e2e8f0;border-radius:999px;padding:5px 12px;font-size:13px;margin:0 6px 6px 0}
  table{width:100%;border-collapse:collapse;font-size:14px}
  td{padding:10px 12px;border-bottom:1px solid #eef2f7}
  .right{text-align:right;font-weight:700}
  .footer{margin-top:36px;border-top:1px solid #e2e8f0;padding-top:16px;color:#94a3b8;font-size:12px;display:flex;justify-content:space-between}
  @media print{body{padding:0}.header{border-radius:0}.no-print{display:none}}
  .actions{margin-top:24px;text-align:center}
  .btn{background:#2f6bff;color:#fff;border:0;border-radius:10px;padding:10px 18px;font-weight:600;cursor:pointer}
</style></head>
<body>
  <div class="header">
    <div class="brand">◆ ${esc(siteConfig.name)}</div>
    <div class="badge">Property Proposal</div>
    <h1>${esc(d.title)}</h1>
    ${d.subtitle ? `<div class="sub">${esc(d.subtitle)}</div>` : ""}
    <div class="sub">${esc(d.location)}</div>
    <div class="price">${esc(d.priceLabel)}</div>
  </div>

  <div class="section"><h2>Key details</h2><div class="grid">${highlights}</div></div>
  <div class="section"><h2>Overview</h2><p class="desc">${esc(d.description)}</p></div>
  ${amenities ? `<div class="section"><h2>Amenities</h2>${amenities}</div>` : ""}
  ${plan ? `<div class="section"><h2>Payment plan</h2><table>${plan}</table></div>` : ""}

  <div class="footer"><span>Generated ${esc(date)}</span><span>${esc(siteConfig.name)} · ${esc(siteConfig.url)}</span></div>

  <div class="actions no-print"><button class="btn" onclick="window.print()">Save as PDF / Print</button></div>
</body></html>`;
}

interface ProposalButtonProps {
  data: ProposalData;
  label?: string;
  variant?: ButtonVariant;
  className?: string;
}

export function ProposalButton({ data, label = "Download proposal (PDF)", variant = "ai", className }: ProposalButtonProps) {
  const handleClick = () => {
    const win = window.open("", "_blank", "noopener,width=900,height=1000");
    if (!win) {
      alert("Please allow pop-ups to generate the proposal PDF.");
      return;
    }
    win.document.write(buildHtml(data));
    win.document.close();
    win.focus();
    // Give the document a moment to lay out, then open the print/save dialog.
    setTimeout(() => {
      try {
        win.print();
      } catch {
        /* user can use the in-page button */
      }
    }, 500);
  };

  return (
    <Button variant={variant} className={className} onClick={handleClick}>
      <FileText className="h-4 w-4" />
      {label}
    </Button>
  );
}
