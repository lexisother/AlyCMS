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
FROM trafex/php-nginx:latest

USER root
RUN apk add --no-cache php82-pgsql php82-pdo php82-pdo_pgsql php82-pdo_sqlite
USER nobody

COPY --chown=nginx --from=composer /app /var/www/html
COPY /app/config.nginx /etc/nginx/conf.d/default.conf
