const { formatInr } = require('../utils/money')
const { escapeHtml } = require('./orderEmailTemplate')

const BRAND = {
  cream: '#FFF8EC',
  foam: '#FFFFFF',
  brown: '#2B211C',
  cocoa: '#6B5348',
  terracotta: '#6F3E22',
  clay: '#4A2817',
  leaf: '#5E7C4A',
  mist: '#E9DCCB'
}

function buildCustomerOrderEmailHtml(order, cafeName = 'Chai Swad') {
  const firstName = escapeHtml((order.customer.name || '').trim().split(/\s+/)[0] || 'there')
  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.mist};font-size:14px;color:${BRAND.brown};">
            <strong>${escapeHtml(item.quantity)}×</strong> ${escapeHtml(item.name)}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.mist};font-size:14px;color:${BRAND.brown};text-align:right;white-space:nowrap;">
            ₹${escapeHtml(formatInr(item.total))}
          </td>
        </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Order received — ${escapeHtml(order.orderNumber)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.mist};font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BRAND.mist};">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:${BRAND.foam};border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(43,33,28,0.1);">
          <tr>
            <td style="background:linear-gradient(135deg, ${BRAND.terracotta}, ${BRAND.clay});padding:32px 28px;text-align:center;">
              <div style="font-size:40px;line-height:1;margin-bottom:12px;">✓</div>
              <div style="font-size:24px;font-weight:700;color:#fff;margin-bottom:8px;">We got your order!</div>
              <div style="font-size:15px;color:rgba(255,248,236,0.9);">Thanks, ${firstName}. ${escapeHtml(cafeName)} is on it.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${BRAND.cocoa};">
                Your payment was successful. We have received your order and will start preparing it shortly.
              </p>
              <div style="background:${BRAND.cream};border:1px solid ${BRAND.mist};border-radius:12px;padding:16px 18px;margin-bottom:20px;">
                <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.cocoa};margin-bottom:6px;">Order number</div>
                <div style="font-size:20px;font-weight:800;color:${BRAND.terracotta};">#${escapeHtml(order.orderNumber)}</div>
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
                ${itemRows}
                <tr>
                  <td style="padding:14px 0 0;font-size:16px;font-weight:700;color:${BRAND.brown};">Total paid</td>
                  <td style="padding:14px 0 0;font-size:18px;font-weight:800;color:${BRAND.terracotta};text-align:right;">₹${escapeHtml(formatInr(order.total))}</td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;line-height:1.5;color:${BRAND.cocoa};">
                <strong>Delivery to:</strong> ${escapeHtml(order.customer.address)}
              </p>
              <p style="margin:12px 0 0;font-size:13px;color:${BRAND.cocoa};">
                Questions? Call us at the number on our Contact page — mention order <strong>#${escapeHtml(order.orderNumber)}</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9A8B7E;">${escapeHtml(cafeName)} · Fresh chai &amp; snacks</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildCustomerOrderEmailText(order, cafeName = 'Chai Swad') {
  const lines = order.items.map(
    (item) => `  ${item.quantity} × ${item.name} — ₹${formatInr(item.total)}`
  )
  return [
    `Hi ${order.customer.name},`,
    '',
    `Thank you! ${cafeName} has received your order.`,
    '',
    `Order #${order.orderNumber}`,
    '',
    ...lines,
    '',
    `Total paid: ₹${formatInr(order.total)}`,
    '',
    `Delivery address: ${order.customer.address}`,
    '',
    'We will start preparing your order soon.'
  ].join('\n')
}

module.exports = { buildCustomerOrderEmailHtml, buildCustomerOrderEmailText }
