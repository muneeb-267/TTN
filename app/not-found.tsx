import Link from "next/link";
import { PlaceFrame } from "@/components/place-media";
import { SCENE } from "@/lib/destinations";

export default function NotFound() {
  return (
    <div className="signin-stage flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <PlaceFrame src={SCENE.kkh} alt="Karakoram Highway" className="mb-8 h-48 w-full max-w-xl" />
      <p className="display text-6xl text-sand">Lost on the KKH</p>
      <p className="mt-3 text-sand/90">That page is not on this route.</p>
      <Link href="/" className="btn-gold mt-6 rounded-full px-5 py-2 font-semibold">
        Back to TTN
      </Link>
    </div>
  );
}
