import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='pavkraft', password='bmwbmw7642', timeout=20)

cmds = [
    # Start aerophone-payments via PM2
    "cd ~/aerophone-payments && pm2 start ecosystem.config.cjs 2>&1",
    # Check it started
    "pm2 show aerophone-payments 2>&1 | head -15",
    # Check BOT_TOKEN is in environment
    "pm2 env 0 2>/dev/null | grep BOT || true",
    # Check what domain responds on port 443
    'curl -sk -H "Host: perforator.dpdns.org" https://127.0.0.1 2>&1 | head -3',
    # Try to test the payment server
    "curl -s http://127.0.0.1:3000/ 2>&1 | head -3 || echo 'not responding yet'",
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
