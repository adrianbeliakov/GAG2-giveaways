import { GiveawayForm } from "@/components/admin/giveaway-form";

export const dynamic = "force-dynamic";

export default function NewGiveawayPage() {
  return (
    <div className="mx-auto max-w-xl">
      <div className="card p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Create a giveaway</h2>
        <GiveawayForm />
      </div>
    </div>
  );
}
