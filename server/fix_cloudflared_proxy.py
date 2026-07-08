import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

cmd = '''
echo '=== Step 1: Backup cloudflared-proxy ==='
cp -v /etc/nginx/sites-enabled/cloudflared-proxy /etc/nginx/sites-enabled/cloudflared-proxy.bak

echo '=== Step 2: Add aerophone locations to cloudflared-proxy ==='
cat > /etc/nginx/sites-enabled/cloudflared-proxy << 'EOF'
server {
    listen 80;
    listen 127.0.0.1:8080;
    client_max_body_size 50M;

    location /create-invoice {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 30s;
    }

    location /check-payment/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 30s;
    }

    location /webhook {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 30s;
    }

    location /balance {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 30s;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8443;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 30s;
    }

    location / {
        root /var/www/html;
        index index.html;
        error_page 418 = @wsbridge;

        if ($http_upgrade ~* "websocket") {
            return 418;
        }

        try_files $uri $uri/ =404;
    }

    location @wsbridge {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 300s;
    }

    location /download/ {
        alias /opt/apks/;
    }
}
EOF

echo '=== Step 3: Test config ==='
nginx -t

echo '=== Step 4: Reload ==='
systemctl reload nginx

echo '=== Step 5: Test ==='
curl -s http://127.0.0.1:8080/balance
echo
curl -s -w "\nHTTP %{http_code}" http://127.0.0.1:8080/balance
echo

echo '=== DONE ==='
'''

stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
out = stdout.read().decode('utf-8', errors='replace').strip()
err = stderr.read().decode('utf-8', errors='replace').strip()
sys.stdout.buffer.write(out.encode('utf-8'))
if err:
    sys.stdout.buffer.write(f'\nSTDERR:\n{err}\n'.encode('utf-8'))

client.close()
