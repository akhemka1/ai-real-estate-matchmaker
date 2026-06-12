"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthDivider, GoogleButton } from "@/components/auth/google-button";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

// Roles a visitor can self-select at signup ("admin" is provisioned internally).
type SignupRole = "buyer" | "renter" | "seller" | "agent";

const roles: { value: SignupRole; label: string; description: string }[] = [
  { value: "buyer", label: "Buyer", description: "Find your dream home with AI" },
  { value: "renter", label: "Renter", description: "Discover rental matches" },
  { value: "seller", label: "Seller", description: "List and manage properties" },
  { value: "agent", label: "Agent", description: "Manage clients and matches" },
];

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["buyer", "renter", "seller", "agent"]),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export type SignupAudience = "general" | "buyer" | "renter" | "seller" | "broker";

const audienceMap: Record<Exclude<SignupAudience, "general">, {
  role: SignupRole;
  title: string;
  subtitle: string;
  bullets: string[];
}> = {
  buyer: {
    role: "buyer",
    title: "Buyer account",
    subtitle: "Save homes, compare listings, and get explainable AI matches.",
    bullets: ["AI match scores", "Saved properties", "Comparison tools"],
  },
  renter: {
    role: "renter",
    title: "Renter account",
    subtitle: "Find rental matches faster with market-aware search.",
    bullets: ["Rental alerts", "Budget filters", "Move-in ready shortlist"],
  },
  seller: {
    role: "seller",
    title: "Seller account",
    subtitle: "Manage listings, understand demand, and handle leads.",
    bullets: ["Lead tracking", "Listing analytics", "AI price intelligence"],
  },
  broker: {
    role: "agent",
    title: "Broker account",
    subtitle: "Run a modern brokerage workflow with AI-assisted client matching.",
    bullets: ["Client matching", "Team dashboards", "Broker reporting"],
  },
};

interface SignupFormProps {
  defaultRole?: SignupRole;
  audience?: SignupAudience;
}

export function SignupForm({ defaultRole = "buyer", audience = "general" }: SignupFormProps) {
  const router = useRouter();
  const signUp = useAuthStore((s) => s.register);
  const [error, setError] = useState<string | null>(null);
  const audienceContent = audience === "general" ? null : audienceMap[audience];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
        role: defaultRole,
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: SignupFormValues) => {
    setError(null);
    try {
      await signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      });
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {audienceContent && (
        <div className="rounded-2xl border bg-muted/30 p-4">
          <p className="text-sm font-semibold text-foreground">{audienceContent.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{audienceContent.subtitle}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {audienceContent.bullets.map((bullet) => (
              <span key={bullet} className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                {bullet}
              </span>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-sm font-medium">
            First name
          </label>
          <input
            id="firstName"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register("firstName")}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="text-sm font-medium">
            Last name
          </label>
          <input
            id="lastName"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register("lastName")}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">I am a...</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {roles.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => setValue("role", role.value)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                selectedRole === role.value
                  ? "border-ai bg-ai/5 ring-2 ring-ai"
                  : "border-input hover:border-ai/50"
              )}
            >
              <p className="text-sm font-medium">{role.label}</p>
              <p className="text-xs text-muted-foreground">{role.description}</p>
            </button>
          ))}
        </div>
        <input type="hidden" {...register("role")} />
        {errors.role && (
          <p className="text-sm text-destructive">{errors.role.message}</p>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" variant="ai" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <AuthDivider />
      <GoogleButton role={selectedRole} label="Sign up with Google" redirectTo="/onboarding" />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
      </form>
    </div>
  );
}
