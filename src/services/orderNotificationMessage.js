const { formatInr } = require('../utils/money')

function buildOrderMessage(order, cafeName = 'Chai Swad') {
  const itemLines = order.items.map(
    (item) => `${item.quantity} × ${item.name}  ₹${formatInr(item.total)}`
  )
  const table = order.tableNumber ? String(order.tableNumber) : '—'

  return [
    `🔔 NEW ORDER — ${String(cafeName).toUpperCase()}`,
    '',
    `Order No: #${order.orderNumber}`,
    '',
    'Customer:',
    order.customer.name,
    '',
    'Phone:',
    order.customer.phone,
    '',
    'Address:',
    order.customer.address,
    '',
    'Table:',
    table,
    '',
    'ORDER DETAILS',
    '-------------------------',
    ...itemLines,
    '-------------------------',
    '',
    `Subtotal: ₹${formatInr(order.subtotal)}`,
    ...(order.tax > 0 ? [`Tax: ₹${formatInr(order.tax)}`, ''] : ['']),
    `TOTAL PAID: ₹${formatInr(order.total)}`,
    '',
    'Payment: ONLINE ✓',
    '',
    'Status: ORDER RECEIVED'
  ].join('\n')
}

module.exports = { buildOrderMessage }
