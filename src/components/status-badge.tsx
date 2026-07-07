export function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="chip bg-leaf-deep text-leaf">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-leaf" />
      Active
    </span>
  ) : (
    <span className="chip bg-line/60 text-fog">Ended</span>
  );
}
