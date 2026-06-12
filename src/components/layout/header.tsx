"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, GitCompareArrows, Heart, LogOut, Menu, Sparkles, User } from "lucide-react";
import { siteConfig, navLinks, roleDashboardPath } from "@/config/site";
import { useAuthStore } from "@/stores/auth-store";
import { useSavedStore } from "@/stores/saved-store";
import { useCompareStore } from "@/stores/compare-store";
import { AiStatusBadge } from "@/components/ai/ai-status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const savedCount = useSavedStore((s) => s.savedIds.length);
  const compareCount = useCompareStore((s) => s.propertyIds.length);
  const navItems = [...navLinks.marketing, ...(isAuthenticated ? navLinks.buyer : [])];
  const mobileLinks = navItems;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow transition-transform group-hover:scale-105">
              <Sparkles className="h-[18px] w-[18px]" />
            </span>
            <span className="text-lg font-bold tracking-tight sm:text-xl">
              {siteConfig.name}
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <AiStatusBadge className="hidden lg:inline-flex" />
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                {mobileLinks.map((link) => (
                  <DropdownMenuItem key={link.href} onSelect={() => router.push(link.href)}>
                    {link.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                {isAuthenticated && user ? (
                  <>
                    <DropdownMenuItem onSelect={() => router.push(roleDashboardPath[user.role])}>
                      <User className="h-4 w-4" />
                      {user.firstName}'s dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleLogout}>
                      <LogOut className="h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onSelect={() => router.push("/auth/login")}>
                      Log in
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => router.push("/auth/signup")}>
                      Sign up
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Link href="/saved" className="relative">
            <Button variant="ghost" size="icon" aria-label="Saved properties">
              <Heart className="h-4 w-4" />
              {savedCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-ai text-[10px] font-bold text-ai-foreground">
                  {savedCount}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/compare" className="relative">
            <Button variant="ghost" size="icon" aria-label="Compare properties">
              <GitCompareArrows className="h-4 w-4" />
              {compareCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {compareCount}
                </span>
              )}
            </Button>
          </Link>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link href={roleDashboardPath[user.role]}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.firstName}</span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" variant="ai" className="shadow-glow-ai">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
