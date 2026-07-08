import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='pavkraft', password='bmwbmw7642', timeout=20)

cmds = [
    # Check if the aerophone-payments server can start
    "cd ~/aerophone-payments && cat index.js | head -30",
    # Check what port it was running on
    "cd ~/aerophone-payments && grep -i port index.js | head -5",
    # Check ecosystem config
    "cat ~/aerophone-payments/ecosystem.config.cjs",
    # Check if BOT_TOKEN is set anywhere
    "env | grep -i bot 2>/dev/null | head -5",
    # Check cloudflare tunnel config
    "cat /root/.cloudflared/config.yml 2>/dev/null | head -20",
    # Check if nginx has HTTPS (port 443)
    "cat /etc/nginx/sites-enabled/* 2>/dev/null | grep -A5 server_name | head -20",
    # Check what SSL certificate is used for 443
    "cat /etc/nginx/sites-enabled/cloudflared-proxy 2>/dev/null | head -30",
    "cat /etc/nginx/sites-enabled/direct-proxy 2>/dev/null | head -30",
    # Check if port 3000 or 443 is used by aerophone
    "ss -tlnp | grep -E '3000|8443'",
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
