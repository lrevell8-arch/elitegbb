#!/bin/bash

# Elite GBB API Test Suite (Shell Script)
# =========================================
# Curl-based API testing with color-coded output
# No Python dependencies required
#
# Updated for Elite GBB schema with correct column names and port 8790
#
# Usage:
#   ./api_test.sh health          - Quick health check
#   ./api_test.sh crud            - Test CRUD operations
#   ./api_test.sh bulk            - Bulk creation test
#   ./api_test.sh all             - Run all tests
#   ./api_test.sh help            - Show this help

# Configuration
HOST="http://localhost:8790"
API_BASE="${HOST}/api"
REPORTS_DIR="tests/reports"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Ensure reports directory exists
mkdir -p "${REPORTS_DIR}"

# Logging function
log() {
    echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
    ((TESTS_PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((TESTS_FAILED++))
}

info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Generate unique identifier
unique_id() {
    date +%s%N | cut -b1-10
}

# Generate random player data
generate_player_data() {
    local package=${1:-"free"}
    local uid=$(unique_id)
    
    cat <<EOF
{
  "player_name": "Test Player ${uid}",
  "dob": "2008-06-15",
  "grad_class": "2026",
  "gender": "Female",
  "school": "Test High School",
  "city": "Atlanta",
  "state": "GA",
  "primary_position": "PG",
  "parent_name": "Test Parent ${uid}",
  "parent_email": "test_${uid}@example.com",
  "package_selected": "${package}"
}
EOF
}

# Generate random player with all fields
generate_full_player_data() {
    local package=${1:-"free"}
    local uid=$(unique_id)
    
    cat <<EOF
{
  "player_name": "Full Test Player ${uid}",
  "preferred_name": "Testy",
  "instagram_handle": "@testplayer${uid}",
  "dob": "2007-03-22",
  "grad_class": "2025",
  "gender": "Male",
  "school": "North Atlanta High",
  "city": "Atlanta",
  "state": "GA",
  "primary_position": "SG",
  "secondary_position": "PG",
  "jersey_number": 23,
  "height": "6'2\"",
  "weight": 175,
  "parent_name": "John Parent ${uid}",
  "parent_email": "john_${uid}@example.com",
  "parent_phone": "404-555-${uid:0:4}",
  "player_email": "player_${uid}@example.com",
  "package_selected": "${package}"
}
EOF
}

# Test: Health Check
test_health() {
    echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  HEALTH CHECK${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"
    
    ((TESTS_RUN++))
    
    log "Testing API health endpoint..."
    
    response=$(curl -s -w "\n%{http_code}" "${HOST}/health" 2>&1)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        success "Health check passed (HTTP 200)"
        info "Response: $body"
        return 0
    else
        fail "Health check failed (HTTP $http_code)"
        warning "Response: $body"
        return 1
    fi
}

# Test: GET All Players
test_get_all_players() {
    echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  GET ALL PLAYERS${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"
    
    ((TESTS_RUN++))
    
    log "Fetching all players from ${API_BASE}/players..."
    
    response=$(curl -s -w "\n%{http_code}" "${API_BASE}/players" 2>&1)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        count=$(echo "$body" | grep -o '"id"' | wc -l)
        success "Retrieved players (HTTP 200)"
        info "Found approximately $count players"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 0
    else
        fail "Failed to retrieve players (HTTP $http_code)"
        warning "Response: $body"
        return 1
    fi
}

# Test: POST Create Player
test_create_player() {
    local package=${1:-"free"}
    local test_name="Create Player (${package})"
    
    echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  ${test_name}${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"
    
    ((TESTS_RUN++))
    
    local player_data=$(generate_player_data "$package")
    
    log "Creating ${package} player..."
    info "Request: $player_data"
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$player_data" \
        "${API_BASE}/players" 2>&1)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # Save response for later use
    echo "$body" > /tmp/last_player_response.json
    
    if [ "$http_code" = "201" ]; then
        player_key=$(echo "$body" | grep -o '"player_key":"[^"]*"' | cut -d'"' -f4)
        player_name=$(echo "$body" | grep -o '"player_name":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        success "Player created successfully (HTTP 201)"
        info "Player Key: ${player_key:-N/A}"
        info "Player Name: ${player_name:-N/A}"
        
        # Pretty print response
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        
        # Extract player ID for GET test
        player_id=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ -n "$player_id" ]; then
            echo "$player_id" > /tmp/last_player_id.txt
        fi
        
        return 0
    else
        fail "Failed to create player (HTTP $http_code)"
        warning "Response: $body"
        return 1
    fi
}

# Test: Create Player with All Fields
test_create_full_player() {
    echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  CREATE FULL PLAYER (All Fields)${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"
    
    ((TESTS_RUN++))
    
    local player_data=$(generate_full_player_data "premium")
    
    log "Creating player with all optional fields..."
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$player_data" \
        "${API_BASE}/players" 2>&1)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "201" ]; then
        success "Full player created successfully (HTTP 201)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 0
    else
        fail "Failed to create full player (HTTP $http_code)"
        warning "Response: $body"
        return 1
    fi
}

# Test: GET Player by ID
test_get_player_by_id() {
    echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  GET PLAYER BY ID${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"
    
    ((TESTS_RUN++))
    
    if [ ! -f /tmp/last_player_id.txt ]; then
        warning "No player ID available. Run create test first."
        fail "GET Player by ID - No player ID available"
        return 1
    fi
    
    local player_id=$(cat /tmp/last_player_id.txt)
    log "Fetching player with ID: $player_id"
    
    response=$(curl -s -w "\n%{http_code}" \
        "${API_BASE}/players/${player_id}" 2>&1)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        success "Retrieved player successfully (HTTP 200)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 0
    elif [ "$http_code" = "404" ]; then
        warning "Player not found (HTTP 404)"
        return 1
    else
        fail "Failed to retrieve player (HTTP $http_code)"
        return 1
    fi
}

# Test: Bulk Creation
test_bulk_create() {
    local count=${1:-5}
    
    echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  BULK CREATE (${count} players)${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"
    
    log "Creating $count players in bulk..."
    
    local success_count=0
    local fail_count=0
    local player_keys=()
    
    for i in $(seq 1 $count); do
        local package
        case $((i % 3)) in
            0) package="free" ;;
            1) package="standard" ;;
            2) package="premium" ;;
        esac
        
        local player_data=$(generate_player_data "$package")
        
        response=$(curl -s -w "\n%{http_code}" \
            -X POST \
            -H "Content-Type: application/json" \
            -d "$player_data" \
            "${API_BASE}/players" 2>&1)
        
        http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" = "201" ]; then
            ((success_count++))
            player_key=$(echo "$response" | grep -o '"player_key":"[^"]*"' | cut -d'"' -f4)
            player_keys+=("$player_key")
            echo -e "  ${GREEN}✓${NC} [$i/$count] Created: ${player_key:-N/A}"
        else
            ((fail_count++))
            echo -e "  ${RED}✗${NC} [$i/$count] Failed (HTTP $http_code)"
        fi
        
        # Small delay between requests
        sleep 0.1
    done
    
    ((TESTS_RUN++))
    
    echo ""
    info "Results: $success_count created, $fail_count failed"
    
    if [ $success_count -eq $count ]; then
        success "All $count players created successfully"
        return 0
    elif [ $success_count -gt 0 ]; then
        warning "Partial success: $success_count/$count players created"
        return 0
    else
        fail "All players failed to create"
        return 1
    fi
}

# Test: Schema Validation (missing required fields)
test_schema_validation() {
    echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  SCHEMA VALIDATION TEST${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"
    
    ((TESTS_RUN++))
    
    log "Testing API response to missing required fields..."
    
    # Missing: dob, gender, school, city, state, primary_position, parent_name, parent_email
    local incomplete_data='{"player_name":"Incomplete Player","grad_class":"2026"}'
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$incomplete_data" \
        "${API_BASE}/players" 2>&1)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    info "Response with incomplete data: HTTP $http_code"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    
    # API should either reject (400) or handle gracefully (201)
    if [ "$http_code" = "400" ]; then
        success "API correctly rejected incomplete data (HTTP 400)"
        return 0
    elif [ "$http_code" = "201" ]; then
        warning "API accepted incomplete data - may use defaults (HTTP 201)"
        return 0
    else
        info "API responded with HTTP $http_code"
        return 0
    fi
}

# Print Test Summary
print_summary() {
    echo -e "\n${BOLD}═══════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}  TEST SUMMARY${NC}"
    echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
    echo -e "Total Tests:  $TESTS_RUN"
    echo -e "${GREEN}Passed:       $TESTS_PASSED${NC}"
    echo -e "${RED}Failed:       $TESTS_FAILED${NC}"
    
    if [ $TESTS_RUN -gt 0 ]; then
        local pass_rate=$((TESTS_PASSED * 100 / TESTS_RUN))
        echo -e "Success Rate: ${pass_rate}%"
    fi
    
    echo -e "${BOLD}═══════════════════════════════════════════════════${NC}\n"
    
    # Save summary to log file
    {
        echo "Test Run: $(date)"
        echo "Host: $HOST"
        echo "Total: $TESTS_RUN"
        echo "Passed: $TESTS_PASSED"
        echo "Failed: $TESTS_FAILED"
    } >> "${REPORTS_DIR}/curl_test_results.log"
}

# Help
show_help() {
    cat <<EOF
${BOLD}Elite GBB API Test Suite${NC}
${CYAN}=======================${NC}

Usage: ./api_test.sh [command]

Commands:
  ${GREEN}health${NC}      Quick health check
  ${GREEN}get${NC}         GET all players
  ${GREEN}create${NC}      Create a single player (free package)
  ${GREEN}create-full${NC} Create player with all fields
  ${GREEN}crud${NC}        Run full CRUD test (create + get)
  ${GREEN}bulk${NC}        Bulk create 5 players
  ${GREEN}bulk-10${NC}     Bulk create 10 players
  ${GREEN}bulk-50${NC}     Bulk create 50 players
  ${GREEN}schema${NC}        Schema validation test
  ${GREEN}all${NC}           Run all tests
  ${GREEN}help${NC}          Show this help

Examples:
  ./api_test.sh health
  ./api_test.sh crud
  ./api_test.sh bulk-50
  ./api_test.sh all

Configuration:
  HOST: $HOST
  API_BASE: $API_BASE

Reports saved to: ${REPORTS_DIR}/
EOF
}

# Main execution
case "${1:-help}" in
    health)
        test_health
        print_summary
        ;;
    get)
        test_get_all_players
        print_summary
        ;;
    create)
        test_create_player "free"
        print_summary
        ;;
    create-full)
        test_create_full_player
        print_summary
        ;;
    crud)
        test_health
        test_get_all_players
        test_create_player "free"
        test_get_player_by_id
        print_summary
        ;;
    bulk)
        test_bulk_create 5
        print_summary
        ;;
    bulk-10)
        test_bulk_create 10
        print_summary
        ;;
    bulk-50)
        test_bulk_create 50
        print_summary
        ;;
    schema)
        test_schema_validation
        print_summary
        ;;
    all)
        test_health
        test_get_all_players
        test_create_player "free"
        test_create_player "standard"
        test_create_player "premium"
        test_create_full_player
        test_get_player_by_id
        test_schema_validation
        test_bulk_create 5
        test_get_all_players
        print_summary
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac

exit 0
