export const MASK_PATH =
  "M3 9C14 2 26 4 32 10C38 4 50 2 61 9C63 20 57 31 45 31C38 31 35 27 32 23C29 27 26 31 19 31C7 31 1 20 3 9ZM13 15C15 11 22 11 25 15C22 19 15 19 13 15ZM39 15C42 11 49 11 51 15C49 19 42 19 39 15Z";

type MaskMarkProps = {
  className?: string;
  title?: string;
};

/** The domino mask: Neghab's logo mark and the face of every player avatar. */
export function MaskMark({ className, title }: MaskMarkProps) {
  return (
    <svg
      viewBox="0 0 64 34"
      className={className}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path fillRule="evenodd" d={MASK_PATH} />
    </svg>
  );
}
