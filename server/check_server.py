import paramiko, sys, os

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='pavkraft', password='bmwbmw7642', timeout=20)

cmds = [
    'pm2 list',
    'ss -tlnp',
    "curl -s https://api.ipify.org; echo",
    "host perforator.dpdns.org 8.8.8.8 2>&1",
    "host perforator.dpdns.org 77.88.8.8 2>&1",
    "curl -s http://localhost 2>&1 | head -3",
    "cat /etc/hosts | grep -i perforator || true",
    "which nginx && nginx -t 2>&1 || echo 'no nginx'",
    "which caddy && caddy version 2>&1 || echo 'no caddy'",
]

def safe(text):
    if not text:
        return ''
    return text.encode('utf-8', errors='replace').decode('utf-8', errors='replace')

for cmd in cmds:
    stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
    out = safe(stdout.read().decode('utf-8', errors='replace').strip())
    err = safe(stderr.read().decode('utf-8', errors='replace').strip()[:100])
    sys.stdout.buffer.write(f'$ {cmd}\n'.encode('utf-8'))
    if out:
        sys.stdout.buffer.write((out[:600] + '\n').encode('utf-8'))
    if err:
        sys.stdout.buffer.write(f'  ERR: {err}\n'.encode('utf-8'))

client.close()
