# Setup database

Create the PostgreSQL tables used by
[`centralize-data`](../centralize-data/README.md). The sync never creates or
changes a table: it refuses to start if one is missing.

The tables are defined in [`schema.sql`](schema.sql):

| Table                                             | Content                                     |
| ------------------------------------------------- | ------------------------------------------- |
| `resultats_cap`, `resultats_ccp`, `resultats_cst` | the rows of the Grist scrutins tables       |
| `sync_log`                                        | one entry per synced table of each document |

## schema.sql

It is the reference for the structure of the tables, edited by hand. It uses
`CREATE TABLE IF NOT EXISTS`: applying it again creates the missing tables and
never changes the existing ones.

Each resultats table has the sync columns, then the Grist columns copied by
the sync, with the same names (case-sensitive: quote them in SQL, e.g.
`"Inscrits"`):

| Column       | Type        | Content                                                      |
| ------------ | ----------- | ------------------------------------------------------------ |
| `uuid`       | text        | `UUID` of the row, primary key (unique across the documents) |
| `department` | text        | department of the document (`01`, `2A`, `971`…), indexed    |
| `grist_id`   | integer     | Grist row id (not unique across documents)                   |
| `synced_at`  | timestamptz | last successful fetch of the row                             |
| …            | …           | the Grist columns                                            |

The sync copies only the Grist columns listed here: to copy one more, add it
to the table (see below) with the PostgreSQL type matching its Grist type:

| Grist                 | PostgreSQL                              |
| --------------------- | --------------------------------------- |
| Text, Choice          | `TEXT`                                  |
| Int                   | `BIGINT`                                |
| Numeric               | `FLOAT` (double precision)              |
| Bool                  | `BOOLEAN`                               |
| Date                  | `DATE`                                  |
| DateTime              | `TIMESTAMP WITH TIME ZONE`              |
| Ref                   | `INTEGER` (referenced row id, empty if 0) |
| RefList, ChoiceList   | `JSONB` (list)                          |

A value that does not fit the column type (Grist error…) is stored as empty.

## Run

The database URL is read from `DATABASE_URL`, in the `.env` file at the root of
the repository (e.g.
`DATABASE_URL=postgresql://user@localhost:5432/dgcl_resultats`). On Scalingo,
set `DATABASE_URL=$SCALINGO_POSTGRESQL_URL` in the environment of the app.

From the root of the repository:

```sh
uv run --env-file .env scripts/setup-database/setup_database.py
```

`schema.sql` runs in one transaction: every table is created, or none.

`psql` works too: `psql "$DATABASE_URL" -f scripts/setup-database/schema.sql`.

Exit code: `0` if OK, `1` if the database refused `schema.sql`, `2` if no
database URL is set.

## Change a table

`IF NOT EXISTS` never changes an existing table. To change one, either run the
`ALTER TABLE` yourself and update `schema.sql` to match, or drop the table
(e.g. `DROP TABLE resultats_cap`) and apply `schema.sql` again: its rows are
copied again at the next sync.

## Requirements

[uv](https://docs.astral.sh/uv/). The dependency (`psycopg`) is declared
inside the script and installed automatically by `uv run`.
