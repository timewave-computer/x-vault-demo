#!/usr/bin/env bash

# Update any references from script/ to scripts/
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# ... existing code ... 