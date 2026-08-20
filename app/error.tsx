"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="display text-4xl">Something went wrong. Please try again.</h1>
      <button className="btn-pine mt-6 rounded-full px-5 py-2.5" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
