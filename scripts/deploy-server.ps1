param(
  [string]$ServerHost = '38.246.245.11',
  [string]$ServerUser = 'root',
  [string]$Password = $env:MY_BLOG_DEPLOY_PASSWORD,
  [string]$HostKey = 'ssh-ed25519 255 SHA256:VpE+30GTnYDNo6wp1mvxnOeavwgE+d6VHpgujydlDJA',
  [string]$RemoteRoot = '/srv/my-blog',
  [string]$ServiceName = 'my-blog.service',
  [int]$SwapSizeGb = 2
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($Password)) {
  throw "Set MY_BLOG_DEPLOY_PASSWORD first, or pass -Password when running this script."
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$toolsDir = Join-Path $projectRoot 'tools'
$plink = Join-Path $toolsDir 'plink.exe'
$pscp = Join-Path $toolsDir 'pscp.exe'

if (!(Test-Path -LiteralPath $plink) -or !(Test-Path -LiteralPath $pscp)) {
  throw "Missing tools/plink.exe or tools/pscp.exe. Download PuTTY command-line tools before running this script."
}

function Invoke-External {
  param(
    [string]$FilePath,
    [string[]]$Arguments,
    [string]$FailureMessage
  )

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$FailureMessage (exit code $LASTEXITCODE)"
  }
}

$release = Get-Date -Format 'yyyyMMddHHmmss'
$archiveName = "my-blog-$release.tar.gz"
$archivePath = Join-Path $projectRoot $archiveName
$remoteArchive = "/tmp/$archiveName"
$releaseDir = "$RemoteRoot/releases/$release"
$remoteScriptName = "my-blog-deploy-$release.sh"
$remoteScriptPath = "/tmp/$remoteScriptName"
$localRemoteScriptPath = Join-Path $projectRoot $remoteScriptName
$stagingDir = Join-Path $projectRoot '.deploy-staging'

if (Test-Path -LiteralPath $stagingDir) {
  Remove-Item -LiteralPath $stagingDir -Recurse -Force
}
New-Item -ItemType Directory -Path $stagingDir | Out-Null

$includeNames = @(
  'app',
  'components',
  'lib',
  'prisma',
  'public',
  'scripts',
  'src',
  '.gitignore',
  '.env.example',
  'eslint.config.js',
  'index.html',
  'jsconfig.json',
  'next.config.mjs',
  'package-lock.json',
  'package.json',
  'postcss.config.mjs',
  'proxy.js',
  'README.md',
  'vite.config.js'
)

