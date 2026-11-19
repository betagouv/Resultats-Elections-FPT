# Restore Grist attachments

Restore Grist attachments into a list of documents from a folder of `.tar`
archives.

## Context

A source document is copied into several documents. The copies keep their
`_grist_Attachments` metadata but may lack the files themselves. This script
uploads the attachments archive (exported with
`GET /api/docs/{docId}/attachments/archive?format=tar`) into each copy via
`POST /api/docs/{docId}/attachments/archive`.

Grist matches each file in the archive to an existing attachment row (by file
ident) and only fills in missing files, so the same archive can be sent to
every document and the script is safe to re-run.

The archive can be split into several smaller `.tar` files (see
[`split-tar`](../split-tar/README.md)) to stay under the Grist upload limit:
put them in one folder, and the script uploads each of them to every document.

## Requirements

[uv](https://docs.astral.sh/uv/). The dependencies are declared inside the
script and installed automatically by `uv run`.

## Run

The Grist API key is read from `GRIST_API_KEY` in the `.env` file at the root
of the repository (`GRIST_API_KEY=...`).

From the root of the repository:

```sh
uv run --env-file .env scripts/add-national-pj-to-pref/restore_attachments.py \
  --docs docs.txt \
  --folder archives/ \
  [--dry-run]
```

| Option       | Description                                        |
| ------------ | -------------------------------------------------- |
| `--docs`     | Text file with one docId per line                  |
| `--folder`   | Folder with the `.tar` archives (all are uploaded) |
| `--dry-run`  | Only check access to each doc, upload nothing      |

For each document, the script waits 15 seconds between two archive uploads
(`COOLDOWN_SECONDS` in the script), to avoid overloading the Grist server.

## Errors

No retry: failed documents are listed at the end of the run, with the archive
that failed.
