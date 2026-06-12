import { SignupForm } from "@/components/forms/signup-form";

export const metadata = { title: "Seller Sign Up" };

export default function SellerSignupPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Seller account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage listings, understand demand, and handle leads.
      </p>
      <div className="mt-6">
        <SignupForm defaultRole="seller" audience="seller" />
      </div>
    </>
  );
}