import type { ReactNode } from "react";

/*
 * Section divider — the one place the brand permits uppercase.
 *
 * The system is sentence case everywhere except an 11px micro-uppercase
 * divider (0.5px tracking). These sidebar headers play exactly that role.
 */
export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="micro-uppercase text-stone">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
