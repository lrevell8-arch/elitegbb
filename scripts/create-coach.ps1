# Create Coach Script for Windows PowerShell
# Creates a new coach account in the database
# Usage: .\create-coach.ps1 -Email "coach@university.edu" -Password "CoachPass123!" -Name "John Smith" -School "University Name"

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Password,
    
    [Parameter(Mandatory=$true)]
    [string]$Name,
    
    [Parameter(Mandatory=$true)]
    [string]$School,
    
    [string]$Title = "Head Coach",
    [string]$State = "",
    [string]$ApiBase = "https://app.elitegbb.com",
    [string]$AdminEmail = "admin@hoopwithher.com",
    [string]$AdminPassword = "AdminPass123!"
)

function Write-Success($msg) { Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Error($msg) { Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Info($msg) { Write-Host "  $msg" -ForegroundColor Gray }
function Write-Step($msg) { Write-Host "`n$msg" -ForegroundColor Cyan }

Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Elite GBB - Create Coach Account" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

# 1. Login as Admin
Write-Step "Step 1: Authenticating as admin..."
try {
    $loginBody = @{ 
        email = $AdminEmail
        password = $AdminPassword 
    } | ConvertTo-Json -Compress
    
    $loginResponse = Invoke-RestMethod -Uri "$ApiBase/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $token = $loginResponse.token
    Write-Success "Admin logged in: $($loginResponse.user.email)"
    Write-Info "Role: $($loginResponse.user.role)"
} catch {
    Write-Error "Admin login failed: $_"
    Write-Info "Check: API is running, credentials are correct"
    exit 1
}

$headers = @{ Authorization = "Bearer $token" }

# 2. Check if coach already exists
Write-Step "Step 2: Checking if coach exists..."
try {
    $coachesResponse = Invoke-RestMethod -Uri "$ApiBase/api/admin/coaches" -Headers $headers
    $existingCoach = $coachesResponse.coaches | Where-Object { $_.email -eq $Email }
    
    if ($existingCoach) {
        Write-Error "Coach already exists!"
        Write-Info "Email: $($existingCoach.email)"
        Write-Info "Name: $($existingCoach.name)"
        Write-Info "is_active: $($existingCoach.is_active)"
        Write-Info "is_verified: $($existingCoach.is_verified)"
        
        if (-not $existingCoach.is_active) {
            Write-Host "`nCoach is disabled. Run activate-coach.ps1 to enable." -ForegroundColor Yellow
        }
        exit 1
    }
    Write-Success "Email available: $Email"
} catch {
    Write-Info "Could not check existing coaches (table may be empty): $_"
}

# 3. Create the coach
Write-Step "Step 3: Creating coach account..."
try {
    $createBody = @{
        email = $Email
        password = $Password
        name = $Name
        school = $School
        title = $Title
        state = if ($State) { $State } else { $null }
    } | ConvertTo-Json -Compress
    
    $createResponse = Invoke-RestMethod -Uri "$ApiBase/api/admin/coaches" -Method POST -ContentType "application/json" -Headers $headers -Body $createBody
    
    Write-Success "Coach created successfully!"
    Write-Info "ID: $($createResponse.coach.id)"
    Write-Info "Email: $($createResponse.coach.email)"
    Write-Info "Name: $($createResponse.coach.name)"
    Write-Info "School: $($createResponse.coach.school)"
    Write-Info "Role: $($createResponse.coach.role)"
    Write-Info "is_active: $($createResponse.coach.is_active)"
    Write-Info "is_verified: $($createResponse.coach.is_verified)"
    
} catch {
    Write-Error "Failed to create coach: $_"
    Write-Info "Check: All required fields are provided"
    Write-Info "Required: email, password, name, school"
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Coach Account Created Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Login URL: $ApiBase/coach/login" -ForegroundColor White
Write-Host "Email:    $Email" -ForegroundColor White
Write-Host "Password: $Password" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
