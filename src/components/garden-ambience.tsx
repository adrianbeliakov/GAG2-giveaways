/**
 * Decorative, pure-CSS ambience for the hero: a slow aurora of canopy light
 * and bioluminescent spores drifting upward. Server-rendered, zero JS.
 * Deterministic values (no Math.random) so server and client HTML match.
 */
const SPORES: Array<{
  left: string;
  size: string;
  duration: string;
  delay: string;
  drift: string;
  opacity: string;
  gold?: boolean;
}> = [
  { left: "6%", size: "4px", duration: "16s", delay: "0s", drift: "22px", opacity: "0.5" },
  { left: "13%", size: "6px", duration: "13s", delay: "2.5s", drift: "-18px", opacity: "0.65" },
  { left: "21%", size: "3px", duration: "19s", delay: "5s", drift: "14px", opacity: "0.4" },
  { left: "29%", size: "5px", duration: "14s", delay: "1s", drift: "-24px", opacity: "0.6", gold: true },
  { left: "37%", size: "4px", duration: "17s", delay: "7s", drift: "10px", opacity: "0.5" },
  { left: "45%", size: "7px", duration: "12s", delay: "3.5s", drift: "-14px", opacity: "0.7" },
  { left: "53%", size: "3px", duration: "20s", delay: "0.5s", drift: "26px", opacity: "0.35" },
  { left: "60%", size: "5px", duration: "15s", delay: "6s", drift: "-20px", opacity: "0.6" },
  { left: "67%", size: "4px", duration: "18s", delay: "2s", drift: "16px", opacity: "0.45", gold: true },
  { left: "74%", size: "6px", duration: "13.5s", delay: "8s", drift: "-12px", opacity: "0.65" },
  { left: "81%", size: "3px", duration: "21s", delay: "4s", drift: "20px", opacity: "0.4" },
  { left: "88%", size: "5px", duration: "14.5s", delay: "1.5s", drift: "-26px", opacity: "0.6" },
  { left: "94%", size: "4px", duration: "17.5s", delay: "6.5s", drift: "12px", opacity: "0.5" },
];

export function GardenAmbience() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Aurora: soft canopy light drifting side to side */}
      <div
        className="absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 animate-aurora rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(110,231,160,0.16), rgba(110,231,160,0.05) 55%, transparent 75%)",
          filter: "blur(30px)",
        }}
      />
      <div
        className="absolute -top-24 left-1/3 h-[300px] w-[420px] animate-aurora rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(242,193,78,0.08), transparent 70%)",
          filter: "blur(34px)",
          animationDelay: "-8s",
        }}
      />
      {/* Floating spores */}
      {SPORES.map((s, i) => (
        <span
          key={i}
          className={`spore ${s.gold ? "spore-gold" : ""}`}
          style={
            {
              "--spore-left": s.left,
              "--spore-size": s.size,
              "--spore-duration": s.duration,
              "--spore-delay": s.delay,
              "--spore-drift": s.drift,
              "--spore-opacity": s.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
