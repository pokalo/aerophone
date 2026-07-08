import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

cmd = '''
echo '=== Step 1: Backup ==='
cp -v /etc/nginx/sites-available/ws-proxy /etc/nginx/sites-available/ws-proxy.bak

echo '=== Step 2: Add aerophone locations ==='
cat > /etc/nginx/sites-available/ws-proxy << 'EOF'
server {
    listen 443 ssl;
    listen 44333 ssl;
    server_name _;
    ssl_certificate /etc/nginx/ssl/self.crt;
    ssl_certificate_key /etc/nginx/ssl/self.key;
    ssl_protocols TLSv1.2 TLSv1.3;

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

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 300s;
    }
}
EOF

echo '=== Step 3: Test config ==='
nginx -t

echo '=== Step 4: Reload nginx ==='
systemctl reload nginx

echo '=== DONE ==='
'''

stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
out = stdout.read().decode('utf-8', errors='replace').strip()
err = stderr.read().decode('utf-8', errors='replace').strip()
sys.stdout.buffer.write(out.encode('utf-8'))
if err:
    sys.stdout.buffer.write(f'\nSTDERR:\n{err}\n'.encode('utf-8'))

client.close()
