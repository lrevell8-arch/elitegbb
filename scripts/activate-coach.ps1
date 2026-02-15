# Coach Activation Script for Windows PowerShell
# Usage: .\activate-coach.ps1 -CoachEmail "coach@university.edu"

param(
    [Parameter(Mandatory=$true)]
    [string]$CoachEmail,
    
    [string]$ApiBase = "https://app.elitegbb.com",
    [string]$AdminEmail = "admin@hoopwithher.com",
    [string]$AdminPassword = "AdminPass123!"
)

function Write-Success($msg) { Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Error($msg) { Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Info($msg) { Write-Host "  $msg" -ForegroundColor Gray }

# 1. Login as Admin
try {
    Write-Host "`nLogging in as admin ($AdminEmail)..." -ForegroundColor Cyan
    $loginBody = @{ email = $AdminEmail; password = $AdminPassword } | ConvertTo-Json -Compress
    $loginResponse = Invoke-RestMethod -Uri "$ApiBase/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $token = $loginResponse.token
    Write-Success "Admin logged in successfully"
    Write-Info "Role: $($loginResponse.user.role)"
} catch {
    Write-Error "Admin login failed: $_"
    exit 1
}

# 2. Get Coaches List to find ID
try {
    Write-Host "`nFetching coaches list..." -ForegroundColor Cyan
    $headers = @{ Authorization = "Bearer $token" }
    $coachesResponse = Invoke-RestMethod -Uri "$ApiBase/api/admin/coaches" -Headers $headers
    $coach = $coachesResponse.coaches | Where-Object { $_.email -eq $CoachEmail }
    
    if (-not $coach) {
        Write-Error "Coach not found: $CoachEmail"
        Write-Info "Available coaches:"
        $coachesResponse.coaches | ForEach-Object { Write-Info "  - $($_.email) [$($_.name)]" }
        exit 1
    }
    
    Write-Success "Found coach: $($coach.name)"
    Write-Info "ID: $($coach.id)"
    Write-Info "Current status: is_active=$($coach.is_active), is_verified=$($coach.is_verified)"
} catch {
    Write-Error "Failed to fetch coaches: $_"
    exit 1
}

# 3. Check if already active
if ($coach.is_active -and $coach.is_verified) {
    Write-Host "`nCoach is already active and verified! No action needed." -ForegroundColor Green
    exit 0
}

# 4. Activate the Coach
try {
    Write-Host "`nActivating coach..." -ForegroundColor Cyan
    $updateBody = @{ 
        id = $coach.id
        is_active = $true
        is_verified = $true
    } | ConvertTo-Json -Compress
    
    $updateResponse = Invoke-RestMethod -Uri "$ApiBase/api/admin/coaches" -Method PATCH -ContentType "application/json" -Headers $headers -Body $updateBody
    Write-Success "Coach activated successfully!"
    Write-Info "New status: is_active=$($updateResponse.coach.is_active), is_verified=$($updateResponse.coach.is_verified)"
} catch {
    Write-Error "Failed to activate coach: $_"
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Coach can now log in at:" -ForegroundColor White
Write-Host "$ApiBase/coach/login" -ForegroundColor Cyan
Write-Host "Email: $CoachEmail" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
