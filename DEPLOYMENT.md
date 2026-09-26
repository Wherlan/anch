# Database and deployment

The app uses Prisma with a local SQLite database. For development, copy `.env.example` to `.env`; Prisma stores `dev.db` under `prisma/`.

## Railway

1. Create a Railway project from this repository.
2. Add a persistent volume to the app service and mount it at `/data`.
3. Set `DATABASE_URL` to `file:/data/anchor.db` and set `AUTH_SECRET` to a unique random value.
4. Deploy with the default build and start commands. The start script applies Prisma migrations before starting Next.js.

The SQLite file persists across deploys only while the volume remains attached. Back it up independently.

## Netlify

Netlify's function filesystem is ephemeral, so this local SQLite setup is not suitable for persistent production data there. Use Railway for this SQLite deployment, or switch to a managed database before deploying on Netlify.