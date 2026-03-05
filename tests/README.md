# Elite GBB API Test Suite

Complete testing suite for the Elite GBB Players API.

## 📁 Test Structure

```
tests/
├── api/
│   ├── api_test_suite.py        # Full Python test suite (CRUD, validation)
│   ├── bulk_player_creator.py   # Bulk player creation tool
│   └── api_test.sh              # Shell-based curl tests
├── data/
│   └── sample_players.csv       # Sample data for CSV import
├── reports/                      # Generated test reports
│   ├── test_results.json
│   ├── created_players.json
│   └── master_test_report.json
└── run_all_tests.py             # Master test runner
```

## 🚀 Quick Start

### 1. Health Check (Fastest)
```bash
cd /home/user/webapp
./tests/api/api_test.sh health
```

### 2. Full API Test Suite
```bash
cd /home/user/webapp
python3 tests/api/api_test_suite.py
```

### 3. Integrated Test Suite (Recommended)
```bash
cd /home/user/webapp
python3 tests/run_all_tests.py
```

## 📊 Test Coverage

| Test | Description | Time |
|------|-------------|------|
| Health Check | API availability | 1-2s |
| GET All Players | List all players | 1-3s |
| Create Player | POST new player | 1-3s |
| Schema Validation | Required field testing | 1-2s |
| Bulk Create | 5 players | 5-10s |
| Full Suite | All CRUD + bulk | 30-60s |

## 🛠️ Usage Guide

### Shell Script Tests

```bash
# Quick health check
./tests/api/api_test.sh health

# Create single player
./tests/api/api_test.sh create

# Full CRUD test
./tests/api/api_test.sh crud

# Bulk creation (5 players)
./tests/api/api_test.sh bulk

# Bulk creation (50 players)
./tests/api/api_test.sh bulk-50

# Run everything
./tests/api/api_test.sh all
```

### Python API Test Suite

```bash
# Default tests
python3 tests/api/api_test_suite.py

# With verbose output
python3 tests/api/api_test_suite.py --verbose

# Custom host
python3 tests/api/api_test_suite.py --host http://localhost:8790
```

### Bulk Player Creator

```bash
# Create 10 random players
python3 tests/api/bulk_player_creator.py --count 10

# Create 100 standard package players
python3 tests/api/bulk_player_creator.py --count 100 --package standard

# Import from CSV
python3 tests/api/bulk_player_creator.py --csv tests/data/sample_players.csv

# Custom output file
python3 tests/api/bulk_player_creator.py --count 50 --output my_players.json
```

### Integrated Test Runner

```bash
# Quick tests only
python3 tests/run_all_tests.py --quick

# Full test suite with load tests
python3 tests/run_all_tests.py --full

# Shell tests only
python3 tests/run_all_tests.py --shell-only

# Python tests only
python3 tests/run_all_tests.py --python-only
```

## 🔧 Configuration

All tests default to `http://localhost:8790`. Override with:

```bash
# Shell script
HOST=http://localhost:8080 ./tests/api/api_test.sh health

# Python scripts
python3 tests/api/api_test_suite.py --host http://localhost:8080
```

## 📈 Schema Compliance

Tests use Elite GBB schema with correct column names:

**Required Fields (NOT NULL):**
- `player_name`, `dob`, `grad_class`, `gender`
- `school`, `city`, `state`, `primary_position`
- `parent_name`, `parent_email`

**Optional Fields:**
- `preferred_name`, `instagram_handle`, `secondary_position`
- `jersey_number`, `height`, `weight`
- `parent_phone`, `player_email`

## 📤 CSV Import Format

CSV file must have these headers:
```csv
player_name,preferred_name,instagram_handle,dob,grad_class,gender,school,city,state,primary_position,secondary_position,jersey_number,height,weight,parent_name,parent_email,parent_phone,player_email
```

See `tests/data/sample_players.csv` for examples.

## 📝 Output Files

After running tests, these files are created in `tests/reports/`:

| File | Description |
|------|-------------|
| `test_results.json` | Full test results from api_test_suite.py |
| `created_players.json` | List of players created during tests |
| `master_test_report.json` | Summary from integrated test runner |
| `curl_test_results.log` | Log from shell script tests |

## ✅ Success Criteria

- **Health Check**: HTTP 200 response
- **Player Creation**: HTTP 201 with `success: true`
- **Schema Tests**: Proper validation (400 for invalid data)
- **Bulk Tests**: >90% success rate for 5+ players

## 🐛 Troubleshooting

**API not responding:**
```bash
# Check if server is running
curl http://localhost:8790/health

# Start the dev server
cd /home/user/webapp && npx wrangler pages dev --port=8790
```

**Port conflicts:**
```bash
# Find and kill process on port
lsof -ti:8790 | xargs kill -9
```

**Permission denied on shell script:**
```bash
chmod +x tests/api/api_test.sh
```

## 📅 Last Updated

March 5, 2025 - Updated for Elite GBB schema v2 with correct column names.
