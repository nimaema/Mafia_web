"use client";

import type { ReactNode } from "react";

type MobilePwaFeatureLockProps = {
  children: ReactNode;
  title: string;
  description: string;
  icon?: string;
  compact?: boolean;
  className?: string;
};

export function MobilePwaFeatureLock({
  children,
  title: _title,
  description: _description,
  icon: _icon = "lock",
  compact: _compact = false,
  className: _className = "",
}: MobilePwaFeatureLockProps) {
  return <>{children}</>;
}
