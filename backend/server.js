const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Stripe = require('stripe');

dotenv.config();

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const port = process.env.PORT || 4242;

app.use(cors());
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
  const { title, price } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: title,
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${clientUrl}/success`,
      cancel_url: `${clientUrl}/cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => console.log(`Stripe server running at http://localhost:${port}`));
