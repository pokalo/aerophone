import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

cmds = [
    # Test all endpoints through the HTTP port (what Cloudflare tunnel connects to)
    'echo "--- /create-invoice ---" && curl -s -w "\nHTTP %{http_code}" http://127.0.0.1:8080/create-invoice -X POST -H "Content-Type: application/json" -d "{}"',
    'echo && echo "--- /balance ---" && curl -s -w "\nHTTP %{http_code}" http://127.0.0.1:8080/balance',
    'echo && echo "--- /check-payment/test ---" && curl -s -w "\nHTTP %{http_code}" http://127.0.0.1:8080/check-payment/test',
    'echo && echo "--- /webhook ---" && curl -s -w "\nHTTP %{http_code}" http://127.0.0.1:8080/webhook -X POST -H "Content-Type: application/json" -d "{}"',
    # Check what handles port 80 besides our config
    "grep -r 'listen.*80' /etc/nginx/ 2>/dev/null | grep -v backup | head -10",
    # Check if default config is enabled
    "ls -la /etc/nginx/sites-enabled/default 2>/dev/null || echo 'no default symlink'",
    "cat /etc/nginx/sites-available/default 2>/dev/null | head -15",
]

def safe(text):
    if not text: return ''
    return text.encode('utf-8', errors='replace').decode('utf-8', errors='replace')

for cmd in cmds:
    stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
    out = safe(stdout.read().decode('utf-8', errors='replace').strip())
    err = safe(stderr.read().decode('utf-8', errors='replace').strip()[:200])
    sys.stdout.buffer.write(f'===== {cmd} =====\n'.encode('utf-8'))
    if out:
        sys.stdout.buffer.write((out[:800] + '\n').encode('utf-8'))
    if err:
        sys.stdout.buffer.write(f'  ERR: {err}\n'.encode('utf-8'))

client.close()
