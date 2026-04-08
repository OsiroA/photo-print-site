export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return response.status(500).json({ error: 'Missing STRIPE_SECRET_KEY environment variable.' });
  }

  const title = String(request.body?.title || '').trim();
  const rawPrice = Number(request.body?.price);
  const unitAmount = Math.round(rawPrice * 100);

  if (!title || !Number.isFinite(rawPrice) || unitAmount <= 0) {
    return response.status(400).json({ error: 'A valid title and price are required.' });
  }

  const clientUrl =
    process.env.CLIENT_URL ||
    `https://${request.headers['x-forwarded-host'] || request.headers.host}`;

  const formBody = new URLSearchParams();
  formBody.set('mode', 'payment');
  formBody.set('success_url', `${clientUrl}/success`);
  formBody.set('cancel_url', `${clientUrl}/cancel`);
  formBody.set('line_items[0][price_data][currency]', 'usd');
  formBody.set('line_items[0][price_data][product_data][name]', title);
  formBody.set('line_items[0][price_data][unit_amount]', String(unitAmount));
  formBody.set('line_items[0][quantity]', '1');

  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody.toString(),
  });

  const stripeData = await stripeResponse.json();

  if (!stripeResponse.ok) {
    return response
      .status(stripeResponse.status)
      .json({ error: stripeData?.error?.message || 'Stripe session creation failed.' });
  }

  return response.status(200).json({ url: stripeData.url });
}
