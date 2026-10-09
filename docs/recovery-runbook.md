# PostgreSQL backup and recovery

Scope: the operational PostgreSQL database, including authentication, membership,
customers, stock, invoices, payments, counters, ledger and Drizzle migration
history. Browser demonstration snapshots are a separate, non-production format.

## Preparation

Use PostgreSQL 16 client tools (`pg_dump`, `pg_restore`) matching the server major
version, Node 24 or the supported repository runtime, and installed locked Node
dependencies. Keep DATABASE_URL in a private environment file, never in a command
argument. For remote servers use `sslmode=verify-full` and the correct CA via the
connection configuration. Do not override connection routing with ambient libpq
service or host-address settings.

Generate a random 32-byte hex BACKUP_KEY_FILE outside the repository, chmod 600,
and store a recoverable copy separately from the archives (prefer an approved
secret manager). Losing the key loses the backups. Use a dedicated protected
BACKUP_DIRECTORY and a least-privileged backup identity able to read every
application table and the migration schema. Grant no HTTP/API access to it.

`node --env-file=/private/backup.env scripts/backup-job.js` writes a unique AES-256-GCM
archive and an authenticated manifest, owner-readable only. It exports a PostgreSQL
repeatable-read snapshot, uses that same snapshot for pg_dump and a digest of all
persistent application/migration rows, and never puts record data in the manifest.
No plaintext SQL archive is stored. The manifest authenticates the archive hash,
IV, GCM tag and data digest. Both files and the separate key are needed to recover.
The source is read-only. Existing archives are never overwritten.

Install/adapt `ops/jewelry-backup.service` and `.timer` to the actual host paths,
service account and writable directory. They are templates, not an installed
production schedule. Prevent schema deployment while a backup is running.
Transfer both encrypted files to separately administered, versioned/immutable
storage. Confirm transfer before applying retention. Keep hourly archives for at
least 48 hours and daily copies for 30 days only if those values are approved for
your actual business RPO; this code does not automatically delete archives.

## Alerts and recovery objectives

Suggested initial objectives, pending owner approval and production measurement:
RPO <= 1 hour with verified off-host upload; RTO <= 4 hours. Alert on nonzero backup
exit, last-success.json age > 2 hours, failed off-host upload, missing key access,
low backup volume space, API readiness failure and elevated HTTP 5xx. Send the
JSON API request/error logs to the deployed monitor; verify alert delivery using
synthetic failures. These objectives/alerts are not proven by a local drill.
Database authentication throttle rows older than one day may be purged by a
scheduled maintenance operation (`DELETE FROM auth_rate_limit WHERE window_start
< NOW() - INTERVAL '1 day'`). Do not purge memberships or financial history.

## Restore drill / incident

1. Stop inbound writes and preserve the current damaged database for investigation.
   Select the archive/manifest and matching key; verify off-host copy availability.
2. Provision a **new empty database** with restricted network access and compatible
   PostgreSQL/extensions. Do not point the app at it yet. Set RESTORE_DATABASE_URL,
   RESTORE_CONFIRM_DATABASE to its exact database name, and BACKUP_KEY_FILE in a
   private environment file. The restore command refuses nonempty targets.
3. Run `node --env-file=/private/restore.env scripts/recovery.js restore /secure/archive.dump.enc`.
   It authenticates the manifest/checksum, restores with pg_restore's single
   transaction, compares the persistent-row digest, and revokes restored sessions
   and reset tokens. Do not serve a target when the command fails. Recreate an
   empty isolated target before retrying a failed post-restore verification.
4. Run application migrations with the intended deployment version, not an
   arbitrary latest version. Confirm `/api/health` is 200, sign in afresh, check
   tenant denials, compare stock quantities, invoice/payment counts, outstanding
   balances and trial balance with the selected backup/business control totals.
   Record archive timestamp, elapsed recovery time, checks and any accepted loss.
5. Point a restricted staging instance at the restored database. Have the business
   owner/accountant reconcile transactions after the backup. Only then approve
   production cutover and reopen writes. Never merge snapshots by guessing ownership.
6. Test monthly and after schema changes. Preserve results off-host. Roll back the
   application only when that version supports the restored/migrated schema; this
   repository does not implement destructive down-migrations.

## Local verification

`npm run test:all` uses only explicitly configured loopback databases with `_test`
suffixes, plus a separate RESTORE_DATABASE_URL. It tests a fresh install, populated
upgrade, session/tenant/role denials, sale/receipt concurrency, injected posting
failure and encrypted restore. The recovery test rejects wrong keys, tampering,
archive overwrite and nonempty targets; verifies all persistent-row digests,
balanced ledger totals and fresh authentication. Never run these destructive test
preparation scripts against staging or production. The local result is not proof
of deployed schedules, off-host retention, TLS, production RPO or production RTO.
