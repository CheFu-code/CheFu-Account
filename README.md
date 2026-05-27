# CheFu Account

Standalone Next.js account and authentication app for CheFu products.

Production target:

```bash
https://myaccount.chefuinc.com
```

Local setup:

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app uses the CheFu Inc backend for sessions and profile management, and Firebase Auth for email/password sign-in.
