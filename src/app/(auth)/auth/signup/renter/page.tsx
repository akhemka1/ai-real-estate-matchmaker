import { SignupForm } from "@/components/forms/signup-form";

export const metadata = { title: "Renter Sign Up" };

export default function RenterSignupPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Renter account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Find rentals with stronger filters and more relevant results.
      </p>
      <div className="mt-6">
        <SignupForm defaultRole="renter" audience="renter" />
      </div>
    </>
  );
}