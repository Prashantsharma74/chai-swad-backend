# WhatsApp order alerts (Twilio Try WhatsApp)

## Why you saw "Reminder: Appt Tue Oct 29, 3:00 PM"

`TWILIO_WHATSAPP_CONTENT_SID=HXfe5ab5f00277942d4d4200328b4d403c` is Twilio’s **demo appointment** template. On trial Try WhatsApp it sends **fixed sample text** and **ignores** your order variables.

**Do not use that SID for Chai Swad orders.**

## Correct setup (sandbox)

1. Twilio Console → **Try WhatsApp** (or Messaging → Try it out).
2. In the template dropdown, choose **Order notification** (not Appointment reminder).
3. Open the **API / curl** snippet and copy **`ContentSid`** (`HX…`).
4. Set in `backend/.env` and **Render**:

```env
TWILIO_WHATSAPP_TEMPLATE=order
TWILIO_WHATSAPP_ORDER_CONTENT_SID=HX_paste_from_order_notification_snippet_
TWILIO_WHATSAPP_FROM=whatsapp:+17372508034
WHATSAPP_BUSINESS_NUMBER=917470734508
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
```

5. Remove or leave empty the old demo line:

```env
# TWILIO_WHATSAPP_CONTENT_SID=HXfe5ab5f00277942d4d4200328b4d403c
```

6. From cafe phone `917470734508`, send **join …** to the sandbox number if needed.
7. Restart backend / redeploy Render.

## What the app sends

Template text (Twilio):

`Your {{1}} order of {{2}} has shipped and should be delivered on {{3}}. Details: {{4}}`

The app fills:

| Variable | Example |
|----------|---------|
| `1` | Chai Swad |
| `2` | `2x Masala Chai, 1x Samosa` |
| `3` | ASAP |
| `4` | `#CS123 \| Rahul \| 9876543210 \| ₹70 \| address…` |

Full formatted text is also built in code (`buildOrderMessage`) for **Meta WhatsApp** or production Twilio with free-form messages.

## Test locally

```bash
cd backend
npm run test:whatsapp
```

## Production

Register a real WhatsApp sender on Twilio/Meta; use an approved **order** template or plain text where allowed.
