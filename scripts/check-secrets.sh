#!/bin/sh
set -eu
if grep -RIE --exclude-dir=node_modules --exclude='pnpm-lock.yaml' '(BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|ghp_[A-Za-z0-9]{30,}|sk_live_[A-Za-z0-9]+)' .; then echo 'Potential secret found'; exit 1; fi
echo 'No known secret patterns found.'
