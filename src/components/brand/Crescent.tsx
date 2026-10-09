import { useId } from "react";

/** The night's crescent moon with soft halo rings; transparent cut-out so it sits on any drench. */
export function Crescent({ className = "" }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <mask id={id}>
          <rect width="200" height="200" fill="#fff" />
          <circle cx="146" cy="88" r="70" fill="#000" />
        </mask>
      </defs>
      <circle cx="100" cy="100" r="98" fill="currentColor" opacity="0.04" />
      <circle cx="100" cy="100" r="84" fill="currentColor" opacity="0.05" />
      <circle cx="100" cy="100" r="68" fill="currentColor" mask={`url(#${id})`} />
    </svg>
  );
}
