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
- Refunds are only allowed before the remaining 50% is paid. The traveler must give account details for the payout.
- Within 24 hours: agency must refund in full. If they refuse, TTN fines them one seat fare on that trip.
- After 24 hours: of the half payment, TTN keeps 15%, the agency keeps 15%, traveler gets 20% back.
- TTN takes a 5% cut of each seat fare.
- Agency signup needs 20 WhatsApp review screenshots, two CNIC photos, and at least five client phone numbers. Admin approves before they can post trips.
- Star reviews (with photos) are only allowed after a completed trip.

## Payments (launch)

Money is collected by **TTN** (JazzCash, EasyPaisa, bank/Raast, or card). Seats are held for 45 minutes until the payment is confirmed.

| Method | How it confirms |
| --- | --- |
| JazzCash | Send to TTN’s wallet and submit the TID, **or** JazzCash hosted checkout when merchant keys are set |
| EasyPaisa | Send to TTN’s wallet and submit the TID |
| Bank / Raast | IBFT/Raast to TTN’s IBAN with the booking ref, then upload the receipt |
| Visa / Mastercard | Stripe Checkout (set `STRIPE_SECRET_KEY`) |

Wallet and bank transfers stay **pending** until an admin matches them on `/admin`. Put live account numbers and optional gateway keys in `.env` (see `.env.example`).
