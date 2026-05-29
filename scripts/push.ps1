#Requires -Version 5.1
<#
.SYNOPSIS
    One-shot: stage all, commit, and push to GitHub.

.PARAMETER Message
    Optional commit message. Defaults to "chore: update YYYY-MM-DD HH:mm".

.EXAMPLE
    .\scripts\push.ps1
    .\scripts\push.ps1 "fix: tighten upload validation"
    npm run push
    npm run push -- "fix: tighten upload validation"
#>

param(
    [Parameter(Position = 0)]
    [string]$Message
)

$ErrorActionPreference = 'Stop'

# Resolve repo root regardless of how the script is invoked.
# $PSScriptRoot can be empty under some -File invocations; fall back to $MyInvocation.
$scriptDir = if ($PSScriptRoot) {
    $PSScriptRoot
} else {
    Split-Path -Parent $MyInvocation.MyCommand.Definition
}
$repoRoot = Split-Path -Parent $scriptDir
Set-Location $repoRoot

# Confirm we are inside a git repository.
git rev-parse --is-inside-work-tree *> $null
if (-not $?) {
    Write-Host "[push] not a git repo. run 'git init' first." -ForegroundColor Red
    exit 1
}

# 1) Stage everything.
git add -A
if (-not $?) { exit 1 }

# 2) Commit if there is anything to commit.
$pending = git status --porcelain
if ([string]::IsNullOrWhiteSpace($pending)) {
    Write-Host "[push] working tree clean, skipping commit" -ForegroundColor DarkGray
} else {
    if ([string]::IsNullOrWhiteSpace($Message)) {
        $Message = "chore: update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
    Write-Host "[push] committing: $Message" -ForegroundColor Cyan
    git commit -m $Message
    if (-not $?) { exit 1 }
}

# 3) Push. Auto-set upstream the first time on a new branch.
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
$hasUpstream = $true
git rev-parse --abbrev-ref --symbolic-full-name "@{u}" *> $null
if (-not $?) { $hasUpstream = $false }

Write-Host "[push] pushing $branch -> origin" -ForegroundColor Cyan
if ($hasUpstream) {
    git push
} else {
    git push -u origin $branch
}
if (-not $?) { exit 1 }

Write-Host "[push] done" -ForegroundColor Green
