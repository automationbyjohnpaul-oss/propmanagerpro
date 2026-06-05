param(
    [string]$BaseUrl = "https://propmanagerpro-production.up.railway.app"
)

$ErrorActionPreference = "Continue"
$Passed = 0
$Failed = 0
$timestamp = Get-Date -Format "yyyyMMddHHmmss"

function Test-Result($Name, $Result) {
    if ($Result) {
        Write-Host "  ✅ $Name" -ForegroundColor Green
        $script:Passed++
    } else {
        Write-Host "  ❌ $Name" -ForegroundColor Red
        $script:Failed++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " PropManager Pro — MVP Verification Suite" -ForegroundColor Cyan
Write-Host " Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host " Timestamp: $timestamp" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ==========================================
# STEP 1 — Health Check
# ==========================================
Write-Host "STEP 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/health" -TimeoutSec 10
    Test-Result "Server responds" ($health.status -eq "ok")
} catch {
    Test-Result "Server responds" $false
    Write-Host "  Server unreachable. Exiting." -ForegroundColor Red
    exit 1
}

# ==========================================
# STEP 2 — Register Users (unique each run)
# ==========================================
Write-Host "`nSTEP 2: Register Users" -ForegroundColor Yellow

$emailA = "verify-a-$timestamp@test.com"
$emailB = "verify-b-$timestamp@test.com"

$userA = @{email=$emailA;password="Test1234";name="User A"} | ConvertTo-Json
$userB = @{email=$emailB;password="Test1234";name="User B"} | ConvertTo-Json

try {
    $regA = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method Post -Body $userA -ContentType "application/json"
    Test-Result "Register User A" ($regA.user.email -eq $emailA)
} catch {
    Test-Result "Register User A" $false
}

try {
    $regB = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method Post -Body $userB -ContentType "application/json"
    Test-Result "Register User B" ($regB.user.email -eq $emailB)
} catch {
    Test-Result "Register User B" $false
}

# ==========================================
# STEP 3 — Login
# ==========================================
Write-Host "`nSTEP 3: Login" -ForegroundColor Yellow

$loginA = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $userA -ContentType "application/json"
$tokenA = $loginA.token
Test-Result "Login User A" ($tokenA -ne $null)

$loginB = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $userB -ContentType "application/json"
$tokenB = $loginB.token
Test-Result "Login User B" ($tokenB -ne $null)

$headersA = @{Authorization="Bearer $tokenA"}
$headersB = @{Authorization="Bearer $tokenB"}

# ==========================================
# STEP 4 — Create Data (User A)
# ==========================================
Write-Host "`nSTEP 4: Create Test Data" -ForegroundColor Yellow

# Property
$propertyBody = @{name="Test Property A $timestamp";address="123 Main St";city="Austin";state="TX";zip="78701";unitCount=2} | ConvertTo-Json
try {
    $propA = Invoke-RestMethod -Uri "$BaseUrl/api/properties" -Method Post -Body $propertyBody -Headers $headersA -ContentType "application/json"
    Test-Result "Create Property (201)" ($propA.name -like "Test Property A*")
} catch {
    Test-Result "Create Property (201)" $false
    $propA = $null
}

# Unit
$unitBody = @{unitNumber="101";bedrooms=2;bathrooms=1.0;squareFeet=900;rentAmount=1200;propertyId=$($propA.id)} | ConvertTo-Json
try {
    $unitA = Invoke-RestMethod -Uri "$BaseUrl/api/units" -Method Post -Body $unitBody -Headers $headersA -ContentType "application/json"
    Test-Result "Create Unit (201)" ($unitA.unitNumber -eq "101")
} catch {
    Test-Result "Create Unit (201)" $false
    $unitA = $null
}

# Tenant
$tenantBody = @{firstName="John";lastName="Doe $timestamp";email="john.doe-$timestamp@test.com"} | ConvertTo-Json
try {
    $tenantA = Invoke-RestMethod -Uri "$BaseUrl/api/tenants" -Method Post -Body $tenantBody -Headers $headersA -ContentType "application/json"
    Test-Result "Create Tenant (201)" ($tenantA.email -like "john.doe-*@test.com")
} catch {
    Test-Result "Create Tenant (201)" $false
    $tenantA = $null
}

# Lease
$startDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$endDate = (Get-Date).AddYears(1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$leaseBody = @{
    startDate=$startDate;endDate=$endDate;monthlyRent=1200;securityDeposit=1200;isActive=$true
    propertyId=$($propA.id);unitId=$($unitA.id);tenantId=$($tenantA.id)
} | ConvertTo-Json
try {
    $leaseA = Invoke-RestMethod -Uri "$BaseUrl/api/leases" -Method Post -Body $leaseBody -Headers $headersA -ContentType "application/json"
    Test-Result "Create Lease (201)" ($leaseA.isActive -eq $true)
} catch {
    Test-Result "Create Lease (201)" $false
    $leaseA = $null
}

# Payment
$paymentBody = @{amount=1200;method="bank_transfer";status="completed";leaseId=$($leaseA.id);tenantId=$($tenantA.id)} | ConvertTo-Json
try {
    $paymentA = Invoke-RestMethod -Uri "$BaseUrl/api/payments" -Method Post -Body $paymentBody -Headers $headersA -ContentType "application/json"
    Test-Result "Create Payment (201)" ($paymentA.status -eq "completed")
} catch {
    Test-Result "Create Payment (201)" $false
}

# ==========================================
# STEP 5 — Update & Delete
# ==========================================
Write-Host "`nSTEP 5: Update & Delete" -ForegroundColor Yellow

# Update Property
$updateBody = @{name="Updated Property A $timestamp";address="123 Main St";city="Austin";state="TX";zip="78701";unitCount=3} | ConvertTo-Json
try {
    $updatedProp = Invoke-RestMethod -Uri "$BaseUrl/api/properties/$($propA.id)" -Method Put -Body $updateBody -Headers $headersA -ContentType "application/json"
    Test-Result "Update Property" ($updatedProp.name -like "Updated Property A*")
} catch {
    Test-Result "Update Property" $false
}

# Delete Property
try {
    Invoke-RestMethod -Uri "$BaseUrl/api/properties/$($propA.id)" -Method Delete -Headers $headersA -ContentType "application/json" | Out-Null
    Start-Sleep -Seconds 1
    try {
        Invoke-RestMethod -Uri "$BaseUrl/api/properties/$($propA.id)" -Headers $headersA | Out-Null
        Test-Result "Delete Property (not found after)" $false
    } catch {
        Test-Result "Delete Property (not found after)" ($_.Exception.Response.StatusCode -eq 404)
    }
} catch {
    Test-Result "Delete Property" $false
}

# ==========================================
# STEP 6 — Lease Overlap Test
# ==========================================
Write-Host "`nSTEP 6: Lease Overlap Business Rule" -ForegroundColor Yellow

# Recreate property/unit/tenant for overlap test
$prop2 = Invoke-RestMethod -Uri "$BaseUrl/api/properties" -Method Post -Body (@{name="Overlap Test $timestamp";address="456 Oak Ave";city="Dallas";state="TX";zip="75201";unitCount=1} | ConvertTo-Json) -Headers $headersA -ContentType "application/json"
$unit2 = Invoke-RestMethod -Uri "$BaseUrl/api/units" -Method Post -Body (@{unitNumber="202";bedrooms=1;bathrooms=1.0;rentAmount=800;propertyId=$($prop2.id)} | ConvertTo-Json) -Headers $headersA -ContentType "application/json"
$tenant2 = Invoke-RestMethod -Uri "$BaseUrl/api/tenants" -Method Post -Body (@{firstName="Jane";lastName="Smith";email="jane.smith-$timestamp@test.com"} | ConvertTo-Json) -Headers $headersA -ContentType "application/json"

# First lease
$lease1 = Invoke-RestMethod -Uri "$BaseUrl/api/leases" -Method Post -Body (@{
    startDate=$startDate;endDate=$endDate;monthlyRent=800;securityDeposit=800;isActive=$true
    propertyId=$($prop2.id);unitId=$($unit2.id);tenantId=$($tenant2.id)
} | ConvertTo-Json) -Headers $headersA -ContentType "application/json"
Test-Result "First lease created" ($lease1.isActive -eq $true)

# Attempt overlapping lease on same unit
try {
    $tenant3 = Invoke-RestMethod -Uri "$BaseUrl/api/tenants" -Method Post -Body (@{firstName="Bob";lastName="Wilson";email="bob.wilson-$timestamp@test.com"} | ConvertTo-Json) -Headers $headersA -ContentType "application/json"
    Invoke-RestMethod -Uri "$BaseUrl/api/leases" -Method Post -Body (@{
        startDate=$startDate;endDate=$endDate;monthlyRent=800;securityDeposit=800;isActive=$true
        propertyId=$($prop2.id);unitId=$($unit2.id);tenantId=$($tenant3.id)
    } | ConvertTo-Json) -Headers $headersA -ContentType "application/json" | Out-Null
    Test-Result "Overlapping lease rejected (409)" $false
} catch {
    Test-Result "Overlapping lease rejected (409)" ($_.Exception.Response.StatusCode -eq 409)
}

# ==========================================
# STEP 7 — Multi-Tenant CRUD Isolation
# ==========================================
Write-Host "`nSTEP 7: Multi-Tenant CRUD Isolation" -ForegroundColor Yellow

$propsB = Invoke-RestMethod -Uri "$BaseUrl/api/properties" -Headers $headersB
Test-Result "User B sees only their properties" ($propsB.Count -eq 0 -or ($propsB | Where-Object { $_.name -notlike "*User B*" }).Count -eq 0)

$propsA = Invoke-RestMethod -Uri "$BaseUrl/api/properties" -Headers $headersA
Test-Result "User A sees their properties" ($propsA.Count -gt 0)

# ==========================================
# STEP 8 — Finance Analytics Isolation
# ==========================================
Write-Host "`nSTEP 8: Finance Analytics Isolation" -ForegroundColor Yellow

$dashB = Invoke-RestMethod -Uri "$BaseUrl/api/finance/dashboard" -Headers $headersB
Test-Result "User B dashboard isolated (zero income)" ($dashB.monthlyIncome -eq 0)

$dashA = Invoke-RestMethod -Uri "$BaseUrl/api/finance/dashboard" -Headers $headersA
Test-Result "User A dashboard shows their data" ($dashA -ne $null)

# ==========================================
# STEP 9 — 401 Without Token
# ==========================================
Write-Host "`nSTEP 9: Unauthenticated Access" -ForegroundColor Yellow

try {
    Invoke-RestMethod -Uri "$BaseUrl/api/properties" | Out-Null
    Test-Result "401 without token" $false
} catch {
    Test-Result "401 without token" ($_.Exception.Response.StatusCode -eq 401)
}

# ==========================================
# SUMMARY
# ==========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " MVP VERIFICATION RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Passed: $Passed" -ForegroundColor Green
Write-Host "  Failed: $Failed" -ForegroundColor Red
Write-Host "  Total:  $($Passed + $Failed)" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan

if ($Failed -gt 0) {
    Write-Host "⚠️  Some tests failed. Fix before tagging release." -ForegroundColor Red
    exit 1
} else {
    Write-Host "🎉 All tests passed! Ready for release." -ForegroundColor Green
}