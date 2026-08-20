"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type Destination = {
  name: string;
  query: string;
  image: string;
};

export function HomeHero3D({
  destinations,
  exploreLabel,
  signInLabel,
  signedIn,
}: {
  destinations: Destination[];
  exploreLabel: string;
  signInLabel: string;
  signedIn?: boolean;
}) {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const orbit = destinations.slice(0, 6);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      stage.dataset.reduced = "true";
      stage.style.setProperty("--p", "0.28");
      return;
    }

    let ticking = false;
    const update = () => {
      ticking = false;
      const total = Math.max(1, track.offsetHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, -track.getBoundingClientRect().top / total));
      stage.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section ref={trackRef} className="hero-3d-track" aria-label="Travel To North">
      <div className="hero-3d-sticky">
        <div ref={stageRef} className="hero-3d-stage grain">
          <div className="hero-3d-world">
            <div className="hero-sky" />
            <div className="hero-stars" aria-hidden />
            <div className="hero-sun" aria-hidden />
            <div
              className="hero-layer hero-far"
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1800&q=80)",
              }}
            />
            <div
              className="hero-layer hero-mid"
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1800&q=80)",
              }}
            />
            <svg className="hero-ridge" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden>
              <path
                fill="#0c1f1a"
                d="M0,224L80,208C160,192,320,160,480,170.7C640,181,800,235,960,240C1120,245,1280,203,1360,181.3L1440,160L1440,320L0,320Z"
              />
              <path
                fill="#102820"
                opacity="0.9"
                d="M0,256L120,240C240,224,480,192,720,197.3C960,203,1200,245,1320,266.7L1440,288L1440,320L0,320Z"
              />
            </svg>
            <div className="hero-mist" aria-hidden />
            <div className="hero-vignette" aria-hidden />
          </div>

          <div className="hero-orbit-layer">
            <div className="hero-orbit-scroll">
              <div className="hero-orbit-spin">
                {orbit.map((d, i) => (
                  <Link
                    key={d.name}
                    href={`/trips?to=${encodeURIComponent(d.query)}`}
                    className="hero-orbit-card"
                    style={{ ["--i" as string]: String(i) }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.image} alt="" />
                    <span>{d.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="hero-copy">
            <p className="text-sm tracking-[0.35em] text-gold-2">PAKISTAN · TRAVEL TO NORTH</p>
            <h1 className="display mt-4 max-w-xl text-4xl leading-[0.95] text-sand sm:text-6xl lg:max-w-[34rem] lg:text-7xl">
              Your next trip to the North starts here.
            </h1>
            <p className="mt-5 max-w-xl text-base text-sand/85 sm:text-lg">
              Scroll through the mountains. Live group tours from verified agencies appear below — no
              account needed to browse.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#trips" className="btn-gold rounded-full px-5 py-2.5 font-semibold">
                {exploreLabel}
              </a>
              {signedIn ? (
                <Link
                  href="/trips"
                  className="rounded-full border border-sand/40 px-5 py-2.5 font-semibold text-sand transition hover:bg-sand/10"
                >
                  Browse all trips
                </Link>
              ) : (
                <Link
                  href="/signin"
                  className="rounded-full border border-sand/40 px-5 py-2.5 font-semibold text-sand transition hover:bg-sand/10"
                >
                  {signInLabel}
                </Link>
              )}
            </div>
          </div>

          <a href="#trips" className="hero-scroll-cue">
            <span>Scroll to see trips</span>
            <span className="hero-scroll-chevron" aria-hidden />
          </a>
          <p className="hero-trips-hint display">Live trips below</p>
        </div>
      </div>
    </section>
  );
}
