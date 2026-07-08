/**
 * GAG2 Giveaways logo mark: a sprout growing inside a soft ring,
 * with a small golden seed — "plant your entry, win the harvest".
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Outer ring */}
      <circle cx="24" cy="24" r="21" stroke="#25332C" strokeWidth="2" />
      <circle
        cx="24"
        cy="24"
        r="21"
        stroke="#6EE7A0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="66 132"
        strokeDashoffset="-16"
        opacity="0.9"
      />
      {/* Stem */}
      <path
        d="M24 36V22"
        stroke="#6EE7A0"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Left leaf */}
      <path
        d="M24 26C24 26 15.5 25.5 13 17.5C21.5 17 24 22 24 26Z"
        fill="#6EE7A0"
        fillOpacity="0.9"
      />
      {/* Right leaf */}
      <path
        d="M24 22C24 22 31 21.5 33.5 15C26 14.5 24 18.5 24 22Z"
        fill="#6EE7A0"
        fillOpacity="0.55"
      />
      {/* Golden seed */}
      <circle cx="24" cy="38.5" r="2.5" fill="#F2C14E" />
    </svg>
  );
}
