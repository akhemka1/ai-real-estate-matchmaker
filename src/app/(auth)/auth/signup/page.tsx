import { SignupForm } from "@/components/forms/signup-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Sign Up",
};

export default function SignupPage() {
  return (
    <>
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Choose your account type</h1>
        <p className="text-sm text-muted-foreground">
          Start with a role-specific signup flow built for buyers, renters, sellers, and brokers.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          { href: "/auth/signup/buyer", label: "Buyer" },
          { href: "/auth/signup/renter", label: "Renter" },
          { href: "/auth/signup/seller", label: "Seller" },
          { href: "/auth/signup/broker", label: "Broker" },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Button variant="outline" className="w-full justify-start">
              {item.label}
            </Button>
          </Link>
        ))}
      </div>

      <div className="mt-6 border-t pt-6">
        <SignupForm />
      </div>
    </>
  );
}
