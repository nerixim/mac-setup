#!/usr/bin/env bash
set -eux

BASEDIR="$(cd "$(dirname "$0")" && pwd)"
. "${BASEDIR}/lib.sh"

append_once ~/.zshrc 'export TF_CLI_ARGS_plan="--parallelism=30"'
append_once ~/.zshrc 'export TF_CLI_ARGS_fmt="-recursive"'
