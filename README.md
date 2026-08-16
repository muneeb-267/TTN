# TTN — Travel To North

A responsive website that lists northern Pakistan group tours from travel agencies. Travelers pick cinema-style seats, pay a 50% deposit 6–7 days ahead, and settle the rest one day before departure.

## Run locally

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on this computer.

To open the same site on a phone or another laptop, do not use `localhost` or the Cursor preview URL. From the project folder run:

```bash
npm run build
npm run start -- -H 0.0.0.0 -p 3000
npx --yes cloudflared tunnel --url http://127.0.0.1:3000
```

Cloudflared prints an `https://….trycloudflare.com` link. Open that on any device. If Cloudflare is blocked on your network, use Pinggy instead:

```bash
ssh -p 443 -R0:127.0.0.1:3000 a.pinggy.io
```

Then set `SHARE_URL` in `.env` to that https link so the homepage shows a QR code.

## Demo logins

| Role | Email | Password |
| --- | --- | --- |
| Traveler | sara@ttn.pk | Travel123! |
| Agency | hunza@karakoram.pk | Agency123! |
| Agency | skardu@northstar.pk | Agency123! |
| Admin | admin@ttn.pk | TTN-Admin-2026 |

## Booking rules

- Book at least 6 days before departure: pay 50% to lock the seat. A 50% payment slip is created.
- Remaining 50% is due one day before the trip, with an in-app alert.
- Same-day cancel: traveler requests a full refund from the agency.
- After one day: of the half payment, TTN keeps 15%, the agency keeps 15%, traveler gets 20% back.
- TTN takes a 5% cut of each seat fare.
- Agency signup needs 20 WhatsApp review screenshots, two CNIC photos, and at least five client phone numbers. Admin approves before they can post trips.
- Star reviews are only allowed after a completed trip.

Payments are recorded as a demo checkout (JazzCash / EasyPaisa / card / bank). Connect a Pakistan PSP when you go live — Stripe does not onboard Pakistan merchants.
