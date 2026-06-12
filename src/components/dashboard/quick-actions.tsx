import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  variant?: "default" | "ai" | "accent";
}

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
}

export function QuickActions({ actions, title = "Quick Actions" }: QuickActionsProps) {
  return (
    <div className="rounded-lg border bg-card shadow-card">
      <div className="border-b px-6 py-4">
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 hover:shadow-card-hover"
            >
              <div
                className={cn(
                  "rounded-lg p-2 transition-colors",
                  action.variant === "ai" && "bg-ai/10 text-ai group-hover:bg-ai/20",
                  action.variant === "accent" &&
                    "bg-accent/10 text-accent group-hover:bg-accent/20",
                  (!action.variant || action.variant === "default") &&
                    "bg-primary/10 text-primary group-hover:bg-primary/20"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
