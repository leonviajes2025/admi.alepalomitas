Param(
  [switch] $Push,
  [string] $RepoPath = '.'
)

function Abort($msg){ Write-Error $msg; exit 1 }

# Check for git-filter-repo availability
try {
  python -c "import git_filter_repo" 2>$null
} catch {
  Abort 'git-filter-repo python package not found. Run: python -m pip install --user git-filter-repo'
}

$mirrorDir = Join-Path -Path $env:TEMP -ChildPath "$(Split-Path -Leaf $RepoPath)-mirror.git"
Write-Host "Cloning mirror of $RepoPath to $mirrorDir"
git clone --mirror $RepoPath $mirrorDir
Set-Location $mirrorDir

Write-Host "Running git-filter-repo: removing paths 'dist' and '.angular' and applying replacements.txt"
git filter-repo --invert-paths --path dist --path .angular --replace-text "..\replacements.txt" --force

Write-Host "Filter complete. Mirror at: $mirrorDir"
if ($Push) {
  Write-Host "Pushing rewritten history to remote (force)"
  git push --mirror --force origin
}

Write-Host "Done. IMPORTANT: After a forced push, all collaborators must reclone the repository." 
