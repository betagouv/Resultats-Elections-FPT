# Split a tar archive

Split a `.tar` archive into smaller `.tar` archives, e.g. to stay under the
Grist upload limit before running
[`restore_attachments.py`](../add-national-pj-to-pref/README.md).

## Context

The Grist attachments archive can be larger than the upload size accepted by
the server. Grist restores each file of an archive independently, so the
archive can be split into several smaller ones and uploaded one after another.

Entries are copied as-is: their names and contents are not changed. This
matters for Grist, which matches each file to its attachment using the start
of the entry name (`<checksum>_<original name>`).

## Requirements

[uv](https://docs.astral.sh/uv/). No dependency other than Python.

## Run

From the root of the repository:

```sh
uv run scripts/split-tar/split_tar.py doc-pj.tar [--max 100] [--out-dir out/]
```

`doc-pj.tar` gives `doc-pj-1.tar`, `doc-pj-2.tar`, ... written next to the
original archive (or in `--out-dir`). Existing files with the same names are
overwritten.

| Option            | Description                                        |
| ----------------- | -------------------------------------------------- |
| `archive`         | The `.tar` archive to split                        |
| `--max`           | Number of files per archive (default 100)          |
| `--out-dir`       | Output folder (default: folder of the archive)     |

At the end, the script lists the archives created with their size. An archive
over 50 MB (Grist upload limit) is flagged: run it again with a lower
`--max`.
