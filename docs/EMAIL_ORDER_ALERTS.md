# Order email alerts (Resend)

After `POST /api/payment/verify` succeeds, the cafe receives an email via [Resend](https://resend.com).

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
