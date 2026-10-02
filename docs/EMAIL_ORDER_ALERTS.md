# Order email alerts (Resend)

After `POST /api/payment/verify` succeeds:

1. **Cafe** — full order details to `ORDER_NOTIFY_EMAIL` (e.g. `prashantsharma7470@gmail.com`).
2. **Customer** — “order received” confirmation to the email they entered at checkout.

Both use [Resend](https://resend.com). If you only get the customer email, **`ORDER_NOTIFY_EMAIL` is missing on Render** (customer emails only need `RESEND_API_KEY`).

Check production: `GET /api/health` → `notifications.cafeNotifyConfigured` should be `true`.

## Environment variables

```env
RESEND_API_KEY=re_xxxx          # Resend dashboard → API Keys
RESEND_FROM=onboarding@resend.dev   # Test sender; use your domain after verification
ORDER_NOTIFY_EMAIL=prashantsharma7470@gmail.com
```

`ORDER_NOTIFY_EMAIL` falls back to `CAFE_EMAIL` if unset.

For production, verify a domain in Resend and set `RESEND_FROM` to e.g. `orders@yourdomain.com`.

## Test

```bash
cd backend
# Add RESEND_API_KEY to .env first
npm run test:email
```

Set the same variables on **Render** for production.
