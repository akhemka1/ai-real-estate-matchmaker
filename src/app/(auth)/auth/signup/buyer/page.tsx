import { SignupForm } from "@/components/forms/signup-form";

export const metadata = { title: "Buyer Sign Up" };

export default function BuyerSignupPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Buyer account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Save homes, get AI matches, and compare properties faster.
      </p>
      <div className="mt-6">
        <SignupForm defaultRole="buyer" audience="buyer" />
      </div>
    </>
  );
}