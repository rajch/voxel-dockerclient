FROM nginx
MAINTAINER Raj Chaudhuri

COPY ["nginxconf/nginx.conf", "/etc/nginx/nginx.conf"]
COPY ["public", "/home/vdc/"]

EXPOSE 8080