# Local Setup

## H1 Payment Recovery Local Database Requirement

During browser acceptance testing of the H1 payment recovery flow, the manually started local environment initially failed because the local database schema was behind the current backend code.

The backend expected the `payment_create_requests` table introduced by:

`20260919150000_add_payment_create_requests`

The migration existed in the repository but had not yet been applied to the local development database:

`localhost:5432/propmanagerpro`

Verification:

Run:

`npx prisma migrate status`

This reported the migration as pending.

Resolution:

Run:

`npx prisma migrate deploy`

This was executed against the local development database to synchronise the schema.

After database schema synchronisation, browser verification passed:

- interrupted payment attempt recovery;
- manual retry;
- payment creation;
- no duplicate payment creation;
- recovery cleanup;
- account isolation.

This was a local database schema synchronisation issue and not an application defect.
