import Link from "next/link";

export function PlaceHero({
  image,
  kicker,
  title,
  subtitle,
  compact,
}: {
  image: string;
  kicker: string;
  title: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <section className={`place-hero ${compact ? "place-hero-compact" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" />
      <div className="place-hero-copy">
        <p className="text-sm font-semibold tracking-[0.32em] text-gold-2">{kicker}</p>
        <h1 className="display mt-2 text-4xl text-sand sm:text-5xl">{title}</h1>
        {subtitle ? <p className="mt-3 max-w-2xl text-base text-sand/95 sm:text-lg">{subtitle}</p> : null}
      </div>
    </section>
  );
}

export function PlaceFrame({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`place-frame ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} />
    </div>
  );
}

export function AuthSplit({
  kicker,
  title,
  body,
  image,
  imageAlt,
  children,
}: {
  kicker: string;
  title: string;
  body: string;
  image: string;
  imageAlt: string;
  children: React.ReactNode;
}) {
  return (
    <section className="signin-stage">
      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-16">
        <div>
          <PlaceFrame src={image} alt={imageAlt} className="h-52 md:h-[28rem]" />
          <p className="signin-kicker mt-6">{kicker}</p>
          <h1 className="display mt-3 text-4xl text-sand sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-xl text-sand/95">{body}</p>
        </div>
        <div className="signin-panel">{children}</div>
      </div>
    </section>
  );
}

function PlaceCardBody({
  image,
  kicker,
  title,
  body,
  children,
}: {
  image: string;
  kicker?: string;
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <PlaceFrame src={image} alt={title} className="h-36 sm:h-full sm:min-h-[9.5rem]" />
      <div className="min-w-0 p-4">
        {kicker ? <p className="text-xs font-semibold tracking-[0.22em] text-moss">{kicker}</p> : null}
        <p className="display mt-1 text-2xl text-pine">{title}</p>
        {body ? <p className="mt-1 text-sm text-ink/80">{body}</p> : null}
        {children}
      </div>
    </>
  );
}

export function PlaceCard({
  image,
  kicker,
  title,
  body,
  children,
}: {
  image: string;
  kicker?: string;
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="place-link-card">
      <PlaceCardBody image={image} kicker={kicker} title={title} body={body}>
        {children}
      </PlaceCardBody>
    </div>
  );
}

export function PlaceLinkCard({
  href,
  image,
  kicker,
  title,
  body,
}: {
  href: string;
  image: string;
  kicker?: string;
  title: string;
  body?: string;
}) {
  return (
    <Link href={href} className="place-link-card">
      <PlaceCardBody image={image} kicker={kicker} title={title} body={body} />
    </Link>
  );
}
