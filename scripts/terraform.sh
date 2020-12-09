#!/usr/bin/env bash -eux

echo 'export TF_CLI_ARGS_plan="--parallelism=30"' >> ~/.zshrc
echo 'export TF_CLI_ARGS_fmt="-recursive"' >> ~/.zshrc
