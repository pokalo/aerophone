import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='pavkraft', password='bmwbmw7642', timeout=20)

cmds = [
    "ls -la ~/aerophone-payments/ 2>/dev/null",
    "ls ~/aerophone-payments/*.js 2>/dev/null || ls ~/aerophone-payments/*.mjs 2>/dev/null",
    "cat ~/aerophone-payments/package.json 2>/dev/null",
    "pm2 show aerophone-payments 2>/dev/null || echo 'no pm2 aerophone-payments'",
    "pm2 list 2>/dev/null",
    # Check if tunnel is running
    "ps aux | grep cloudflared | grep -v grep | head -5",
    # Check what's on port 443 currently
    "curl -sk https://perforator.dpdns.org 2>&1 | head -3",
    # Check if domain is in any nginx config
    "grep -r perforator /etc/nginx/ 2>/dev/null | head -10",
]

def safe(text):
    if not text: return ''
    return text.encode('utf-8', errors='replace').decode('utf-8', errors='replace')

for cmd in cmds:
    stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
    out = safe(stdout.read().decode('utf-8', errors='replace').strip())
    err = safe(stderr.read().decode('utf-8', errors='replace').strip()[:100])
    sys.stdout.buffer.write(f'$ {cmd}\n'.encode('utf-8'))
    if out:
        sys.stdout.buffer.write((out[:800] + '\n').encode('utf-8'))
    if err:
        sys.stdout.buffer.write(f'  ERR: {err}\n'.encode('utf-8'))

client.close()
