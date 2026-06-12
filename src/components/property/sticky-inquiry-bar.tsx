"use client";

import Link from "next/link";
import { Calendar, MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn, formatMarketPrice } from "@/lib/utils";
import type { Property } from "@/types";

interface StickyInquiryBarProps {
  property: Pick<Property, "id" | "price" | "listingType" | "title" | "currency">;
  className?: string;
}

export function StickyInquiryBar({ property, className }: StickyInquiryBarProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur md:hidden",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">{property.title}</p>
          <p className="text-lg font-bold">
            {formatMarketPrice(property.price, property.listingType, property.currency)}
          </p>
        </div>
        <Button variant="outline" size="icon" asChild>
          <Link href={`/properties/${property.id}/contact?type=call`} aria-label="Call">
            <Phone className="size-4" />
          </Link>
        </Button>
        <Button variant="outline" size="icon" asChild>
          <Link
            href={`/properties/${property.id}/contact?type=message`}
            aria-label="Message"
          >
            <MessageCircle className="size-4" />
          </Link>
        </Button>
        <Button className="shrink-0" asChild>
          <Link href={`/properties/${property.id}/schedule`}>
            <Calendar className="mr-1 size-4" />
            Tour
          </Link>
        </Button>
      </div>
    </div>
  );
}
