import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

function classes(variant: Variant, size: Size, block: boolean, extra = "") {
  return [
    "nq-btn",
    `nq-btn-${variant}`,
    size === "lg" ? "nq-btn-lg" : size === "sm" ? "nq-btn-sm" : "",
    block ? "w-full" : "",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

type CommonProps = {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  icon,
  children,
  className,
  type = "button",
  ...rest
}: CommonProps & ComponentProps<"button">) {
  return (
    <button type={type} className={classes(variant, size, block, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  block = false,
  icon,
  children,
  className,
  ...rest
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link className={classes(variant, size, block, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
