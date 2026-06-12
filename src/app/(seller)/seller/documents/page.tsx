import { FileText, Upload, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentDownloadButton } from "@/components/documents/document-download-button";

type Doc = {
  id: string;
  name: string;
  property: string;
  type: string;
  size: string;
  status: "signed" | "pending";
  updated: string;
};

const documents: Doc[] = [
  {
    id: "doc1",
    name: "Listing Agreement.pdf",
    property: "Modern Craftsman with Mountain Views",
    type: "Agreement",
    size: "248 KB",
    status: "signed",
    updated: "2 days ago",
  },
  {
    id: "doc2",
    name: "Seller Disclosure.pdf",
    property: "Modern Craftsman with Mountain Views",
    type: "Disclosure",
    size: "1.2 MB",
    status: "signed",
    updated: "2 days ago",
  },
  {
    id: "doc3",
    name: "Purchase Offer.pdf",
    property: "Downtown Luxury Condo",
    type: "Offer",
    size: "512 KB",
    status: "pending",
    updated: "5 hours ago",
  },
  {
    id: "doc4",
    name: "Inspection Report.pdf",
    property: "Downtown Luxury Condo",
    type: "Report",
    size: "3.4 MB",
    status: "pending",
    updated: "Yesterday",
  },
];

export const metadata = {
  title: "Documents",
};

export default function SellerDocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground">
            Contracts, disclosures, and reports for your listings
          </p>
        </div>
        <Button variant="ai">
          <Upload className="h-4 w-4" />
          Upload document
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-4 text-left text-sm font-medium">Document</th>
              <th className="p-4 text-left text-sm font-medium">Property</th>
              <th className="p-4 text-left text-sm font-medium">Type</th>
              <th className="p-4 text-left text-sm font-medium">Status</th>
              <th className="p-4 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.size} · {doc.updated}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm text-muted-foreground">{doc.property}</td>
                <td className="p-4 text-sm text-muted-foreground">{doc.type}</td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      doc.status === "signed"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {doc.status === "signed" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {doc.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <DocumentDownloadButton
                    doc={{
                      name: doc.name,
                      property: doc.property,
                      type: doc.type,
                      status: doc.status,
                      updated: doc.updated,
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
