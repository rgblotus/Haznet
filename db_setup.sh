#!/bin/bash
# Database migration and seed script for Haznet

set -e

cd "$(dirname "$0")/backend" || exit 1

source .venv/bin/activate

FORCE=""
if [ "$1" = "--force" ]; then
    FORCE="--force"
fi

echo "Running database migrations..."
alembic upgrade head

echo ""
echo "Seeding database..."
python -m app.seed $FORCE

echo ""
echo "Done!"
