FROM php:8.2-cli
WORKDIR /var/www

# Dépendances OS + extensions PHP nécessaires
RUN apt-get update && apt-get install -y \
    libxml2-dev default-mysql-client unzip git \
 && docker-php-ext-install pdo pdo_mysql dom \
 && docker-php-ext-install pcntl posix \
 && pecl install redis \
 && docker-php-ext-enable redis \
 && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer
COPY . /var/www
RUN composer install

CMD ["php","artisan","serve","--host=0.0.0.0","--port=8000"]
