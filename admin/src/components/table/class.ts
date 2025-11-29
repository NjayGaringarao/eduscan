import { cn } from "@/utils/style";

export const TABLE_WRAPPER = "rounded-md";
export const TABLE_BASE = "table-fixed w-full select-none bg-transparent";
export const TH_SELECT =
  "p-3 text-left font-semibold text-xs text-primary bg-panel border-b border-primary/30 sticky top-0 z-10";
export const TD_BASE = "p-1 align-middle text-sm text-primary";
export const TD_ID = `${TD_BASE} font-mono text-sm truncate max-w-[14rem]`;
export const ROW_BASE = "hover:bg-secondary transition-colors";
export const ROW_SELECTED = "bg-primary/10";

export const HEADER_TH_BASE = cn(
  "border",
  "text-center align-center font-semibold text-sm uppercase tracking-wide",
  "p-3 sticky top-0 z-10 relative"
);
