# Backend API notes — M1

Base URL: `http://localhost:4000`

## `GET /api/health`

Returns `200` and `{ "status": "ok" }`.

## `POST /api/datasets`

Accepts `multipart/form-data` with exactly one CSV file in the `file` field.  The
server saves the bytes under a random generated name in `backend/uploads/` and
returns `201` with its generated `fileName`, `sizeBytes`, and a lowercase SHA-256
digest of the saved bytes.

M1 intentionally stops after upload and hashing.  M3 will extend this same contract
endpoint to return the complete version record after quality analysis, ledger
registration, and registry persistence are available.

All errors use `{ "error": { "code", "message" } }`. This milestone handles
`NO_FILE`, `NOT_CSV`, `FILE_TOO_LARGE`, `EMPTY_FILE`, and `INTERNAL_ERROR`.
