import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pt-16 text-center">
      <div className="text-5xl" aria-hidden>🥀</div>
      <h1 className="mt-4 font-display text-2xl font-bold">Nothing grows here</h1>
      <p className="mt-2 text-sm text-fog">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="btn-primary mt-6">Back to giveaways</Link>
    </div>
  );
}
