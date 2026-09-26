# Database and deployment

The app uses Prisma with a local SQLite database. For development, copy `.env.example` to `.env`; Prisma stores `dev.db` under `prisma/`.

## Railway

1. Create a Railway project from this repository.
2. Add a persistent volume to the app service and mount it at `/data`.
3. Set `DATABASE_URL` to `file:/data/anchor.db` and set `AUTH_SECRET` to a unique random value.
4. Deploy with the default build and start commands. The start script applies Prisma migrations before starting Next.js.

The SQLite file persists across deploys only while the volume remains attached. Back it up independently.

## Render (free-tier testing)

Create a Node web service from the GitHub repository. Use `npm run build` as the build command and `npm start` as the start command. Set `DATABASE_URL=file:./dev.db`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, and `AUTH_URL` to the service's HTTPS URL. The free service filesystem is ephemeral, so test data can be lost after a restart or deploy.

On startup, the app applies migrations and seeds a Tony Davis test account and a separate staff account when `TONY_DAVIS_PASSWORD` and `STAFF_PASSWORD` are configured with passwords of at least 12 characters. Without them, fixture creation is skipped and the app still starts; add both values and restart to create the accounts. The email values default to `tony.davis@example.test` and `admin@example.test`; override them with `TONY_DAVIS_EMAIL` and `STAFF_EMAIL` if needed. Tony's initial checking balance is $10,000. New signups start with zero balances. Staff signs in at `/staff-login` and balance changes are recorded as transactions.

To provision the additional test customer, set `UNKNOWNSTAR_PASSWORD` to a password of at least 12 characters. The seed then creates or updates `UnknownStar User` (`star@user.com`) with a $250,000 checking balance, recorded as an initial deposit. This test account is provisioned independently of the Tony/staff fixtures.

Transfers currently resolve Anchor account numbers only. The app can show the matching account holder's name and post an internal transfer; external-bank name lookup and settlement require a banking provider integration and are not simulated.

## Netlify

Netlify's function filesystem is ephemeral, so this local SQLite setup is not suitable for persistent production data there. Use Railway for this SQLite deployment, or switch to a managed database before deploying on Netlify.