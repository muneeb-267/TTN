"use client";

import { SCENE } from "@/lib/destinations";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="signin-stage mx-auto min-h-[70vh] max-w-lg px-4 py-16 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SCENE.karakoram} alt="" className="mx-auto mb-8 h-44 w-full max-w-md rounded-3xl border-2 border-gold object-cover" />
      <h1 className="display text-4xl text-sand">Something went wrong. Please try again.</h1>
      <button className="btn-gold mt-6 rounded-full px-5 py-2.5 font-semibold" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
