$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

$generatedProfiles = @(
  'docs/overview.md',
  'docs/architecture.md',
  'docs/speckit_profile.md',
  'docs/eas-sideload_profile.md',
  'docs/tooling_profile.md'
)

$registryReferences = @(
  'docs/sdd-extensions.md'
)

$allowedDocsRootMarkdown = @('docs/README.md') + $generatedProfiles + $registryReferences

function Assert-FileExists {
  param([string]$Path)

  if (-not (Test-Path $Path -PathType Leaf)) {
    throw "Missing required file: $Path"
  }
}

function Test-ProbablyBinary {
  param([byte[]]$Bytes)

  return $Bytes -contains 0
}

function Test-CrlfOnly {
  param([byte[]]$Bytes)

  for ($index = 0; $index -lt $Bytes.Length; $index++) {
    if ($Bytes[$index] -eq 0x0A) {
      if ($index -eq 0 -or $Bytes[$index - 1] -ne 0x0D) {
        return $false
      }
    }
  }

  return $true
}

function Assert-CrlfLineEndings {
  $candidateFiles = git ls-files --cached --others --exclude-standard
  $badFiles = @()

  foreach ($path in $candidateFiles) {
    if (-not (Test-Path $path -PathType Leaf)) {
      continue
    }

    $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $path))
    if ($bytes.Length -eq 0 -or (Test-ProbablyBinary -Bytes $bytes)) {
      continue
    }

    if (-not (Test-CrlfOnly -Bytes $bytes)) {
      $badFiles += $path
    }
  }

  if ($badFiles.Count -gt 0) {
    $badFiles | ForEach-Object { Write-Error "Non-CRLF line endings: $_" }
    throw "Found $($badFiles.Count) tracked text file(s) with non-CRLF line endings."
  }

  Write-Host "CRLF line endings OK: $($candidateFiles.Count) tracked/new files scanned"
}

