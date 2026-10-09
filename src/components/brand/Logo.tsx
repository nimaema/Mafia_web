import { MaskMark } from "./MaskMark";
import { Wordmark } from "./Wordmark";

type LogoProps = {
  className?: string;
  /** "full" = mask + wordmark, "word" = wordmark only, "mark" = mask only */
  variant?: "full" | "word" | "mark";
};

export function Logo({ className = "", variant = "full" }: LogoProps) {
  if (variant === "mark") return <MaskMark className={`h-6 text-accent ${className}`} title="نقاب" />;
  if (variant === "word") return <Wordmark className={`h-9 ${className}`} />;
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} aria-label="نقاب" role="img">
      <Wordmark className="h-9 text-fg" title="" />
      <MaskMark className="h-5 text-accent" />
    </span>
  );
}
