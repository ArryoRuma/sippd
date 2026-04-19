# Sippd

Sippd is a coffee rating app for logging cups, scoring brews, and keeping track of coffees you want to revisit.

## What It Does

- Log coffees with ratings, notes, origin, roaster, and brew method.
- Keep a running history of every sip.
- Track favorites and compare top-rated coffees.
- Maintain a `Wanna Sip` list for coffees to try next.

## Deployment

Project-specific Vercel deployment steps are documented in [docs/vercel-deployment.md](docs/vercel-deployment.md).

## Environment

Set these environment variables before running the app locally or on Vercel:

```bash
NUXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NUXT_PUBLIC_SUPABASE_KEY=your_supabase_publishable_key
```

The legacy `SUPABASE_URL` and `SUPABASE_KEY` variables are still supported, but this repo should prefer the `NUXT_PUBLIC_` names.

## Setup

Make sure to install the dependencies:

```bash
pnpm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Production

Build the application for production:

```bash
pnpm build
```

Locally preview production build:

```bash
pnpm preview
```

## App Areas

- `/` landing page
- `/dashboard` overview of your coffee activity
- `/insights` deeper charts and trends with time-range filters
- `/log` coffee log
- `/score` ratings and rankings
- `/wanna-sipp` wishlist / backlog
