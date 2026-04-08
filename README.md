# Jose Cosme Photography

React + Vite portfolio site prepared for a low-cost Vercel launch.

## Launch stack

- Frontend: Vercel
- Checkout API: Vercel Serverless Function
- Images: bundled assets for launch, with room to move to a CDN workflow later
- Custom domain: add in Vercel after first deploy

## Environment variables

Set these in Vercel Project Settings:

- `STRIPE_SECRET_KEY`
- `CLIENT_URL`
- optional `VITE_API_URL`

Leave `VITE_API_URL` unset for the default Vercel setup so the frontend uses `/api` automatically.

## Deploy on Vercel

1. Import this GitHub repo into Vercel.
2. Use:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add:
   - `STRIPE_SECRET_KEY`
   - `CLIENT_URL`
4. Deploy.
5. Attach your custom domain in Vercel.

## Notes

- The Stripe checkout endpoint is implemented in `api/create-checkout-session.js`.
- SPA routing is handled by `vercel.json`.
- The `/studio` route is still a temporary browser-local editor, not yet a shared client CMS.
