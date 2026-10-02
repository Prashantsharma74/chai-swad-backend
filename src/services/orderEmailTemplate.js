const { formatInr } = require('../utils/money')

const BRAND = {
  cream: '#FFF8EC',
  foam: '#FFFFFF',
  brown: '#2B211C',
  cocoa: '#6B5348',
  terracotta: '#6F3E22',
  clay: '#4A2817',
  leaf: '#5E7C4A',
  mist: '#E9DCCB',
  saffron: '#D98A32'
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatOrderTime(order) {
  if (!order.createdAt) return ''
  try {
    return new Date(order.createdAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return ''
  }
}

function buildOrderEmailHtml(order, cafeName = 'Chai Swad') {
  const tableLabel = order.tableNumber ? String(order.tableNumber) : '—'
  const orderedAt = formatOrderTime(order)
  const itemRows = order.items
    .map((item) => {
      const unit = item.price != null ? `₹${formatInr(item.price)} each` : ''
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BRAND.mist};font-size:15px;font-weight:600;color:${BRAND.brown};width:48px;vertical-align:top;">
            ${escapeHtml(item.quantity)}×
          </td>
          <td style="padding:12px 8px 12px 0;border-bottom:1px solid ${BRAND.mist};vertical-align:top;">
            <div style="font-size:15px;font-weight:600;color:${BRAND.brown};line-height:1.35;">
              ${escapeHtml(item.name)}
            </div>
            ${
              unit
                ? `<div style="font-size:12px;color:${BRAND.cocoa};margin-top:4px;">${escapeHtml(unit)}</div>`
                : ''
            }
          </td>
          <td style="padding:12px 0;border-bottom:1px solid ${BRAND.mist};font-size:15px;font-weight:600;color:${BRAND.brown};text-align:right;vertical-align:top;white-space:nowrap;">
            ₹${escapeHtml(formatInr(item.total))}
          </td>
        </tr>`
    })
    .join('')

  const taxRow =
    order.tax > 0
      ? `
        <tr>
          <td colspan="2" style="padding:8px 0 0;font-size:14px;color:${BRAND.cocoa};">Tax</td>
          <td style="padding:8px 0 0;font-size:14px;color:${BRAND.cocoa};text-align:right;">₹${escapeHtml(formatInr(order.tax))}</td>
        </tr>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>New order #${escapeHtml(order.orderNumber)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.mist};font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BRAND.mist};">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background-color:${BRAND.foam};border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(43,33,28,0.12);">
          <tr>
            <td style="background:linear-gradient(135deg, ${BRAND.terracotta} 0%, ${BRAND.clay} 100%);padding:28px 28px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,248,236,0.85);margin-bottom:8px;">
                      ${escapeHtml(cafeName)}
                    </div>
                    <div style="font-size:26px;font-weight:700;color:#FFFFFF;line-height:1.2;margin:0 0 12px;">
                      New order received
                    </div>
                    <div style="display:inline-block;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.35);border-radius:999px;padding:6px 14px;font-size:13px;font-weight:600;color:#FFFFFF;">
                      #${escapeHtml(order.orderNumber)}
                    </div>
                  </td>
                  <td align="right" valign="top" style="width:56px;">
                    <div style="width:48px;height:48px;line-height:48px;text-align:center;background:rgba(255,255,255,0.2);border-radius:12px;font-size:24px;">
                      ☕
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BRAND.cream};border-radius:12px;border:1px solid ${BRAND.mist};">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.cocoa};margin-bottom:12px;">
                      Customer
                    </div>
                    <div style="font-size:17px;font-weight:700;color:${BRAND.brown};margin-bottom:10px;">
                      ${escapeHtml(order.customer.name)}
                    </div>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:${BRAND.cocoa};width:72px;vertical-align:top;">Phone</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:600;color:${BRAND.brown};">
                          <a href="tel:${escapeHtml(order.customer.phone)}" style="color:${BRAND.terracotta};text-decoration:none;">
                            ${escapeHtml(order.customer.phone)}
                          </a>
                        </td>
                      </tr>
                      ${
                        order.customer.email
                          ? `<tr>
                        <td style="padding:6px 0;font-size:14px;color:${BRAND.cocoa};vertical-align:top;">Email</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:500;color:${BRAND.brown};">
                          <a href="mailto:${escapeHtml(order.customer.email)}" style="color:${BRAND.terracotta};text-decoration:none;">
                            ${escapeHtml(order.customer.email)}
                          </a>
                        </td>
                      </tr>`
                          : ''
                      }
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:${BRAND.cocoa};vertical-align:top;">Address</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:500;color:${BRAND.brown};line-height:1.45;">
                          ${escapeHtml(order.customer.address)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:${BRAND.cocoa};vertical-align:top;">Table</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:600;color:${BRAND.brown};">${escapeHtml(tableLabel)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 8px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.cocoa};margin-bottom:12px;">
                Order details
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td colspan="3" style="padding-bottom:8px;border-bottom:2px solid ${BRAND.terracotta};font-size:12px;font-weight:700;color:${BRAND.cocoa};text-transform:uppercase;letter-spacing:0.06em;">
                    <span style="display:inline-block;width:48px;">Qty</span>
                    <span>Item</span>
                  </td>
                </tr>
                ${itemRows}
                <tr>
                  <td colspan="2" style="padding:16px 0 4px;font-size:14px;color:${BRAND.cocoa};">Subtotal</td>
                  <td style="padding:16px 0 4px;font-size:14px;color:${BRAND.cocoa};text-align:right;">₹${escapeHtml(formatInr(order.subtotal))}</td>
                </tr>
                ${taxRow}
                <tr>
                  <td colspan="2" style="padding:12px 0 0;font-size:18px;font-weight:700;color:${BRAND.brown};">Total paid</td>
                  <td style="padding:12px 0 0;font-size:22px;font-weight:800;color:${BRAND.terracotta};text-align:right;">₹${escapeHtml(formatInr(order.total))}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="width:50%;padding-right:8px;">
                    <div style="background-color:#E8F3E4;border:1px solid #C5D9BC;border-radius:10px;padding:14px 16px;text-align:center;">
                      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${BRAND.leaf};margin-bottom:4px;">Payment</div>
                      <div style="font-size:15px;font-weight:700;color:${BRAND.leaf};">Online · Paid ✓</div>
                    </div>
                  </td>
                  <td style="width:50%;padding-left:8px;">
                    <div style="background-color:${BRAND.cream};border:1px solid ${BRAND.mist};border-radius:10px;padding:14px 16px;text-align:center;">
                      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${BRAND.cocoa};margin-bottom:4px;">Status</div>
                      <div style="font-size:15px;font-weight:700;color:${BRAND.brown};">Order received</div>
                    </div>
                  </td>
                </tr>
              </table>
              ${
                orderedAt
                  ? `<p style="margin:20px 0 0;font-size:12px;color:${BRAND.cocoa};text-align:center;line-height:1.5;">
                      Placed on ${escapeHtml(orderedAt)} (IST)
                    </p>`
                  : ''
              }
              <p style="margin:16px 0 0;font-size:11px;color:#9A8B7E;text-align:center;line-height:1.5;">
                Automated alert from ${escapeHtml(cafeName)} · Razorpay confirmed
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

module.exports = { buildOrderEmailHtml, escapeHtml }
