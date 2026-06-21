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

# Configure FrankenPHP to listen on the Railway PORT
ENV SERVER_NAME=":${PORT:-8080}"
ENV FRANKENPHP_CONFIG="worker /app/index.php"

# Start FrankenPHP
CMD ["frankenphp", "run", "--config", "/etc/frankenphp/Caddyfile"]
