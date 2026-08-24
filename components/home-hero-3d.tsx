"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type Destination = {
  name: string;
  query: string;
  image: string;
};

function compactImage(src: string, width: number) {
  return src.replace(/w=\d+/, `w=${width}`).replace(/q=\d+/, "q=65");
}

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
  const midRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLAnchorElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const orbit = destinations.slice(0, 6);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    const mid = midRef.current;
    const orbitEl = orbitRef.current;
    const copy = copyRef.current;
    const cue = cueRef.current;
    const hint = hintRef.current;
    if (!track || !stage || !mid || !orbitEl || !copy || !cue || !hint) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compact = window.matchMedia("(max-width: 768px)");
    const setMode = () => {
      stage.dataset.mode = motion.matches || compact.matches ? "lite" : "full";
    };
    setMode();

    if (motion.matches) {
      stage.dataset.reduced = "true";
      return;
    }

    let current = 0;
    let target = 0;
    let raf = 0;
    const apply = (p: number) => {
      const liteNow = stage.dataset.mode === "lite";
      mid.style.transform = `translate3d(0, ${(p * 72).toFixed(2)}px, 0)`;
      orbitEl.style.transform = liteNow
        ? ""
        : `rotateX(10deg) rotateY(${(-10 + p * -38).toFixed(2)}deg)`;
      const fade = Math.max(0, 1 - p * 1.15);
      copy.style.opacity = fade.toFixed(3);
      copy.style.transform = `translate3d(0, ${(-36 * p).toFixed(2)}px, 0)`;
      cue.style.opacity = Math.max(0, 1 - p * 1.7).toFixed(3);
      hint.style.opacity = Math.max(0, (p - 0.5) * 3).toFixed(3);
    };
    const read = () => {
      const total = Math.max(1, track.offsetHeight - window.innerHeight);
      return Math.min(1, Math.max(0, -track.getBoundingClientRect().top / total));
    };
    const tick = () => {
      raf = 0;
      current += (target - current) * 0.16;
      if (Math.abs(target - current) > 0.0007) {
        apply(current);
        raf = requestAnimationFrame(tick);
      } else {
        current = target;
        apply(current);
        stage.classList.remove("is-scrolling");
      }
    };
    const onScroll = () => {
      target = read();
      stage.classList.add("is-scrolling");
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        stage.classList.toggle("is-offscreen", !entry.isIntersecting);
      },
      { threshold: 0.05 },
    );
    io.observe(track);

    apply(0);
    const onCompact = () => {
      setMode();
      onScroll();
    };
    compact.addEventListener("change", onCompact);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      compact.removeEventListener("change", onCompact);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section ref={trackRef} className="hero-3d-track" aria-label="Travel To North">
      <div className="hero-3d-sticky">
        <div ref={stageRef} className="hero-3d-stage">
          <div className="hero-sky" />
          <div className="hero-sun" aria-hidden />
          <div
            ref={midRef}
            className="hero-layer hero-mid"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=65)",
            }}
          />
          <svg className="hero-ridge" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden>
            <path
              fill="#041912"
              d="M0,224L80,208C160,192,320,160,480,170.7C640,181,800,235,960,240C1120,245,1280,203,1360,181.3L1440,160L1440,320L0,320Z"
            />
            <path
              fill="#062c21"
              d="M0,256L120,240C240,224,480,192,720,197.3C960,203,1200,245,1320,266.7L1440,288L1440,320L0,320Z"
            />
          </svg>
          <div className="hero-vignette" aria-hidden />

          <div className="hero-orbit-layer">
            <div ref={orbitRef} className="hero-orbit-scroll">
              <div className="hero-orbit-spin">
                {orbit.map((d, i) => (
                  <Link
                    key={d.name}
                    href={`/trips?to=${encodeURIComponent(d.query)}`}
                    className="hero-orbit-card"
                    style={{ ["--i" as string]: String(i), ["--n" as string]: String(orbit.length) }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={compactImage(d.image, 480)} alt="" width={480} height={640} decoding="async" />
                    <span>{d.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div ref={copyRef} className="hero-copy">
            <p className="text-sm tracking-[0.35em] text-gold-2">PAKISTAN · TRAVEL TO NORTH</p>
            <h1 className="display mt-4 max-w-xl text-4xl leading-[0.95] text-sand sm:text-6xl lg:max-w-[34rem] lg:text-7xl">
              Your next trip to the North starts here.
            </h1>
            <p className="mt-5 max-w-xl text-base text-sand/90 sm:text-lg">
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
                  className="rounded-full border border-gold/70 bg-pine/55 px-5 py-2.5 font-semibold text-sand"
                >
                  Browse all trips
                </Link>
              ) : (
                <Link
                  href="/signin"
                  className="rounded-full border border-gold/70 bg-pine/55 px-5 py-2.5 font-semibold text-sand"
                >
                  {signInLabel}
                </Link>
              )}
            </div>
          </div>

          <a ref={cueRef} href="#trips" className="hero-scroll-cue">
            <span>Scroll to see trips</span>
            <span className="hero-scroll-chevron" aria-hidden />
          </a>
          <p ref={hintRef} className="hero-trips-hint display">
            Live trips below
          </p>
        </div>
      </div>
    </section>
  );
}
