#!/bin/sh
set -e

echo "Running database migrations..."
pnpm --filter @workspace/db run push --force

echo "Starting API server..."
exec "$@"
