export function PhoneShareBanner() {
  const urls = [process.env.SHARE_URL, process.env.SHARE_URL_ALT]
    .map((v) => v?.trim())
    .filter((v): v is string => Boolean(v));
  if (!urls.length) return null;
  const primary = urls[0];
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(primary)}`;
  return (
    <section className="border-b border-gold/30 bg-sand/70">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.25em] text-moss">OPEN ON ANY PHONE OR LAPTOP</p>
          <p className="mt-1 text-sm text-ink/80">
            Cursor preview links stay inside Cursor. Open one of these public https links in Chrome
            or Safari, or scan the QR.
          </p>
          <ul className="mt-2 space-y-1">
            {urls.map((url) => (
              <li key={url}>
                <a href={url} className="text-link break-all text-sm font-medium">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="QR code for TTN" className="h-28 w-28 rounded-xl bg-white p-1" />
      </div>
    </section>
  );
}
