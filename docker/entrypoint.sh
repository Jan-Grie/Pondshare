#!/bin/sh
set -e

cd /var/www/html || exit 1

# Ensure .env exists (copy example if available)
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
  else
    touch .env
  fi
fi

# If APP_KEY not provided via env, generate it (and write to .env if missing)
if [ -z "$APP_KEY" ]; then
  if ! grep -q '^APP_KEY=' .env; then
    php artisan key:generate --no-interaction
  fi
else
  if grep -q '^APP_KEY=' .env; then
    sed -i "s/^APP_KEY=.*/APP_KEY=$APP_KEY/" .env
  else
    echo "APP_KEY=$APP_KEY" >> .env
  fi
fi

# Optionally run migrations on start (set RUN_MIGRATIONS=true)
if [ "$RUN_MIGRATIONS" = "true" ]; then
  php artisan migrate --force
fi

# Optionally run db:seed on start (set RUN_SEED=true). You can set DB_SEED_CLASS to run a specific seeder class.
if [ "$RUN_SEED" = "true" ]; then
  if [ -n "$DB_SEED_CLASS" ]; then
    php artisan db:seed --force --class="$DB_SEED_CLASS"
  else
    php artisan db:seed --force
  fi
fi

# Run any passed command (php-fpm by default)
exec "$@"
