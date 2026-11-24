# Sync data

Copy the scrutins tables (CAP, CCP, CST) of the Grist documents listed in the
`sync_documents` table into PostgreSQL, e.g. to build dashboards in Metabase.

[`sync_data.py`](sync_data.py) does one pass over the
enabled documents then stops: it is meant to run as a cron job (e.g. every 10
minutes on Scalingo).

The PostgreSQL tables are created beforehand from
[`schema.sql`](../setup-database/schema.sql) by
[`setup-database`](../setup-database/README.md): the sync only writes the
rows.

The settings (Grist server, tables, pauses, PostgreSQL tables)
are in [`config.py`](config.py).

## Context

Each Grist table is copied to its own PostgreSQL table:

| Grist table          | PostgreSQL table |
| -------------------- | ---------------- |
| `Table_scrutins_CAP` | `resultats_cap`  |
| `Table_scrutins_CCP` | `resultats_ccp`  |
| `Table_scrutins_CST` | `resultats_cst`  |

Each row has a `UUID` column (trigger formula, read-only), used to identify the
row: the Grist row `id` is not unique across documents, since users add rows
after the split.

### Columns

Each table has the sync columns, then all the Grist columns with the same names
(case-sensitive: quote them in SQL, e.g. `"Inscrits"`):

| Column       | Type        | Content                                                                    |
| ------------ | ----------- | -------------------------------------------------------------------------- |
| `department` | text        | department of the document, from `sync_documents` (`01`, `2A`, `971`…)    |
| `uuid`       | text        | `UUID` of the row                                                          |
| `grist_id`   | integer     | Grist row id (not unique across documents)                                 |
| `synced_at`  | timestamptz | last successful fetch of the row                                           |
| …            | …           | the Grist columns                                                          |

The Grist columns and their PostgreSQL types are set in
[`schema.sql`](../setup-database/schema.sql). The
sync copies the Grist columns the table has, and ignores the others. A value
that does not fit the column type (Grist error…) is stored as empty.

Grist dates (`Horodatage_modification`, listed in `DATETIME_COLUMNS` in
[`config.py`](config.py)) are stored as text, in UTC: `2024-11-19 07:06:40`.

`department` is text, not a number: it keeps the leading zero (`01`) and the
Corsican departments (`2A`, `2B`).

### Department filter

Only the rows of the department given for each document are fetched (Grist
API `filter` on `Collectivite_organisatrice__Prefecture`).

`Collectivite_organisatrice__Prefecture` holds the Grist row id of
`Referentiel_departements` (e.g. `96` for `95 – Val-d’Oise`): it is given for
each document in `sync_documents.grist_department_id`, next to its department.
`Referentiel_departements` itself is not read: the row id is visible in Grist,
in the `id` column of `Referentiel_departements`.

### Incremental sync

- the Grist document id is not stored: a document is identified by its
  department, given once per document in `sync_documents`;
- a row is identified by its UUID (`uuid`, primary key), unique across the
  documents;
- each document only reads, updates and deletes the rows of its department;
- every row fetched is written again with the new `synced_at`;
- rows deleted in Grist, or moved to another department, are deleted from the table;
- the tables of a document are synced one after the other, each one fetched
  then written in its own transaction: if a table fails (network error, access
  denied, unknown department…), its rows from the previous run are kept, with
  their old `synced_at`, and the other tables of the document are still synced;
- if the database connection is lost (restart…), the table in progress fails
  and the next one reconnects;
- if a table returns rows but none has a UUID (column missing or renamed), the
  table fails instead of deleting all its rows.

Rows without UUID, or with a UUID already used in the same document, are
skipped and logged.

The sync does not check the structure of the documents: check each document
first with [`verify-data`](../verify-data/README.md).

## Requirements

