export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.STRIPE_SECRET_KEY) {
    return Response.json(
      { error: 'Missing STRIPE_SECRET_KEY environment variable.' },
      { status: 500 },
    );
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const title = String(payload.title || '').trim();
  const rawPrice = Number(payload.price);
  const unitAmount = Math.round(rawPrice * 100);

  if (!title || !Number.isFinite(rawPrice) || unitAmount <= 0) {
    return Response.json(
      { error: 'A valid title and price are required.' },
      { status: 400 },
    );
  }

  const clientUrl = env.CLIENT_URL || new URL(request.url).origin;
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
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody.toString(),
  });

  const stripeData = await stripeResponse.json();

  if (!stripeResponse.ok) {
    return Response.json(
      { error: stripeData?.error?.message || 'Stripe session creation failed.' },
      { status: stripeResponse.status },
    );
  }

  return Response.json({ url: stripeData.url });
}
