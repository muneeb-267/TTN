"use client";

export function PrintButton({ label = "Print slip" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-gold rounded-full px-5 py-2.5">
      {label}
    </button>
  );
}
