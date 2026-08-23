/*
 * Canvas Workspace — shared class strings.
 *
 * These encode the brand rules that recur across the planner UI, so a change
 * to "what a card looks like" happens in one place. See the design-system
 * skill at .claude/skills/canvas-workspace-design/ for the source rules.
 */

/*
 * Focus is a 2px --brand-blue edge that REPLACES the resting border — never a
 * glow or outer ring. Implemented as a 1px border plus a 1px inset shadow so
 * the element does not shift by a pixel when focused.
 */
export const focusEdge =
  "outline-none focus:border-brand-blue focus:shadow-[inset_0_0_0_1px_var(--brand-blue)]";

export const focusEdgeVisible =
  "outline-none focus-visible:border-brand-blue focus-visible:shadow-[inset_0_0_0_1px_var(--brand-blue)]";

/* Inputs sit at the 8px corner with the strong hairline edge. */
export const inputBase = [
  "w-full rounded-md border border-hairline-strong bg-canvas text-ink",
  "placeholder:text-muted-ink",
  "transition-colors duration-150 ease-brand",
  focusEdge,
  "disabled:bg-surface disabled:text-muted-ink",
].join(" ");

/* Full-height control (44px) — search fields, selects. */
export const controlBase = `${inputBase} h-11 px-3 text-sm`;

/* Compact control (40px and below) — inline editors inside list rows. */
export const controlSm = `${inputBase} h-10 px-3 text-sm`;
export const controlXs = `${inputBase} h-8 px-2 text-[13px]`;

/*
 * Cards are flat: a hairline edge, never a shadow. Depth in this system is
 * spent on exactly one surface (the map).
 */
export const cardBase = "rounded-xl border border-hairline-soft bg-canvas";

/* An interactive card gains the quiet hover darkening, nothing more. */
export const cardInteractive = [
  cardBase,
  "transition-colors duration-150 ease-brand",
  "hover:border-hairline",
].join(" ");

/*
 * Selected state borrows the featured-pricing-card precedent: a 2px blue edge,
 * the only border in the system thicker than a hairline.
 */
export const cardSelected = "rounded-xl border-2 border-brand-blue bg-canvas";

/* Utility icon button — circular, per IconButton.prompt.md. */
export const iconButton = [
  "flex h-9 w-9 items-center justify-center rounded-full text-steel",
  "transition-colors duration-150 ease-brand",
  "hover:bg-hairline-soft hover:text-ink active:bg-hairline",
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
].join(" ");
