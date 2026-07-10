#!/bin/sh
set -e
node migrate.js
exec "$@"