function Assert-GeneratedProfileList {
  foreach ($profile in $generatedProfiles) {
    Assert-FileExists $profile
    $text = Get-Content $profile -Raw
    if ($text -notmatch '\*\*Generated\*\*:') {
      throw "Generated profile missing footer marker: $profile"
    }
  }

  $unexpectedRootDocs = Get-ChildItem 'docs' -File -Filter '*.md' |
    ForEach-Object { $_.FullName.Substring($repoRoot.Path.Length + 1).Replace('\', '/') } |
    Where-Object { $allowedDocsRootMarkdown -notcontains $_ }

  if ($unexpectedRootDocs.Count -gt 0) {
    $unexpectedRootDocs | ForEach-Object { Write-Error "Unexpected docs-root markdown file: $_" }
    throw 'docs/ root contains markdown outside the curated index, generated profile list, and registry-derived reference list.'
  }

  Write-Host "Generated profile list OK: $($generatedProfiles.Count) profiles"
}

function Get-CanonicalExtensionCommandCount {
  $count = 0
  foreach ($manifest in Get-ChildItem '.specify/extensions' -Recurse -File -Filter 'extension.yml') {
    foreach ($line in Get-Content $manifest.FullName) {
      if ($line -match '^\s*-\s+name:\s+["'']?speckit\.') {
        $count++
      }
    }
  }

  return $count
}

function Assert-SddExtensionsReference {
  $path = 'docs/sdd-extensions.md'
  Assert-FileExists $path

  $registry = Get-Content '.specify/extensions/.registry' -Raw | ConvertFrom-Json
  $doc = Get-Content $path -Raw
  $extensions = $registry.extensions.PSObject.Properties
  $enabled = @($extensions | Where-Object { $_.Value.enabled })
  $bundledCore = @('git', 'memory-loader', 'repoindex', 'archive', 'retrospective', 'status')
  $enabledIds = @($enabled | ForEach-Object { $_.Name })
  $communityIds = @($enabledIds | Where-Object { $bundledCore -notcontains $_ })
  $registeredCopilotEntries = 0

  foreach ($extension in $enabled) {
    if ($extension.Value.registered_commands.PSObject.Properties.Name -contains 'copilot') {
      $registeredCopilotEntries += @($extension.Value.registered_commands.copilot).Count
    }
  }

  $expected = @{
    'Enabled extensions' = $enabled.Count
    'Bundled core extensions' = $bundledCore.Count
    'Community extensions' = $communityIds.Count
    'Canonical commands in manifests' = Get-CanonicalExtensionCommandCount
    'Registered Copilot command entries' = $registeredCopilotEntries
  }

  foreach ($entry in $expected.GetEnumerator()) {
    $pattern = "\| $([regex]::Escape($entry.Key)) \| $($entry.Value) \|"
    if ($doc -notmatch $pattern) {
      throw "sdd-extensions.md registry snapshot mismatch for '$($entry.Key)': expected $($entry.Value)."
    }
  }

  foreach ($extensionId in $enabledIds) {
    $escapedId = [regex]::Escape($extensionId)
    if ($doc -notmatch "\| ``$escapedId`` \|") {
      throw "sdd-extensions.md missing enabled extension row: $extensionId"
    }
  }

  Write-Host "SDD extension reference OK: $($enabled.Count) extensions, $registeredCopilotEntries Copilot entries"
}

function Assert-JsonIndexes {
  $jsonFiles = Get-ChildItem 'docs/_index' -File -Filter '*.json'
  foreach ($file in $jsonFiles) {
    $null = Get-Content $file.FullName -Raw | ConvertFrom-Json
  }

  Write-Host "JSON indexes OK: $($jsonFiles.Count) files"
}

function Assert-MarkdownLocalLinks {
  $roots = @('README.md', '.github', '.specify/memory', 'docs')
  $markdownFiles = foreach ($root in $roots) {
    if (Test-Path $root -PathType Leaf) {
      Get-Item $root
    } elseif (Test-Path $root -PathType Container) {
      Get-ChildItem $root -Recurse -Filter '*.md'
    }
  }

  $broken = @()
  $linkPattern = '(?<!\!)\[[^\]]+\]\(([^)]+)\)'

  foreach ($file in $markdownFiles) {
    $text = Get-Content $file.FullName -Raw
    foreach ($match in [regex]::Matches($text, $linkPattern)) {
      $target = $match.Groups[1].Value.Trim()
      if ($target -match '^(https?:|mailto:|#)' -or $target -eq '') {
        continue
      }

      $pathPart = ($target -split '#')[0]
      if ($pathPart -eq '') {
        continue
      }

      $decoded = [uri]::UnescapeDataString($pathPart)
      $resolved = Join-Path $file.DirectoryName $decoded
      if (-not (Test-Path $resolved)) {
        $broken += [pscustomobject]@{
          File = $file.FullName.Substring($repoRoot.Path.Length + 1)
          Target = $target
        }
      }
    }
  }

  if ($broken.Count -gt 0) {
    $broken | Format-Table -AutoSize
    throw "Broken local Markdown links: $($broken.Count)"
  }

  Write-Host "Markdown local links OK: $($markdownFiles.Count) files"
}

function Assert-NoStaleDocReferences {
  $patterns = @(
    'docs/repo-index',
    'docs/\.index',
    'agent-first-guide\.md',
    'eas-build-guide\.md',
    'docs/tooling\.md',
    'Spec Kit Version\*\*: 0\.8\.1\.dev0',
    'Constitution\*\*: v1\.0\.1',
    'currently has no test framework',
    'No generated profile exists yet',
    'sdd-extensions\.md\s+Generated Spec Kit extension catalog profile',
    'Current generated profiles[^\n]*sdd-extensions\.md',
    'Current generated profile files[^\n]*sdd-extensions\.md',
    'sdd-extensions\.md[^\n]*/speckit\.repoindex\.module "speckit"',
    'sdd-extensions\.md[^\n]*same pass'
  )
  $regex = [regex]::new(($patterns -join '|'), [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  $roots = @('README.md', '.github', '.specify/memory', 'docs')
  $matches = @()

  foreach ($root in $roots) {
    $files = if (Test-Path $root -PathType Leaf) {
      @(Get-Item $root)
    } else {
      @(Get-ChildItem $root -Recurse -File -Include '*.md', '*.json', '*.yml', '*.yaml')
    }

    foreach ($file in $files) {
      $relativePath = $file.FullName.Substring($repoRoot.Path.Length + 1)
      $lineNumber = 0
      foreach ($line in Get-Content $file.FullName) {
        $lineNumber++
        if ($regex.IsMatch($line)) {
          $matches += "${relativePath}:${lineNumber}: $line"
        }
      }
    }
  }

  if ($matches.Count -gt 0) {
    $matches | ForEach-Object { Write-Error $_ }
    throw "Stale documentation reference scan found $($matches.Count) match(es)."
  }

  Write-Host 'Stale documentation reference scan OK'
}

Assert-CrlfLineEndings
Assert-GeneratedProfileList
Assert-SddExtensionsReference
Assert-JsonIndexes
Assert-MarkdownLocalLinks
Assert-NoStaleDocReferences

Write-Host 'Documentation system checks passed.'
