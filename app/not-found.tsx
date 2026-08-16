import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="display text-6xl">Lost on the KKH</p>
      <p className="mt-3 text-ink/70">That page is not on this route.</p>
      <Link href="/" className="btn-pine mt-6 rounded-full px-5 py-2">
        Back to TTN
      </Link>
    </div>
  );
}
