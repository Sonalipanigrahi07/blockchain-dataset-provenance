
import argparse
import json
import math
import sys
from pathlib import Path

import pandas as pd


def error_report(code, message):
    return {
        "status": "error",
        "rows": 0,
        "columns": 0,
        "columnInfo": [],
        "missingTotalPct": 0.0,
        "duplicateRows": 0,
        "duplicatePct": 0.0,
        "numericStats": {},
        "targetBalance": None,
        "warnings": [],
        "error": {"code": code, "message": message},
    }


def safe_number(value):
    """Return a rounded finite number, or None if unavailable."""
    if pd.isna(value):
        return None

    number = float(value)

    if not math.isfinite(number):
        return None

    return round(number, 4)


def analyze_csv(csv_path):
    path = Path(csv_path)

    if not path.is_file():
        return error_report(
            "FILE_NOT_FOUND",
            f"File does not exist: {csv_path}",
        ), 2

    try:
        df = pd.read_csv(
            path,
            encoding="utf-8-sig",
            on_bad_lines="error",
        )
    except pd.errors.EmptyDataError:
        return error_report(
            "EMPTY_CSV",
            "The CSV file is empty or has no readable header.",
        ), 3
    except (pd.errors.ParserError, UnicodeDecodeError):
        return error_report(
            "INVALID_CSV",
            "The file could not be parsed as a valid UTF-8 CSV.",
        ), 3
    except OSError as exc:
        return error_report("FILE_READ_ERROR", str(exc)), 2

    column_info = []
    total_missing = 0
    total_cells = df.shape[0] * df.shape[1]

    for name in df.columns:
        missing_count = int(df[name].isna().sum())

        missing_pct = (
            missing_count / len(df) * 100
            if len(df)
            else 0.0
        )

        column_info.append({
            "name": str(name),
            "dtype": str(df[name].dtype),
            "missingCount": missing_count,
            "missingPct": round(float(missing_pct), 4),
        })

        total_missing += missing_count

    duplicate_rows = int(df.duplicated().sum())

    duplicate_pct = (
        duplicate_rows / len(df) * 100
        if len(df)
        else 0.0
    )

    # Calculate statistics only for numeric columns.
    numeric_stats = {}

    for name in df.columns:
        series = df[name]

        if not pd.api.types.is_numeric_dtype(series):
            continue

        numeric_stats[str(name)] = {
            "min": safe_number(series.min()),
            "max": safe_number(series.max()),
            "mean": safe_number(series.mean()),
            "std": safe_number(series.std()),
        }

    report = {
        "status": "ok",
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "columnInfo": column_info,
        "missingTotalPct": round(
            total_missing / total_cells * 100
            if total_cells
            else 0.0,
            4,
        ),
        "duplicateRows": duplicate_rows,
        "duplicatePct": round(float(duplicate_pct), 4),
        "numericStats": numeric_stats,
        "targetBalance": None,
        "warnings": [],
        "error": None,
    }

    return report, 0


def main():
    parser = argparse.ArgumentParser(
        description="Analyze the quality of a CSV dataset."
    )

    parser.add_argument(
        "csv_path",
        help="Path to the CSV file",
    )
    parser.add_argument(
        "--target",
        help="Optional target column",
    )

    args = parser.parse_args()

    report, exit_code = analyze_csv(args.csv_path)

    if args.target is not None and report["status"] == "ok":
        # Target-balance analysis is a separate upcoming feature.
        report["warnings"].append(
            "Target balance analysis is not implemented yet."
        )

    print(json.dumps(report, allow_nan=False))
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
