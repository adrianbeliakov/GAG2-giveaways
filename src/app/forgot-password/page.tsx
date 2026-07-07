import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-sm pt-8">
      <div className="card animate-rise p-6 sm:p-8">
        <h1 className="mb-1 text-center font-display text-2xl font-bold">Reset your password</h1>
        <p className="mb-6 text-center text-sm text-fog">
          We&apos;ll email you a link to set a new one.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
