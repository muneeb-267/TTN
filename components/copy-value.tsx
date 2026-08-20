"use client";

import { useState } from "react";

export function CopyValue({ value, empty = "Not listed yet" }: { value: string; empty?: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return <span>{empty}</span>;
  return (
    <span className="inline-flex max-w-full items-center gap-2">
      <span className="break-all font-medium">{value}</span>
      <button
        type="button"
        className="shrink-0 rounded-full border border-ink/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-moss transition hover:border-gold hover:bg-gold/20"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          } catch {
            /* clipboard may be blocked on insecure origins */
          }
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </span>
  );
}
