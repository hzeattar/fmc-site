# Use official FrankenPHP image with PHP extensions
FROM dunglas/frankenphp:latest

# Install PHP extensions
RUN install-php-extensions \
    pdo_mysql \
    mbstring \
    json \
    fileinfo \
    openssl \
    session \
    iconv \
    intl \
    xml \
    zip \
    curl

# Copy app files
COPY . /app/

# Set working directory
WORKDIR /app

# FrankenPHP runs on port 8080 by default
EXPOSE 8080
