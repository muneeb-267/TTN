# TTN — Travel To North

A responsive website that lists northern Pakistan group tours from travel agencies. Travelers pick cinema-style seats, pay a 50% deposit 6–7 days ahead, and settle the rest one day before departure.

## Run locally

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run db:setup` loads **local demo data** (fake agencies, trips, and logins). Never run it against a live database.

### Local demo logins

These exist only after `db:setup` / `db:reset` on a development database:

| Role | Email | Password |
| --- | --- | --- |
| Traveler | sara@ttn.pk | Travel123! |
| Agency | hunza@karakoram.pk | Agency123! |
| Agency | skardu@northstar.pk | Agency123! |
| Admin | admin@ttn.pk | TTN-Admin-2026 |

Login forms on the live site are empty. Production bootstrap (`npm run db:prod`) creates **one admin** from `ADMIN_EMAIL` / `ADMIN_PASSWORD` and no demo travelers.

## Go live

1. Host on a VPS (or any machine with a **persistent disk**). SQLite and `public/uploads` live on that disk. Serverless hosts without a disk will lose bookings and payment screenshots.
2. Point a domain at the server. Set `APP_URL` to `https://your-domain` (no trailing slash).
3. Put secrets in the host environment, not in git: `AUTH_SECRET` (32+ random characters), `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
4. `npm run db:prod` then `npm run build` and `npm start`.
5. Sign in at `/admin/login` and paste the **real TTN bank IBAN** plus JazzCash / EasyPaisa wallets under `/admin/settings`.
6. Instant card/JazzCash stay off until merchant keys exist. Bank / wallet transfer with a screenshot is a valid launch path.

Do not set `PAYMENTS_MODE=mock` in production. Do not commit `.env`, Stripe keys, or JazzCash salts.

## Booking rules

- Book at least 6 days before departure: pay 50% to lock the seat. A 50% payment slip is created.
- Remaining 50% is due one day before the trip, with an in-app alert.
- Refunds are only allowed before the remaining 50% is paid. The traveler must give account details for the payout.
- Within 24 hours: agency must refund in full. If they refuse, TTN fines them one seat fare on that trip.
- After 24 hours: of the half payment, TTN keeps 15%, the agency keeps 15%, traveler gets 20% back.
- TTN takes a configurable platform commission (default 2.5%, stored in basis points on `/admin/commission`). The rate is snapshotted on each booking and is not rewritten when the setting changes.
- Agency signup needs 20 WhatsApp review screenshots, two CNIC photos, and at least five client phone numbers. Admin approves before they can post trips.
- Star reviews (with photos) are only allowed after a completed trip.

## Payments (launch)

TTN is a marketplace. Wallet/bank money usually goes to the **agency’s listed accounts**. Card checkout (Stripe) is collected by TTN when keys are set. Seats are held for a configurable window (default 10 minutes) until payment is confirmed server-side.

| Method | How it confirms |
| --- | --- |
| JazzCash | Send to the listed wallet and submit the TID, **or** JazzCash hosted checkout when merchant keys are set |
| EasyPaisa | Send to the listed wallet and submit the TID |
| Bank / Raast | IBFT/Raast to the listed IBAN with the booking ref, then upload the receipt |
| Visa / Mastercard | Stripe Checkout (set `STRIPE_SECRET_KEY`; webhook `/api/payments/stripe/webhook`) |

Wallet and bank transfers stay **pending** until matched. Hosted JazzCash/EasyPaisa/Stripe stay hidden until merchant approval, credentials, callbacks/webhooks, and the settlement arrangement exist.

Admin lives at `/admin` with a separate console for users, agencies, bookings, payments, settlements, commission and audit logs.

```bash
npm test
```
