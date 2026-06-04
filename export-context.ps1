# export-context.ps1
# Ejecutar desde la raíz del proyecto Next.js

$ErrorActionPreference = "Stop"

$OutputDir = "_handoff"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$OutputFile = Join-Path $OutputDir "ats-openrouter-context-$Timestamp.md"

$IgnoredDirs = @(
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
  ".turbo",
  ".vercel",
  "_handoff"
)

$IgnoredFiles = @(
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock"
)

$AllowedExtensions = @(
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".prisma",
  ".sql",
  ".md",
  ".txt",
  ".css"
)

function Test-IsIgnoredPath {
  param ([string]$Path)

  foreach ($dir in $IgnoredDirs) {
    if ($Path -match "(^|[\\/])$([regex]::Escape($dir))([\\/]|$)") {
      return $true
    }
  }

  foreach ($file in $IgnoredFiles) {
    if ((Split-Path $Path -Leaf) -eq $file) {
      return $true
    }
  }

  return $false
}

function Get-RelativePath {
  param ([string]$FullPath)

  $root = (Get-Location).Path
  return $FullPath.Replace($root, "").TrimStart("\", "/")
}

function Add-Line {
  param (
    [System.Text.StringBuilder]$Builder,
    [string]$Text = ""
  )

  [void]$Builder.AppendLine($Text)
}

if (!(Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$builder = New-Object System.Text.StringBuilder

Add-Line $builder "# Contexto proyecto ATS - Integración OpenRouter"
Add-Line $builder ""
Add-Line $builder "Generado el: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-Line $builder ""
Add-Line $builder "> Nota: este archivo excluye .env, node_modules, .next, .git, lockfiles y archivos grandes."
Add-Line $builder ""

$nodeVersion = try { node -v } catch { "No disponible" }
$pnpmVersion = try { pnpm -v } catch { "No disponible" }

Add-Line $builder "## Versiones"
Add-Line $builder ""
Add-Line $builder "Node: $nodeVersion"
Add-Line $builder "pnpm: $pnpmVersion"
Add-Line $builder ""

$FilesToExport = Get-ChildItem -Recurse -File |
  Where-Object {
    -not (Test-IsIgnoredPath $_.FullName) -and
    ($AllowedExtensions -contains $_.Extension)
  } |
  Sort-Object FullName

Add-Line $builder "## Árbol de archivos relevante"
Add-Line $builder ""
Add-Line $builder '```txt'

foreach ($file in $FilesToExport) {
  Add-Line $builder (Get-RelativePath $file.FullName)
}

Add-Line $builder '```'
Add-Line $builder ""

$SearchTerms = @(
  "AI_PROVIDER",
  "GeminiProvider",
  "MockProvider",
  "evaluateCandidate",
  "aiScore",
  "aiSummary",
  "aiEvaluation",
  "OPENROUTER",
  "GEMINI",
  "CandidateStatus",
  "cvText",
  "usageQuota",
  "usageLogger"
)

Add-Line $builder "## Coincidencias relevantes"
Add-Line $builder ""
Add-Line $builder '```txt'

foreach ($term in $SearchTerms) {
  Add-Line $builder ""
  Add-Line $builder "### $term"

  foreach ($file in $FilesToExport) {
    try {
      $matches = Select-String -LiteralPath $file.FullName -Pattern $term -SimpleMatch -ErrorAction SilentlyContinue

      foreach ($match in $matches) {
        $relative = Get-RelativePath $match.Path
        Add-Line $builder ("{0}:{1}: {2}" -f $relative, $match.LineNumber, $match.Line.Trim())
      }
    } catch {
      $relative = Get-RelativePath $file.FullName
      Add-Line $builder ("[ERROR leyendo coincidencias] {0}" -f $relative)
    }
  }
}

Add-Line $builder '```'
Add-Line $builder ""

Add-Line $builder "## Contenido de archivos"
Add-Line $builder ""

foreach ($file in $FilesToExport) {
  $relative = Get-RelativePath $file.FullName

  if ($file.Length -gt 300KB) {
    Add-Line $builder "### $relative"
    Add-Line $builder ""
    Add-Line $builder "> Archivo omitido por tamaño mayor a 300KB."
    Add-Line $builder ""
    continue
  }

  $extension = $file.Extension.TrimStart(".")
  if ($extension -eq "md") { $extension = "markdown" }
  if ($extension -eq "") { $extension = "txt" }

  Add-Line $builder "### $relative"
  Add-Line $builder ""
  Add-Line $builder "````$extension"

  try {
    $content = Get-Content -LiteralPath $file.FullName -Raw
    Add-Line $builder $content
  } catch {
    Add-Line $builder "[ERROR] No se pudo leer el archivo."
  }

  Add-Line $builder "````"
  Add-Line $builder ""
}

$finalContent = $builder.ToString()

[System.IO.File]::WriteAllText(
  (Join-Path (Get-Location).Path $OutputFile),
  $finalContent,
  [System.Text.Encoding]::UTF8
)

Write-Host ""
Write-Host "Contexto generado correctamente:"
Write-Host $OutputFile
Write-Host ""
Write-Host "Ahora subeme este archivo:"
Write-Host $OutputFile