# Import partners from Excel

This script imports partners from the HubSpot export into `public.partners` and tries to resolve partner owners by owner name from the spreadsheet.

## Source file

- Default file: `/Users/victor.gutierrez/Downloads/hubspot-custom-report-full-partners-data-2026-05-14.xlsx`
- Default sheet: `Full Partners DATA`

## How owner matching works

1. Normalize owner names (lowercase, trim, remove accents, collapse spaces, remove punctuation).
2. Exact normalized match against `profiles.display_name`.
3. Fuzzy deterministic fallback (token overlap / prefix).
4. If still ambiguous, pick the deterministic first candidate (alphabetical + UUID order) and report it as a conflict.
5. If no owner is found, skip row and report it as a conflict.

## Commands

Dry-run (no DB write):

```bash
npm run import:partners:dry-run
```

Real import (writes to DB):

```bash
npm run import:partners
```

Optional flags:

- `--file=/absolute/path/to/file.xlsx`
- `--sheet=Full Partners DATA`
- `--limit=20`
- `--conflicts-out=./tmp/partners-import-conflicts.json`
- `--dry-run` or `--execute`

Example:

```bash
npm run import:partners -- --file=/tmp/partners.xlsx --sheet="Full Partners DATA" --conflicts-out=./tmp/conflicts.json
```

## Upsert behavior

The script updates or inserts using deterministic keys:

1. Preferred key: `owner_id + hubspot_company_id` (when Partner ID exists).
2. Fallback key: `owner_id + normalized partner name`.

Extra metrics from Excel are serialized to `partners.notes` as JSON so no spreadsheet fields are lost during this temporary import flow.
