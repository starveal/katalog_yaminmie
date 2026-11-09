# VPS deployment (PM2 + Nginx)

Uploaded images are stored in `UPLOADS_DIR` when it is set. Use the same
absolute directory in the PM2 environment and the Nginx `alias`. If it is not
set, the API uses `server/uploads`.

Example PM2 start command (adjust the application and upload paths):

```sh
cd /var/www/katalog_yaminmie/server
UPLOADS_DIR=/var/lib/katalog_yaminmie/uploads pm2 start npm --name katalog-yaminmie-api -- start
```

The Nginx site should serve the built client and explicitly serve uploads from
that same directory. Put these locations inside the site's `server` block:

```nginx
root /var/www/katalog_yaminmie/client/dist;
index index.html;

location ^~ /uploads/ {
    alias /var/lib/katalog_yaminmie/uploads/;
    expires 30d;
    add_header Cache-Control "public";
}

location /api/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

Ensure the Nginx worker can read the upload directory and its files. The API
must continue to receive `/api` requests on port `5000` (or update `proxy_pass`
to match `PORT`).
