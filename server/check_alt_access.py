import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='pavkraft', password='bmwbmw7642', timeout=20)

cmds = [
    # Check if pavkraft can use su 
    "echo bmwbmw7642 | su -c 'whoami' root 2>&1 || echo 'su failed'",
    # Check if we have write access to sites-available somehow
    "ls -la /etc/nginx/sites-available/ws-proxy",
    "ls -la /etc/nginx/",
    "ls -la /etc/nginx/ | head -5",
    # Check for any accessible nginx reload mechanism
    "pgrep -u root nginx 2>/dev/null",
    # Can we do anything as pavkraft?
    "find /etc/nginx -writable 2>/dev/null | head -5",
    # Is python3 available?
    "which python3",
    # Check /opt/apks permissions
    "ls -la /opt/apks/ 2>/dev/null | head -3",
    "ls -la /opt/ 2>/dev/null | head -5",
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
        sys.stdout.buffer.write((out[:500] + '\n').encode('utf-8'))
    if err:
        sys.stdout.buffer.write(f'  ERR: {err}\n'.encode('utf-8'))

client.close()
