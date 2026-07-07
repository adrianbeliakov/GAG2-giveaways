import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export const metadata = { title: "Set new password" };

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-sm pt-8">
      <div className="card animate-rise p-6 sm:p-8">
        <h1 className="mb-6 text-center font-display text-2xl font-bold">Set a new password</h1>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
