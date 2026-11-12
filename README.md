# adyantcare-ui

Web app for AdyantCare. React 18 + TypeScript + Vite, React Query for server data, React Router, plain CSS.
It talks to the .NET API (`adyantcare-api`) over HTTPS.

- Sign in with phone number + country code (India is the default, United States also supported), by password or one-time code. Forgot password and change password are included.
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

## Run locally

```
copy .env.example .env      # set VITE_API_URL (default http://localhost:5080)
npm install
npm run dev                 # http://localhost:5173
```

`npm run typecheck` runs the TypeScript compiler (the production build does not block on type errors, so run this before pushing).

## Deploy

See `DEPLOY_GUIDE.md` in the parent folder (Vercel free plan, `vercel.json` included). Set `VITE_API_URL` in Vercel to the API address.
