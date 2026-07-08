import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='pavkraft', password='bmwbmw7642', timeout=20)

cmds = [
    # Check what pavkraft-bots is
    "ls ~/pavkraft-bots/ 2>/dev/null",
    "cat ~/pavkraft-bots/package.json 2>/dev/null | head -30",
    # Check if aerophone bot files exist
    "grep -r aerophone ~/pavkraft-bots/src/ 2>/dev/null | head -5 || grep -r aerophone ~/pavkraft-bots/dist/ 2>/dev/null | head -5 || echo 'no aerophone in pavkraft-bots'",
    # Check what bots are configured
    "cat ~/pavkraft-bots/.env 2>/dev/null || cat ~/pavkraft-bots/.env.example 2>/dev/null || echo 'no env'",
    # Check old aerophone server files
    "find /home -name \"*.js\" -path \"*aerophone*\" 2>/dev/null | head -5",
    "find /home -name \"server*\" -path \"*payment*\" 2>/dev/null | head -5",
    # Check cloudflared
    "which cloudflared && cloudflared --version 2>&1 || echo 'no cloudflared'",
    # Check what domain the current nginx serves
    "cat /etc/nginx/sites-enabled/direct-proxy 2>/dev/null | head -30",
    "cat /etc/nginx/sites-enabled/cloudflared-proxy 2>/dev/null | head -30",
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
