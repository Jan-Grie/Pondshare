FROM httpd:2.4-alpine

# Provide our Apache config (proxy to php-fpm app + Reverb WS)
COPY docker/apache/httpd.conf /usr/local/apache2/conf/httpd.conf

# Ensure temp directory for icons alias override exists
RUN mkdir -p /var/empty
