#!/usr/bin/env python3
"""
Elite GBB Integrated Test Suite
================================
Master test runner that combines all existing and new tests.

This integrates:
    - Original backend_test.py (existing)
    - New api_test_suite.py (new)
    - bulk_player_creator.py (new)
    - api_test.sh shell tests (new)

Usage:
    python3 tests/run_all_tests.py
    python3 tests/run_all_tests.py --quick
    python3 tests/run_all_tests.py --full
"""

import subprocess
import sys
import json
import os
from datetime import datetime
from pathlib import Path

# Test configuration
TEST_DIR = Path(__file__).parent
REPORTS_DIR = TEST_DIR / "reports"
API_DIR = TEST_DIR / "api"

def run_command(cmd: list, description: str, timeout: int = 120) -> dict:
    """Run a command and return results"""
    print(f"\n{'='*60}")
    print(f"  {description}")
    print(f"{'='*60}")
    
    result = {
        "description": description,
        "command": " ".join(cmd),
        "success": False,
        "stdout": "",
        "stderr": "",
        "exit_code": -1
    }
    
    try:
        process = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=str(Path(__file__).parent.parent)
        )
        
        result["success"] = process.returncode == 0
        result["stdout"] = process.stdout
        result["stderr"] = process.stderr
        result["exit_code"] = process.returncode
        
        if process.stdout:
            print(process.stdout)
        if process.stderr and process.returncode != 0:
            print(f"STDERR: {process.stderr}")
            
    except subprocess.TimeoutExpired:
        result["stderr"] = f"Timeout after {timeout}s"
        print(f"ERROR: Test timed out after {timeout}s")
    except Exception as e:
        result["stderr"] = str(e)
        print(f"ERROR: {e}")
    
    status = "✓ PASS" if result["success"] else "✗ FAIL"
    print(f"\nResult: {status}")
    
    return result

def run_backend_test():
    """Run original backend_test.py"""
    return run_command(
        ["python3", "backend_test.py"],
        "Legacy Backend Test",
        timeout=60
    )

def run_api_test_suite():
    """Run new api_test_suite.py"""
    return run_command(
        ["python3", "tests/api/api_test_suite.py", "--host", "http://localhost:8790"],
        "New API Test Suite (Full CRUD)",
        timeout=120
    )

def run_bulk_creator(count=5):
    """Run bulk player creator"""
    return run_command(
        ["python3", "tests/api/bulk_player_creator.py", "--count", str(count), "--package", "free"],
        f"Bulk Player Creation ({count} players)",
        timeout=120
    )

def run_shell_health_check():
    """Run shell script health check"""
    return run_command(
        ["bash", "tests/api/api_test.sh", "health"],
        "Shell Script Health Check",
        timeout=30
    )

def run_shell_crud():
    """Run shell script CRUD tests"""
    return run_command(
        ["bash", "tests/api/api_test.sh", "crud"],
        "Shell Script CRUD Tests",
        timeout=60
    )

def generate_master_report(results: list):
    """Generate master test report"""
    report = {
        "test_run": {
            "timestamp": datetime.now().isoformat(),
            "total_tests": len(results),
            "passed": sum(1 for r in results if r["success"]),
            "failed": sum(1 for r in results if not r["success"]),
        },
        "results": results
    }
    
    # Save report
    REPORTS_DIR.mkdir(exist_ok=True)
    report_file = REPORTS_DIR / "master_test_report.json"
    
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    return report

def print_summary(report: dict):
    """Print test summary"""
    print(f"\n{'='*60}")
    print(f"  MASTER TEST SUITE SUMMARY")
    print(f"{'='*60}")
    print(f"Total Test Groups:  {report['test_run']['total_tests']}")
    print(f"Passed:             {report['test_run']['passed']}")
    print(f"Failed:             {report['test_run']['failed']}")
    
    success_rate = report['test_run']['passed'] / report['test_run']['total_tests'] * 100 if report['test_run']['total_tests'] > 0 else 0
    print(f"Success Rate:       {success_rate:.1f}%")
    
    print(f"\nDetailed Results:")
    for i, result in enumerate(report['results'], 1):
        status = "✓" if result['success'] else "✗"
        print(f"  {status} {i}. {result['description']}")
    
    print(f"\nReport saved to: {REPORTS_DIR / 'master_test_report.json'}")
    print(f"{'='*60}\n")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Elite GBB Integrated Test Suite")
    parser.add_argument("--quick", action="store_true", help="Run quick tests only")
    parser.add_argument("--full", action="store_true", help="Run full test suite including load tests")
    parser.add_argument("--shell-only", action="store_true", help="Run only shell-based tests")
    parser.add_argument("--python-only", action="store_true", help="Run only Python tests")
    
    args = parser.parse_args()
    
    print(f"\n{'='*60}")
    print(f"  ELITE GBB INTEGRATED TEST SUITE")
    print(f"{'='*60}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"API Host: http://localhost:8790")
    print(f"{'='*60}\n")
    
    results = []
    
    # Determine which tests to run
    if args.shell_only:
        results.append(run_shell_health_check())
        results.append(run_shell_crud())
    elif args.python_only:
        results.append(run_api_test_suite())
        results.append(run_bulk_creator(5))
    elif args.quick:
        results.append(run_shell_health_check())
        results.append(run_api_test_suite())
    elif args.full:
        results.append(run_backend_test())
        results.append(run_shell_health_check())
        results.append(run_shell_crud())
        results.append(run_api_test_suite())
        results.append(run_bulk_creator(20))
    else:
        # Default: Run essential tests
        results.append(run_shell_health_check())
        results.append(run_api_test_suite())
        results.append(run_bulk_creator(5))
    
    # Generate and print summary
    report = generate_master_report(results)
    print_summary(report)
    
    # Exit with appropriate code
    all_passed = all(r["success"] for r in results)
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
