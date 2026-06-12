import { formatDistanceToNow } from "date-fns";
import {
  Eye,
  Heart,
  MessageSquare,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityItem {
  id: string;
  type: "view" | "save" | "message" | "match";
  title: string;
  description: string;
  timestamp: string;
}

const iconMap: Record<ActivityItem["type"], LucideIcon> = {
  view: Eye,
  save: Heart,
  message: MessageSquare,
  match: Sparkles,
};

const colorMap: Record<ActivityItem["type"], string> = {
  view: "bg-muted text-muted-foreground",
  save: "bg-destructive/10 text-destructive",
  message: "bg-primary/10 text-primary",
  match: "bg-ai/10 text-ai",
};

interface ActivityFeedProps {
  items: ActivityItem[];
  title?: string;
}

export function ActivityFeed({ items, title = "Recent Activity" }: ActivityFeedProps) {
  return (
    <div className="rounded-lg border bg-card shadow-card">
      <div className="border-b px-6 py-4">
        <h3 className="font-semibold">{title}</h3>
      </div>
      <ul className="divide-y">
        {items.map((item) => {
          const Icon = iconMap[item.type];
          return (
            <li key={item.id} className="flex gap-4 px-6 py-4">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  colorMap[item.type]
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <time className="shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
              </time>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
