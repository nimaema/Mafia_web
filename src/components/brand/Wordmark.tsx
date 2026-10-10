type WordmarkProps = {
  className?: string;
  title?: string;
  /** One color for the whole mark (e.g. on a turquoise surface). By default the dots take the accent. */
  mono?: boolean;
}

/**
 * نقاب lettered in Blaka (an Arabic blackletter, SIL OFL), pre-shaped to outlines so no font ships.
 * The four letter dots are split out and inked in the accent: the brand's signature touch.
 */
export function Wordmark({ className, title = "نقاب", mono = false }: WordmarkProps) {
  return (
    <svg viewBox="3 -632 1459 770" className={className} role={title ? "img" : undefined} aria-label={title || undefined} aria-hidden={title ? undefined : true} fill="currentColor">
      <path d="M187 0 15 -47 53 -192 200 -154 497 -181V-351L648 -392V-92L652 -44L187 0ZM717 -4 677 -150 703 -157V-579L854 -620V-150L881 -49ZM868 0 828 -148 900 -155V-295H946L982 -430L1274 -350L1260 -299V-83L1272 -38ZM1051 -254V-169L1109 -174V-238ZM1259 7 1220 -139 1288 -158V-351L1439 -392V-86L1450 -45Z" />
      <path className={mono ? undefined : "fill-accent"} d="M503 126 484 53 632 13 651 85ZM1093 -454 1074 -527 1222 -567 1241 -495ZM958 -454 939 -527 1087 -567 1106 -495ZM1287 -404 1268 -477 1416 -517 1435 -445Z" />
    </svg>
  );
}
