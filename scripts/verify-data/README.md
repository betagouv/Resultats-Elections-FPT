# Verify data

Check one Grist document before syncing its data with
[`sync_data`](../sync_data/README.md). Read-only: the script never
modifies the document.

Run it by hand on each document before adding it to the sync.

## Checks

1. The document exists and the API key can read it.
2. The 3 scrutins tables (`Table_scrutins_CAP`, `Table_scrutins_CCP`,
   `Table_scrutins_CST`) have all the columns read by the sync: `UUID`,
   `Collectivite_organisatrice__Prefecture`, `Statut_saisie_des_resultats`,
   `Le_PV_du_scrutin_est_importe`, `Validation_prefecture`, `Validation_DGCL`.
3. With `--uuid` only, on all the rows of the 3 tables:
   - every row has a UUID (rows without UUID are skipped by the sync);
   - no UUID is used twice in the document (the sync keeps only the first row).

   It fetches all the rows, so it is slower.

The rows are only checked if the columns exist.

## Requirements

[uv](https://docs.astral.sh/uv/). The dependencies are declared inside the
script and installed automatically by `uv run`.

## Run

The Grist API key is read from `GRIST_API_KEY` in the `.env` file at the root
of the repository (`GRIST_API_KEY=...`).

From the root of the repository:

```sh
uv run --env-file .env scripts/verify-data/verify_data.py \
  --doc-id abc123 \
  [--uuid]
```

| Option          | Description                                                    |
| --------------- | -------------------------------------------------------------- |
| `--doc-id`      | Id of the Grist document to check                              |
| `--uuid`        | Also check the UUIDs of the rows (optional, see above)         |
| `--uuid-column` | Column holding the row UUID (default: `UUID`)                  |

It prints the number of rows per table (with `--uuid`), then
`Document abc123: OK` or the list of problems.

Exit code: `0` if the document is OK, `1` if it has a problem, `2` if the API
key is missing.

## Settings

Grist server, tables and columns are in
[`config.py`](config.py).