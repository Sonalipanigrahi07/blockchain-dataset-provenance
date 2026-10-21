# blockchain-dataset-provenance
Blockchain-based dataset provenance and integrity framework for trustworthy AI systems.
# Blockchain-Based Dataset Provenance and Integrity Framework

A web-based framework for tracking dataset versions, checking file integrity, and generating data-quality reports to support trustworthy AI systems.

## Project Overview

Researchers can upload CSV datasets, calculate SHA-256 fingerprints, inspect data-quality reports, register dataset versions, and verify files against previously registered versions.

The framework stores dataset files off-chain and uses a blockchain record to support verifiable provenance and version history.

## Core Features

- CSV upload and validation
- SHA-256 file fingerprinting
- Data-quality analysis using Python and Pandas
- Dataset version registration
- File verification with matching and mismatching cases
- Dataset version history
- Local development ledger and smart-contract integration

## Technology Stack

- Frontend: React
- Backend: Node.js and Express
- Data quality: Python and Pandas
- Smart contracts: Solidity
- Blockchain development and testing: Hardhat

## Repository Structure

- `frontend/` — Web interface
- `backend/` — API, file hashing, and integration logic
- `quality_engine/` — CSV data-quality analysis
- `blockchain/` — Blockchain integration and development configuration
- `contracts/` — Smart contracts
- `mock-server/` — Temporary development API
- `fixtures/` — Test CSV files
- `docs/` — Architecture, API contract, and project documentation

## Integrity and Trust Limitations

A matching SHA-256 fingerprint establishes that the compared file bytes match the registered fingerprint. It does not establish that the dataset is accurate, unbiased, or free of malicious content.

Dataset files are stored off-chain. Local JSON records are not tamper-proof and must not be represented as blockchain records.

## Development Status

Initial development. Features and integration are being implemented incrementally.

## Team

Five-student academic project. Team members and module ownership will be documented as implementation progresses.
