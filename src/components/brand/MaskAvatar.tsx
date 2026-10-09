import { MaskMark } from "./MaskMark";
import { hueColor, playerColor } from "@/lib/playerColor";

const SIZES = {
  xs: { box: "size-7 rounded-[0.55rem]", mask: "w-[72%]" },
  sm: { box: "size-9 rounded-[0.7rem]", mask: "w-[72%]" },
  md: { box: "size-11 rounded-[0.85rem]", mask: "w-[70%]" },
  lg: { box: "size-14 rounded-[1.05rem]", mask: "w-[70%]" },
  xl: { box: "size-20 rounded-[1.4rem]", mask: "w-[68%]" },
} as const;

type MaskAvatarProps = {
  /** Stable identity: user id when available, otherwise the player name. */
  seed: string | null | undefined;
  /** Pin a hue (from assignTableHues) so players at one table never share a color. */
  hue?: number;
  size?: keyof typeof SIZES;
  /** Out of the game: desaturated, with the mask dimmed. */
  eliminated?: boolean;
  /** Accessible name; omit when the name is printed right next to the avatar. */
  label?: string;
  className?: string;
};

export function MaskAvatar({ seed, hue, size = "md", eliminated = false, label, className = "" }: MaskAvatarProps) {
  const s = SIZES[size];
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-grid shrink-0 place-items-center ${s.box} ${eliminated ? "bg-raised text-faint" : "text-white"} ${className}`}
      style={eliminated ? undefined : { backgroundColor: hue === undefined ? playerColor(seed) : hueColor(hue) }}
    >
      <MaskMark className={`${s.mask} ${eliminated ? "opacity-60" : ""}`} />
    </span>
  );
}

type MaskStackProps = {
  seeds: string[];
  hues?: Map<string, number>;
  max?: number;
  size?: "xs" | "sm" | "md";
  /** Color of the ring that separates overlapping avatars; match the surface behind the stack. */
  ringClassName?: string;
  className?: string;
};

export function MaskStack({ seeds, hues, max = 6, size = "sm", ringClassName = "ring-surface", className = "" }: MaskStackProps) {
  const shown = seeds.slice(0, max);
  const rest = seeds.length - shown.length;
  return (
    <span className={`inline-flex items-center ${className}`}>
      <span className="flex -space-x-2 space-x-reverse">
        {shown.map((seed, index) => (
          <MaskAvatar key={`${seed}-${index}`} seed={seed} hue={hues?.get(seed)} size={size} className={`ring-[3px] ${ringClassName}`} />
        ))}
      </span>
      {rest > 0 ? <span className="ms-3 text-xs font-bold text-muted">{`+${rest.toLocaleString("fa-IR")}`}</span> : null}
    </span>
  );
}