[uv](https://docs.astral.sh/uv/). The dependencies (`requests`, `psycopg`) are
declared inside the script and installed automatically by
`uv run`.

A PostgreSQL database set up with
[`setup-database`](../setup-database/README.md): the sync refuses to start
if `resultats_cap`, `resultats_ccp`, `resultats_cst`, `sync_log`,
`sync_documents` or `sync_cron` is missing.

## Documents

The documents to sync are listed in the `sync_documents` table, edited by hand
in the database (`psql`, or `scalingo --app <app> pgsql-console` on Scalingo):

| Column       | Content                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| `doc_id`     | Grist document id (primary key)                                         |
| `department` | its department (`01`, `2A`…), once per table: it identifies the rows of the document |
| `grist_department_id` | row id of the department in `Referentiel_departements` (e.g. `96` for `95`), used to filter the rows |
| `enabled`    | `true`: the document is synced; `false` by default                      |
| `cron_group` | its cron group in `sync_cron` (`--group`), `1` by default               |

The cron groups are listed in the `sync_cron` table, also edited by hand.
Group `1` is created with the tables, disabled:

| Column       | Content                                                   |
| ------------ | --------------------------------------------------------- |
| `cron_group` | the group number, given to the cron job with `--group`    |
| `enabled`    | `true`: its documents are synced; `false` by default      |

Nothing is synced until you enable it: a new document or group is disabled.

```sql
-- add documents (to group 1), then enable them and the group
INSERT INTO sync_documents (doc_id, department, grist_department_id) VALUES ('abc123', '95', 96), ('def456', '2A', 20);
UPDATE sync_documents SET enabled = true WHERE doc_id IN ('abc123', 'def456');
UPDATE sync_cron SET enabled = true WHERE cron_group = 1;
-- leave one document out, or put it back
UPDATE sync_documents SET enabled = false WHERE doc_id = 'def456';
-- create a second group, enabled, and move documents to it
INSERT INTO sync_cron (cron_group, enabled) VALUES (2, true);
UPDATE sync_documents SET cron_group = 2 WHERE department IN ('2A', '2B');
-- stop a whole cron job, or put it back
UPDATE sync_cron SET enabled = false WHERE cron_group = 2;
-- stop everything
UPDATE sync_cron SET enabled = false;
```

A document is synced if it is enabled and its group is enabled. Both are
checked before each table, so they also act on a run in progress: a document
switched off skips its other tables, a group switched off stops the run. The
rows left out stay in PostgreSQL as they were, with their old `synced_at`.

A document can only be in a group that exists in `sync_cron`.

A wrong `grist_department_id` fetches the rows of another department, or none:
check it in Grist.

### Cron groups

A run waits about 16 s per document (see `PAUSE_SECONDS` below), plus the
Grist calls: with many documents, it lasts longer than the cron interval, and
two runs would overlap. Split the documents into groups, one cron job per
group, e.g. every 10 minutes:

```sh
uv run scripts/sync_data/sync_data.py --group 1
uv run scripts/sync_data/sync_data.py --group 2
```

## Run

Environment variables:

| Variable        | Content       |
| --------------- | ------------- |
| `GRIST_API_KEY` | Grist API key |
| `DATABASE_URL`  | Database URL  |

Locally, put them in the `.env` file at the root of the repository, e.g.
`DATABASE_URL=postgresql://user@localhost:5432/dgcl_resultats`.

On Scalingo, set `DATABASE_URL=$SCALINGO_POSTGRESQL_URL` in the environment of
the app: Scalingo replaces it with the URL of the PostgreSQL add-on.

From the root of the repository:

```sh
uv run --env-file .env scripts/sync_data/sync_data.py --group 1
```

| Option          | Description                                            |
| --------------- | ------------------------------------------------------ |
| `--group`       | Cron group to sync (required): the documents of this `cron_group` |
| `--uuid-column` | Column holding the row UUID (default: `UUID`)          |

The script waits `PAUSE_SECONDS` before each document and
`TABLE_PAUSE_SECONDS` before each table of a document (in
`config.py`), to avoid overloading the Grist server. The duration of the run
and the number of failed tables are logged at the end.

## Sync log

After each table of each document, the script adds an entry to the
`sync_log` table (`SYNC_LOG_TABLE` in [`config.py`](config.py)), created by
[`setup-database`](../setup-database/README.md):

| Column       | Type        | Content                                         |
| ------------ | ----------- | ----------------------------------------------- |
| `id`         | bigint      | entry id                                        |
| `synced_at`  | timestamptz | end of the sync attempt                         |
| `department` | text        | department given for the document (`95`, `2A`…) |
| `table_name` | text        | PostgreSQL table (`resultats_cap`…)             |
| `status`     | text        | `success` or `error`                            |
| `message`    | text        | on success, the changes (`12 added, 3 updated, 0 deleted`); on error, the reason of the failure |

E.g. the failures of the last 24 hours:

```sql
SELECT * FROM sync_log
WHERE status = 'error' AND synced_at > now() - interval '1 day'
ORDER BY synced_at DESC;
```

If the entry itself cannot be written, the error is logged and the sync goes
on.

## Errors

No retry within a run: failed tables are recorded in `sync_log`, and retried
at the next run.

Exit code: `0` if every table of every document is OK, `1` if a table failed,
`2` if the configuration is wrong (API key, database URL, database
connection, missing table, `--group` missing or not in `sync_cron`). A disabled group, or
no enabled document, is not an error: the run logs it and stops with `0`.
