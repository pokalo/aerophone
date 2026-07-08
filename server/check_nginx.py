import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='pavkraft', password='bmwbmw7642', timeout=20)

cmds = [
    # Read full aerophone index.js
    "cat ~/aerophone-payments/index.js",
    # Find the nginx config with port 443 SSL
    "cat /etc/nginx/sites-enabled/*",
    "cat /etc/nginx/conf.d/* 2>/dev/null || echo 'no conf.d'",
    # Check if any config includes SSL
    "find /etc/nginx -name '*.conf' -exec cat {} \\; 2>/dev/null",
    # Check port 443
    "ss -tlnp | grep 443",
]

def safe(text):
    if not text: return ''
    return text.encode('utf-8', errors='replace').decode('utf-8', errors='replace')

for cmd in cmds:
    stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
    out = safe(stdout.read().decode('utf-8', errors='replace').strip())
    err = safe(stderr.read().decode('utf-8', errors='replace').strip()[:100])
    sys.stdout.buffer.write(f'===== {cmd} =====\n'.encode('utf-8'))
    if out:
        sys.stdout.buffer.write((out[:2000] + '\n').encode('utf-8'))
    if err:
        sys.stdout.buffer.write(f'  ERR: {err}\n'.encode('utf-8'))

client.close()
