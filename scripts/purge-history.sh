#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
Usage: $0 [--push] [path-to-repo]

Creates a mirror of the repo, runs git-filter-repo to remove `dist/` and `.angular/`
and applies replacements from `replacements.txt`.

By default the script DOES NOT push to remote. Use --push to push the rewritten history
to the origin configured in the mirrored repo (danger: this is force push).
EOF
  exit 1
}

PUSH=false
if [ "${1:-}" = "--push" ]; then
  PUSH=true
  shift
fi

REPO_PATH="${1:-.}"

# Ensure git-filter-repo is installed
if ! python -c "import git_filter_repo" &> /dev/null; then
  echo "git-filter-repo python package not found. Install with: python -m pip install --user git-filter-repo" >&2
  exit 1
fi

mkdir -p /tmp/purge-repos
MIRROR_DIR="/tmp/purge-repos/$(basename "$REPO_PATH")-mirror.git"

echo "Cloning mirror of $REPO_PATH to $MIRROR_DIR"
git clone --mirror "$REPO_PATH" "$MIRROR_DIR"
cd "$MIRROR_DIR"

echo "Running git-filter-repo: removing paths 'dist' and '.angular' and applying replacements.txt"
git filter-repo --invert-paths --path dist --path .angular --replace-text "../replacements.txt" --force

echo "Filter complete. The mirror repo is at: $MIRROR_DIR"
echo "Inspect refs and objects before pushing. To push, run inside $MIRROR_DIR: git push --mirror --force origin"

if [ "$PUSH" = true ]; then
  echo "Pushing rewritten history to remote (force push)"
  git push --mirror --force origin
fi

echo "Done. IMPORTANT: After a forced push, all collaborators must reclone the repository." 
