FROM php:8.2-fpm-alpine

# System deps
RUN apk add --no-cache \
    bash \
    curl \
    git \
    unzip \
    libzip-dev \
    oniguruma-dev \
    icu-dev \
    zlib-dev \
    autoconf \
    build-base \
    openssl-dev \
    nodejs \
    npm

# PHP extensions
RUN docker-php-ext-install pdo pdo_mysql mbstring zip intl opcache

# Install composer from official image
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy app
COPY . /var/www/html

# Install PHP deps
RUN composer install --no-interaction --prefer-dist --no-progress --optimize-autoloader --no-dev || true

# Build frontend assets within PHP stage (required for wayfinder's artisan call)
RUN npm ci --no-audit --fund=false --progress=false \
    && npm run build \
    && apk del npm nodejs || true

# Ensure storage and bootstrap cache exist with proper permissions
RUN mkdir -p storage bootstrap/cache \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Add entrypoint
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm"]
