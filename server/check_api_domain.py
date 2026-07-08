import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='pavkraft', password='bmwbmw7642', timeout=20)

cmds = [
    # Check DNS resolution
    "nslookup api.perforator.dpdns.org 2>&1 | tail -10",
    "getent hosts api.perforator.dpdns.org 2>&1",
    # Check what's currently on port 443 with that hostname
    'curl -sk -H "Host: api.perforator.dpdns.org" https://127.0.0.1 2>&1 | head -20',
    'curl -sk -H "Host: api.perforator.dpdns.org" https://127.0.0.1/webhook 2>&1 | head -10',
    # Check all nginx configs
    "cat /etc/nginx/sites-enabled/*",
    "ls /etc/nginx/sites-available/ 2>/dev/null",
    # Check if there's a server_name match anywhere
    "grep -r 'perforator' /etc/nginx/ 2>/dev/null",
    # Check what's listening on commonly used ports
    "ss -tlnp | grep -E 'LISTEN'",
    # Check cloudflared config
    "cat /root/.cloudflared/config.yml 2>/dev/null",
    "cloudflared tunnel list 2>&1 || echo 'cannot list tunnels'",
]

def safe(text):
    if not text: return ''
    return text.encode('utf-8', errors='replace').decode('utf-8', errors='replace')

for cmd in cmds:
    stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
    out = safe(stdout.read().decode('utf-8', errors='replace').strip())
    err = safe(stderr.read().decode('utf-8', errors='replace').strip()[:200])
    sys.stdout.buffer.write(f'===== {cmd} =====\n'.encode('utf-8'))
    if out:
        sys.stdout.buffer.write((out[:1500] + '\n').encode('utf-8'))
    if err:
        sys.stdout.buffer.write(f'  ERR: {err}\n'.encode('utf-8'))

client.close()
