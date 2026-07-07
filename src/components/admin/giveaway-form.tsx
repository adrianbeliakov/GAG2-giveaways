"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  id?: string;
  title?: string;
  description?: string;
  prize?: string;
  endsAt?: string; // datetime-local value
  winnersCount?: number;
};

/** Create/edit form for giveaways (admin). */
export function GiveawayForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [prize, setPrize] = useState(initial?.prize ?? "");
  const [endsAt, setEndsAt] = useState(initial?.endsAt ?? "");
  const [winnersCount, setWinnersCount] = useState(initial?.winnersCount ?? 1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        isEdit ? `/api/admin/giveaways/${initial!.id}` : "/api/admin/giveaways",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            prize,
            endsAt: new Date(endsAt).toISOString(),
            winnersCount,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/admin/giveaways");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="label">Title</label>
        <input id="title" required maxLength={100} className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label htmlFor="description" className="label">Description</label>
        <textarea
          id="description"
          required
          maxLength={2000}
          rows={5}
          className="input resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="prize" className="label">Prize</label>
          <input id="prize" required maxLength={200} className="input" value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="e.g. Raccoon + 2x Dragonfly" />
        </div>
        <div>
          <label htmlFor="winners" className="label">Number of winners</label>
          <input
            id="winners"
            type="number"
            min={1}
            max={50}
            required
            className="input"
            value={winnersCount}
            onChange={(e) => setWinnersCount(Number(e.target.value))}
          />
        </div>
      </div>
      <div>
        <label htmlFor="endsAt" className="label">Ends at (your local time)</label>
        <input
          id="endsAt"
          type="datetime-local"
          required
          className="input"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-rose">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Saving…" : isEdit ? "Save changes" : "Create giveaway"}
      </button>
    </form>
  );
}
