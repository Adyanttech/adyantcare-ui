# adyantcare-ui

## What this is

The web app for **AdyantCare**, a hospital management platform from Adyant Technologies LLC. One app serves every hospital and every role: platform admin, hospital admin, doctor, front desk, lab technician and patient. Each hospital gets its own look (logo, banner, colour, tagline), live dashboards, reports with CSV export, appointments, consultations, lab, billing and a patient portal. Built with React 18, TypeScript and Vite.

**Business value:** a polished, branded experience that a hospital can see as its own product on day one, with no installs (it runs in the browser, on any device). Staff work faster from role-specific screens, administrators get reports they can act on, and patients get one combined record across hospitals, linked by their Aadhaar (India) or SSN (US).

The full application is three repos: `adyantcare-db`, `adyantcare-api` and `adyantcare-ui` (this one).

## Quick setup (your machine)

Needs Node.js 20 LTS, and the API running (see `adyantcare-api`).

```powershell
cd adyantcare-ui
copy .env.example .env      # VITE_API_URL defaults to http://localhost:5080
npm install
npm run dev                 # http://localhost:5173
```

Open http://localhost:5173. With demo data loaded, use the quick demo logins on the sign-in page (password `Demo@123`). Restart `npm run dev` after changing `.env`.

For hosting see `DEPLOY_GUIDE.md` in the parent folder.

## How it works

React Query for server data, React Router, plain CSS. It talks to the .NET API (`adyantcare-api`) over HTTPS.

- Sign in with a mobile number (country code, India default, United States also supported) or an email, by password or one-time code. Forgot password and change password are included.
- Every user and patient is registered with an Aadhaar (India) or SSN (US). Only the last 4 digits are ever shown.
- Hospital admins upload a logo and banner, pick a colour and tagline on the Branding page, and the whole app takes on that look. Reports and branding are for hospital admins.
- One app for every role: platform admin, hospital admin, doctor, front desk, lab technician, patient. The menu and pages depend on the role the API returns.
- The API decides which hospital the user belongs to. The UI never sends a hospital id.
- Users whose password was set by someone else are sent to "Change password" first.

## Structure

```
src/
  api.ts          fetch wrapper (adds the token, turns { error } into exceptions)
  auth.tsx        sign-in state
  ui.tsx          shared pieces (toasts, useLoad, PhoneField, formatting)
  types.ts        shapes returned by the API
  pages/          one file per screen
```

## Checks

`npm run typecheck` runs the TypeScript compiler (the production build does not block on type errors, so run this before pushing).

## Deploy

See `DEPLOY_GUIDE.md` in the parent folder (Vercel free plan, `vercel.json` included). Set `VITE_API_URL` in Vercel to the API address.
