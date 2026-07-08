import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='pavkraft', password='bmwbmw7642', timeout=20)

cmds = [
    'ls -la ~/aerophone/ 2>/dev/null || ls -la ~/server/ 2>/dev/null || echo "no aerophone dir"',
    "ps aux | grep -i aerophone | grep -v grep || echo 'no aerophone process'",
    "ps aux | grep -i bot | grep -v grep || echo 'no bot process'",
    "cat ~/pm2.log 2>/dev/null | head -20 || pm2 logs pavkraft-bots --lines 10 --nostream 2>&1 | tail -10",
    "curl -s http://localhost:8080 2>&1 | head -5",
    "cat /etc/nginx/nginx.conf 2>/dev/null | head -60",
    "ls /etc/nginx/sites-enabled/ 2>/dev/null",
    "cat /etc/nginx/sites-enabled/* 2>/dev/null | head -80",
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
