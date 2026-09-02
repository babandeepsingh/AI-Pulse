This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
"# AI-News" 

## Push Notifications (browser + iPhone/iPad)

Subscribers get a browser notification the moment an admin publishes an article
(via `POST /api/admin/add-article` or `POST /api/admin/approve-article/[id]`).

### 1. Run the migration

```bash
psql "$DATABASE_URL" -f lib/migrations/0001_push_subscriptions.sql
```

### 2. Generate VAPID keys and set env vars

```bash
npx web-push generate-vapid-keys
```

```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com
```

The keys are a permanent identity for the site — rotating them invalidates every
existing subscription. If they are absent the app degrades gracefully: the opt-in
prompt hides itself and publishing simply skips the push.

### 3. How users subscribe

- **Desktop & Android** (Chrome, Edge, Firefox, macOS Safari): a prompt appears
  on the site; one tap enables notifications.
- **iPhone / iPad**: iOS only permits Web Push for sites installed to the Home
  Screen (iOS 16.4+). The site shows iOS visitors a banner explaining
  *Share → Add to Home Screen*; after opening the app from the Home Screen they
  get the normal opt-in prompt. There is no way to notify iOS Safari tabs.

Dead endpoints returned by push services (404/410) are automatically deactivated.
