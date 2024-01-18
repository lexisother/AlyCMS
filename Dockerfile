FROM composer AS composer

# Copying the source directory and install the dependencies with composer
COPY . /app

# Run composer install to install the dependencies
RUN composer install \
  --optimize-autoloader \
  --no-dev \
  --no-interaction \
  --no-progress

# Continue stage build with the desired image and copy the source including the dependencies downloaded by composer
# php 8.3
FROM trafex/php-nginx:3.5.0

USER root
RUN apk add --no-cache php83-pgsql php83-pdo php83-pdo_pgsql php83-pdo_sqlite
USER nobody

COPY --chown=nginx --from=composer /app /var/www/html
COPY --chown=nginx --from=composer /app/config.nginx /etc/nginx/conf.d/default.conf
