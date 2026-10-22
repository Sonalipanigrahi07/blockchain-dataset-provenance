# Shared Contract v1 (FROZEN)

Change only via the coordinator (Member 5) using a CONTRACT CHANGE REQUEST.

## Ports
- Mock server and real backend both listen on port 4000. Run only one.
- Frontend dev server: http://localhost:5173

## Endpoints (all JSON; uploads are multipart/form-data, field name "file")
1. GET  /api/health -> 200 { "status": "ok" }
2. POST /api/datasets (file, optional datasetId) -> 201 record
   - datasetId omitted: create a new dataset (version 1)
   - datasetId exists: register next version, set previousVersionHash
3. POST /api/datasets/:id/verify (file, optional version; default latest) -> 200
   { "datasetId", "version", "match": true|false,
     "expectedSha256", "actualSha256", "checkedAt" }
   Verify is READ-ONLY and never changes any record.
4. GET  /api/datasets -> 200
   { "datasets": [ { "datasetId", "latestVersion", "fileName", "timestamp" } ] }
5. GET  /api/datasets/:id -> 200
   { "datasetId", "versions": [ record, ... ] }   (oldest first)

## Errors (every endpoint)
HTTP 4xx/5xx with { "error": { "code": "SNAKE_CASE_CODE", "message": "human readable" } }
Codes: NO_FILE, NOT_CSV, FILE_TOO_LARGE, EMPTY_FILE, DATASET_NOT_FOUND,
VERSION_NOT_FOUND, QUALITY_FAILED, INTERNAL_ERROR

## Record
{
  "datasetId": "dataset-001",
  "version": 1,
  "fileName": "x.csv",
  "sizeBytes": 1234,
  "sha256": "64 lowercase hex chars",
  "timestamp": "ISO-8601 UTC",
  "previousVersionHash": null | "64 hex",
  "qualityReport": null | {report},
  "ledger": { "mode": "local" | "chain", "txHash": null | "0x...", "network": null | "hardhatlocal" }
}

## Quality report (stdout of analyze.py, also embedded in the record)
{
  "status": "ok" | "error",
  "rows": int,
  "columns": int,
  "columnInfo": [ { "name", "dtype", "missingCount", "missingPct" } ],
  "missingTotalPct": number,
  "duplicateRows": int,
  "duplicatePct": number,
  "numericStats": { "colName": { "min", "max", "mean", "std" } },
  "targetBalance": null | { "column", "classes": [ { "value", "count", "proportion" } ] },
  "warnings": [ string ],
  "error": null | { "code", "message" }
}

## Python CLI
python analyze.py <file.csv> [--target <column>]
- Stdout = exactly one JSON object. Diagnostics go to stderr.
- Exit codes: 0 ok, 2 file missing/unreadable, 3 not a valid or empty CSV.

## Ledger interface (backend calls it; env LEDGER=local|chain)
- register({datasetId, version, sha256, previousVersionHash}) -> { mode, txHash, network }
- get(datasetId, version) -> record | null
- verify(datasetId, version, sha256) -> boolean

## Registry module (Member 5, used by Member 2)
saveVersion(record), getDataset(id), listDatasets(), getVersion(id, v). JSON file persistence.

## Smart contract (Member 4)
- registerVersion(string datasetId, bytes32 sha256) returns (uint256 version)
- getVersion(string, uint256)
- getLatest(string)
- getVersionCount(string)
- verify(string, uint256, bytes32) view returns (bool)
Backend converts the 64-hex digest to bytes32 by prefixing 0x.

## What the system can and cannot claim
- A matching SHA-256 means the file bytes are identical to the registered fingerprint.
  It does NOT prove the data is accurate, unbiased or free of malicious content.
- Hashing cannot say who changed a file or what changed.
- The local JSON registry is NOT tamper-proof. Only a real contract record counts
  as a blockchain record. Never label local data as "on-chain".
- Never display or claim fake hashes, fake transaction hashes or fake quality results.