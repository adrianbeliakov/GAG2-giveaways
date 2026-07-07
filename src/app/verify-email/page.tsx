import { Suspense } from "react";
import { VerifyEmailClient } from "@/components/forms/verify-email-client";

export const metadata = { title: "Verify email" };

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto max-w-sm pt-8">
      <div className="card animate-rise p-6 sm:p-8">
        <h1 className="mb-6 text-center font-display text-2xl font-bold">Email verification</h1>
        <Suspense>
          <VerifyEmailClient />
        </Suspense>
      </div>
    </div>
  );
}
