# Jose Cosme Photography

React + Vite portfolio site prepared for a low-cost Cloudflare launch.

## Launch stack

- Frontend: Cloudflare Pages
- Checkout API: Cloudflare Pages Functions
- Images: start with bundled assets now, move to R2 or Cloudflare Images later
- Custom domain: add through Cloudflare Pages after first deploy

## Environment variables

For Cloudflare Pages / Functions:

- `STRIPE_SECRET_KEY`
- `CLIENT_URL`
- optional `VITE_API_URL`

For the Cloudflare setup in this repo, leave `VITE_API_URL` unset so the frontend uses the local `/api` function path automatically.

For local Cloudflare-style development, copy [.dev.vars.example](/c:/Users/Oosi/photo-print-site/.dev.vars.example) to `.dev.vars` and fill in your real values.

## Deploy on Cloudflare Pages

1. Push this repo to GitHub.
2. In Cloudflare Pages, create a new project from that repo.
3. Use these build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Add environment variables:
   - `STRIPE_SECRET_KEY`
   - `CLIENT_URL`
5. Deploy.
6. Attach your custom domain in Cloudflare Pages.

## Notes

- The Stripe checkout endpoint is implemented in [create-checkout-session.js](/c:/Users/Oosi/photo-print-site/functions/api/create-checkout-session.js).
- React client-side routes are handled by [public/_redirects](/c:/Users/Oosi/photo-print-site/public/_redirects).
- The `/studio` route is a temporary browser-local editor, not yet a shared client CMS.
