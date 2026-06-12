import { SignupForm } from "@/components/forms/signup-form";

export const metadata = { title: "Broker Sign Up" };

export default function BrokerSignupPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Broker account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Run a modern brokerage workflow with AI-assisted client matching.
      </p>
      <div className="mt-6">
        <SignupForm defaultRole="agent" audience="broker" />
      </div>
    </>
  );
}