# Jose Cosme Photography

React + Vite portfolio site prepared for a low-cost Vercel launch with a shared text and catalog CMS.

## Launch stack

- Frontend: Vercel
- Checkout API: Vercel Serverless Functions
- Images: bundled assets for launch, with room to move to a CDN workflow later
- Custom domain: add in Vercel after first deploy
- CMS: password-protected shared text, collections, artworks, and image uploads stored through GitHub

## Environment variables

Set these in Vercel Project Settings:

- `STRIPE_SECRET_KEY`
- `CLIENT_URL`
- `CMS_ADMIN_PASSWORD`
- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- optional `GITHUB_BRANCH`
- optional `CMS_CONTENT_PATH`
- optional `CMS_CATALOG_PATH`
- optional `CMS_IMAGE_PATH`
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
   - `CMS_ADMIN_PASSWORD`
   - `GITHUB_TOKEN`
   - `GITHUB_OWNER`
   - `GITHUB_REPO`
   - optional `CMS_IMAGE_PATH`
4. Deploy.
5. Attach your custom domain in Vercel.

## Notes

- The Stripe checkout endpoint is implemented in `api/create-checkout-session.js`.
- The CMS endpoints live in `api/site-content.js`, `api/admin-login.js`, and `api/admin-session.js`.
- Shared CMS content is stored in `content/site-content.json`.
- Catalog endpoints live in `api/catalog.js` and `api/upload-image.js`.
- Shared catalog data is stored in `content/catalog.json`.
- SPA routing is handled by `vercel.json`.
- The `/studio` route now supports shared text editing, collections, artworks, and repo-backed image uploads once the CMS environment variables are configured.
