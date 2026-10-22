
import json
import subprocess
import sys
from pathlib import Path

import pytest


# Find the quality_engine folder and its analyzer.
QUALITY_ENGINE_DIR = Path(__file__).resolve().parents[1]
ANALYZE_SCRIPT = QUALITY_ENGINE_DIR / "analyze.py"
FIXTURES_DIR = QUALITY_ENGINE_DIR / "fixtures"


def run_analyzer(csv_path, *extra_args):
    """Run analyze.py and return the process result."""
    return subprocess.run(
        [
            sys.executable,
            str(ANALYZE_SCRIPT),
            str(csv_path),
            *extra_args,
        ],
        capture_output=True,
        text=True,
        check=False,
    )


def test_clean_csv():
    """A clean CSV should produce the expected basic quality report."""
    result = run_analyzer(FIXTURES_DIR / "clean.csv")

    assert result.returncode == 0

    report = json.loads(result.stdout)
    assert report["status"] == "ok"
    assert report["rows"] == 4
    assert report["columns"] == 3
    assert report["missingTotalPct"] == 0.0
    assert report["duplicateRows"] == 0
    assert report["error"] is None


def test_missing_file():
    """A nonexistent CSV should return the documented file error exit code."""
    missing_path = FIXTURES_DIR / "this_file_does_not_exist.csv"
    result = run_analyzer(missing_path)

    assert result.returncode == 2

    report = json.loads(result.stdout)
    assert report["status"] == "error"
    assert report["error"]["code"] == "FILE_NOT_FOUND"


def test_missing_values_and_duplicates(tmp_path):
    """Missing values and duplicate rows should be counted correctly."""
    csv_path = tmp_path / "quality-check.csv"
    csv_path.write_text(
        "ID,Score,Group\n"
        "1,80,A\n"
        "2,,B\n"
        "2,,B\n"
        "4,100,A\n",
        encoding="utf-8",
    )

    result = run_analyzer(csv_path)

    assert result.returncode == 0

    report = json.loads(result.stdout)
    assert report["rows"] == 4
    assert report["columns"] == 3
    assert report["duplicateRows"] == 1
    assert report["duplicatePct"] == 25.0
    assert report["missingTotalPct"] == pytest.approx(16.6667)
    assert report["error"] is None


def test_numeric_statistics():
    """Numeric columns should include summary statistics."""
    result = run_analyzer(FIXTURES_DIR / "clean.csv")

    assert result.returncode == 0

    report = json.loads(result.stdout)
    assert report["numericStats"]["Marks"]["min"] == 70.0
    assert report["numericStats"]["Marks"]["max"] == 100.0
    assert report["numericStats"]["Marks"]["mean"] == 85.0
    assert report["numericStats"]["Marks"]["std"] == pytest.approx(12.9099)
