# ============================================================
# Backend Symfony — image de production (Render, Docker)
# Build : docker build -t avis-api .
# Run   : docker run -p 10000:10000 --env-file .env avis-api
# ============================================================

FROM php:8.2-apache

# ---------- Dépendances système & extensions PHP ----------
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
        unzip \
    && docker-php-ext-install \
        pdo_mysql \
        pdo_pgsql \
        opcache \
    && rm -rf /var/lib/apt/lists/* \
    && a2enmod headers rewrite

# ---------- Composer ----------
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ---------- Configuration Apache / PHP ----------
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public \
    PHP_UPLOAD_MAX_FILESIZE=10M \
    PHP_POST_MAX_SIZE=12M \
    PHP_MEMORY_LIMIT=256M

RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && { \
        echo "upload_max_filesize = ${PHP_UPLOAD_MAX_FILESIZE}"; \
        echo "post_max_size = ${PHP_POST_MAX_SIZE}"; \
        echo "memory_limit = ${PHP_MEMORY_LIMIT}"; \
        echo "opcache.enable = 1"; \
        echo "opcache.validate_timestamps = 0"; \
    } > /usr/local/etc/php/conf.d/avis.ini

COPY docker/apache-site.conf /etc/apache2/sites-available/000-default.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
        /etc/apache2/sites-available/*.conf \
        /etc/apache2/apache2.conf

# ---------- Code applicatif ----------
WORKDIR /var/www/html

# Cache des dépendances : la couche n'est reconstruite que si composer.lock change
COPY composer.json composer.lock ./
RUN composer install \
        --prefer-dist \
        --no-dev \
        --no-scripts \
        --no-progress \
        --no-interaction \
        --optimize-autoloader

COPY . .

# Valeurs par défaut prod (les vrais secrets arrivent via les variables Render)
COPY .env.docker .env

# Dossiers requis (uploads ignorés par git/dockerignore)
RUN mkdir -p public/uploads var/cache var/log var/secrets config/jwt \
    && chown -R www-data:www-data public/uploads var config/jwt

EXPOSE 80

# Démarrage : secrets depuis variables d'environnement, warmup, Apache sur $PORT
CMD ["bash", "docker/start.sh"]