try {
  foreach ($name in $includeNames) {
    $source = Join-Path $projectRoot $name
    if (!(Test-Path -LiteralPath $source)) {
      continue
    }

    $destination = Join-Path $stagingDir $name
    if ((Get-Item -LiteralPath $source).PSIsContainer) {
      Copy-Item -LiteralPath $source -Destination $destination -Recurse -Force
    } else {
      $parent = Split-Path -Parent $destination
      if ($parent -and !(Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent | Out-Null
      }
      Copy-Item -LiteralPath $source -Destination $destination -Force
    }
  }

  $stagedPrisma = Join-Path $stagingDir 'prisma'
  if (Test-Path -LiteralPath $stagedPrisma) {
    Get-ChildItem -LiteralPath $stagedPrisma -Filter '*.db*' -File -ErrorAction SilentlyContinue | Remove-Item -Force
  }

  if (Test-Path -LiteralPath $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force
  }

  tar -czf $archivePath -C $stagingDir .
  if ($LASTEXITCODE -ne 0) {
    throw "Archive creation failed (exit code $LASTEXITCODE)"
  }

  $remoteScriptTemplate = @'
#!/usr/bin/env bash
set -euo pipefail

REMOTE_ROOT='__REMOTE_ROOT__'
RELEASE='__RELEASE_DIR__'
REMOTE_ARCHIVE='__REMOTE_ARCHIVE__'
SERVICE='__SERVICE_NAME__'
SWAP_SIZE_GB='__SWAP_SIZE_GB__'
SHARED_ENV="$REMOTE_ROOT/shared/.env.local"
SWAPFILE=/tmp/my-blog-build.swap
SWAP_ENABLED=0

cleanup() {
  if [ "$SWAP_ENABLED" = "1" ]; then
    swapoff "$SWAPFILE" 2>/dev/null || true
    rm -f "$SWAPFILE"
  fi
}
trap cleanup EXIT

enable_temp_swap() {
  if swapon --show=NAME --noheadings | grep -q .; then
    return
  fi

  rm -f "$SWAPFILE"
  if command -v fallocate >/dev/null 2>&1; then
    fallocate -l "${SWAP_SIZE_GB}G" "$SWAPFILE" || dd if=/dev/zero of="$SWAPFILE" bs=1M count="$((SWAP_SIZE_GB * 1024))" status=none
  else
    dd if=/dev/zero of="$SWAPFILE" bs=1M count="$((SWAP_SIZE_GB * 1024))" status=none
  fi
  chmod 600 "$SWAPFILE"
  mkswap "$SWAPFILE" >/dev/null
  swapon "$SWAPFILE"
  SWAP_ENABLED=1
}

if [ ! -f "$SHARED_ENV" ]; then
  echo "Missing $SHARED_ENV" >&2
  exit 1
fi

mkdir -p "$REMOTE_ROOT/releases"
rm -rf "$RELEASE"
mkdir -p "$RELEASE"
tar -xzf "$REMOTE_ARCHIVE" -C "$RELEASE"
ln -sfn "$SHARED_ENV" "$RELEASE/.env.local"
rm -f "$RELEASE/prisma/"*.db "$RELEASE/prisma/"*.db-* 2>/dev/null || true

CURRENT=$(readlink -f "$REMOTE_ROOT/current" 2>/dev/null || true)
NEEDS_NPM_CI=1
if [ -n "$CURRENT" ] && [ -d "$CURRENT/node_modules" ] && [ -f "$CURRENT/package-lock.json" ] && [ -f "$RELEASE/package-lock.json" ] && cmp -s "$CURRENT/package-lock.json" "$RELEASE/package-lock.json"; then
  cp -a "$CURRENT/node_modules" "$RELEASE/node_modules"
  NEEDS_NPM_CI=0
fi

enable_temp_swap
cd "$RELEASE"

if [ "$NEEDS_NPM_CI" = "1" ]; then
  npm ci
fi

set -a
. "$SHARED_ENV"
set +a

npx prisma generate --schema ./prisma/schema.prisma
npx prisma migrate deploy --schema ./prisma/schema.prisma
npm run build

chown -R blog:blog "$RELEASE"
ln -sfnT "$RELEASE" "$REMOTE_ROOT/current"
systemctl restart "$SERVICE"
systemctl is-active "$SERVICE"
rm -f "$REMOTE_ARCHIVE"
readlink -f "$REMOTE_ROOT/current"
'@

  $remoteScript = $remoteScriptTemplate.Replace('__REMOTE_ROOT__', $RemoteRoot).Replace('__RELEASE_DIR__', $releaseDir).Replace('__REMOTE_ARCHIVE__', $remoteArchive).Replace('__SERVICE_NAME__', $ServiceName).Replace('__SWAP_SIZE_GB__', [string]$SwapSizeGb)
  Set-Content -LiteralPath $localRemoteScriptPath -Value $remoteScript -NoNewline -Encoding ASCII

  Invoke-External $pscp @('-batch', '-pw', $Password, '-hostkey', $HostKey, $archivePath, "${ServerUser}@${ServerHost}:$remoteArchive") 'Upload failed'
  Invoke-External $pscp @('-batch', '-pw', $Password, '-hostkey', $HostKey, $localRemoteScriptPath, "${ServerUser}@${ServerHost}:$remoteScriptPath") 'Remote script upload failed'

  $remoteCommand = "chmod +x $remoteScriptPath; $remoteScriptPath; status=" + '$?' + "; rm -f $remoteScriptPath; exit " + '$status'
  Invoke-External $plink @('-ssh', '-batch', '-pw', $Password, '-hostkey', $HostKey, "${ServerUser}@${ServerHost}", $remoteCommand) 'Remote deploy failed'
}
finally {
  if (Test-Path -LiteralPath $stagingDir) {
    Remove-Item -LiteralPath $stagingDir -Recurse -Force
  }

  if (Test-Path -LiteralPath $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force
  }

  if (Test-Path -LiteralPath $localRemoteScriptPath) {
    Remove-Item -LiteralPath $localRemoteScriptPath -Force
  }
}
