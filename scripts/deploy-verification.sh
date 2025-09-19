#!/bin/bash

# GrabtoGo MVP Production Deployment Verification Script
# This script verifies that all systems are working correctly in production

set -e

echo "🚀 Starting GrabtoGo MVP Deployment Verification..."

# Configuration
API_URL="${API_URL:-https://api.grabtogo.in}"
WEB_URL="${WEB_URL:-https://grabtogo.in}"
ADMIN_URL="${ADMIN_URL:-https://admin.grabtogo.in}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

# Helper functions
function test_pass() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED++))
}

function test_fail() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED++))
}

function test_warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

function run_test() {
    local test_name="$1"
    local test_command="$2"

    echo -n "Testing $test_name... "

    if eval "$test_command" >/dev/null 2>&1; then
        test_pass "$test_name"
    else
        test_fail "$test_name"
    fi
}

function check_http_status() {
    local url="$1"
    local expected_status="${2:-200}"

    local actual_status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")

    if [ "$actual_status" = "$expected_status" ]; then
        return 0
    else
        return 1
    fi
}

function check_json_response() {
    local url="$1"
    local expected_field="$2"

    local response=$(curl -s "$url" || echo "{}")

    if echo "$response" | jq -e "$expected_field" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

echo "📋 Running comprehensive deployment verification..."
echo "=========================================="

# 1. Basic Connectivity Tests
echo -e "\n🌐 Testing Basic Connectivity..."

run_test "API Health Check" "check_http_status '$API_URL/health'"
run_test "Web App Home Page" "check_http_status '$WEB_URL'"
run_test "Admin Dashboard" "check_http_status '$ADMIN_URL'"

# 2. API Endpoint Tests
echo -e "\n🔌 Testing API Endpoints..."

run_test "API Status Endpoint" "check_json_response '$API_URL/health' '.success'"
run_test "Vendors List Endpoint" "check_json_response '$API_URL/api/vendors' '.success'"
run_test "Products List Endpoint" "check_json_response '$API_URL/api/products' '.success'"

# 3. Database Connectivity
echo -e "\n🗄️ Testing Database Connectivity..."

run_test "Database Health" "check_json_response '$API_URL/health/database' '.database.connected'"
run_test "Database Query Test" "check_json_response '$API_URL/health/database' '.database.query_time'"

# 4. Redis Connectivity
echo -e "\n🔴 Testing Redis Connectivity..."

run_test "Redis Health" "check_json_response '$API_URL/health/redis' '.redis.connected'"
run_test "Redis Performance" "check_json_response '$API_URL/health/redis' '.redis.response_time'"

# 5. External Services
echo -e "\n🌍 Testing External Services..."

# Test a simple API call that would use external services
run_test "Payment Gateway Connection" "check_json_response '$API_URL/health/external' '.payment_gateway'"
run_test "AWS S3 Connection" "check_json_response '$API_URL/health/external' '.storage'"
run_test "Email Service" "check_json_response '$API_URL/health/external' '.email'"

# 6. Security Tests
echo -e "\n🔒 Testing Security Configuration..."

run_test "HTTPS Redirect" "check_http_status 'http://grabtogo.in' '301'"
run_test "SSL Certificate" "echo | openssl s_client -servername grabtogo.in -connect grabtogo.in:443 2>/dev/null | openssl x509 -noout -dates"
run_test "Security Headers" "curl -s -I '$WEB_URL' | grep -i 'x-frame-options'"

# 7. Performance Tests
echo -e "\n⚡ Testing Performance..."

# Response time test
api_response_time=$(curl -o /dev/null -s -w "%{time_total}" "$API_URL/health")
if (( $(echo "$api_response_time < 2.0" | bc -l) )); then
    test_pass "API Response Time ($api_response_time seconds)"
else
    test_fail "API Response Time ($api_response_time seconds - should be < 2s)"
fi

web_response_time=$(curl -o /dev/null -s -w "%{time_total}" "$WEB_URL")
if (( $(echo "$web_response_time < 3.0" | bc -l) )); then
    test_pass "Web App Response Time ($web_response_time seconds)"
else
    test_fail "Web App Response Time ($web_response_time seconds - should be < 3s)"
fi

# 8. Authentication Tests
echo -e "\n🔐 Testing Authentication System..."

# Test registration endpoint (should require valid data)
run_test "Registration Endpoint" "check_http_status '$API_URL/api/auth/register' '400'"

# Test protected endpoint without auth (should return 401)
run_test "Protected Endpoint Auth" "check_http_status '$API_URL/api/auth/me' '401'"

# 9. Business Logic Tests
echo -e "\n💼 Testing Business Logic..."

# Test vendor listing with pagination
run_test "Vendor Pagination" "check_json_response '$API_URL/api/vendors?page=1&limit=10' '.pagination'"

# Test product search
run_test "Product Search" "check_json_response '$API_URL/api/products?search=test' '.products'"

# Test category filtering
run_test "Category Filtering" "check_json_response '$API_URL/api/products?category=Food' '.success'"

# 10. Monitoring and Metrics
echo -e "\n📊 Testing Monitoring and Metrics..."

run_test "Prometheus Metrics" "check_http_status '$API_URL/metrics'"
run_test "Health Metrics" "curl -s '$API_URL/metrics' | grep -q 'service_health'"

# 11. Admin Panel Tests
echo -e "\n🛠️ Testing Admin Panel..."

run_test "Admin Login Page" "check_http_status '$ADMIN_URL/auth/login'"
run_test "Admin Dashboard Access" "check_http_status '$ADMIN_URL/dashboard' '401'"

# 12. Mobile API Compatibility
echo -e "\n📱 Testing Mobile API Compatibility..."

# Test API endpoints that mobile app would use
run_test "Mobile Auth Endpoint" "check_json_response '$API_URL/api/auth/register' '.error'"
run_test "Mobile Vendor Search" "check_json_response '$API_URL/api/vendors/search?location=Mumbai' '.success'"

# 13. Load Testing (Light)
echo -e "\n🏋️ Running Light Load Test..."

echo "Running 10 concurrent requests..."
for i in {1..10}; do
    curl -s "$API_URL/health" >/dev/null &
done
wait

run_test "Load Test Completed" "check_http_status '$API_URL/health'"

# 14. Backup and Recovery
echo -e "\n💾 Testing Backup Systems..."

# Check if backup directories exist and are writable
if [ -d "/opt/backups/grabtogo" ] && [ -w "/opt/backups/grabtogo" ]; then
    test_pass "Backup Directory Accessible"
else
    test_fail "Backup Directory Not Accessible"
fi

# 15. Log Verification
echo -e "\n📝 Testing Logging Systems..."

# Check if logs are being written
if [ -f "/var/log/grabtogo/api.log" ]; then
    if [ -s "/var/log/grabtogo/api.log" ]; then
        test_pass "API Logs Being Written"
    else
        test_warn "API Log File Empty"
    fi
else
    test_fail "API Log File Not Found"
fi

# 16. Environment Configuration
echo -e "\n⚙️ Verifying Environment Configuration..."

# Check critical environment variables through health endpoint
run_test "Environment Config" "check_json_response '$API_URL/health/config' '.environment'"

# Summary
echo -e "\n📊 Deployment Verification Summary"
echo "======================================="
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
echo -e "Total Tests: $((PASSED + FAILED))"

if [ $FAILED -eq 0 ]; then
    echo -e "\n🎉 ${GREEN}All tests passed! Deployment is successful.${NC}"
    echo -e "\n🚀 GrabtoGo MVP is ready for production!"
    echo -e "\nAccess URLs:"
    echo -e "  🌐 Web App: $WEB_URL"
    echo -e "  🔧 Admin Panel: $ADMIN_URL"
    echo -e "  📡 API: $API_URL"
    exit 0
else
    echo -e "\n❌ ${RED}Some tests failed. Please review and fix issues before going live.${NC}"
    exit 1
fi