#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Split a .tar archive into smaller .tar archives. See README.md."""

import argparse
import os
import sys
import tarfile

GRIST_LIMIT_MB = 50


def split_tar(archive_path, out_dir, files_per_tar):
    """Write <name>-1.tar, <name>-2.tar, ... into out_dir. Return the written paths."""
    base = os.path.splitext(os.path.basename(archive_path))[0]
    written = []
    with tarfile.open(archive_path) as src:
        members = [m for m in src.getmembers() if m.isfile()]
        for start in range(0, len(members), files_per_tar):
            out_path = os.path.join(out_dir, f"{base}-{start // files_per_tar + 1}.tar")
            # Entries are copied as-is: names and contents are left unchanged.
            with tarfile.open(out_path, "w", format=tarfile.PAX_FORMAT) as dst:
                for member in members[start:start + files_per_tar]:
                    dst.addfile(member, src.extractfile(member))
            written.append(out_path)
    return written


def parse_args(argv):
    parser = argparse.ArgumentParser(description="Split a .tar archive into smaller .tar archives.")
    parser.add_argument("archive", help="The .tar archive to split")
    parser.add_argument("--max", type=int, default=100, help="Number of files per archive (default 100)")
    parser.add_argument("--out-dir", help="Output folder (default: folder of the archive)")
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)

    if not os.path.isfile(args.archive) or not tarfile.is_tarfile(args.archive):
        print(f"Archive not found or not a valid tar file: {args.archive}", file=sys.stderr)
        return 2
    if args.max <= 0:
        print("--max must be positive", file=sys.stderr)
        return 2

    out_dir = args.out_dir or os.path.dirname(os.path.abspath(args.archive))
    os.makedirs(out_dir, exist_ok=True)

    written = split_tar(args.archive, out_dir, args.max)

    print(f"{len(written)} archive(s) created:")
    for path in written:
        size_mb = os.path.getsize(path) / 2**20
        warning = f"  ⚠️ more than {GRIST_LIMIT_MB} MB, lower --max" if size_mb > GRIST_LIMIT_MB else ""
        print(f"  {path}  {size_mb:.1f} MB{warning}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
