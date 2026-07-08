import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

cmds = [
    # Test locally through nginx (port 443 -> port 3000)
    'curl -sk https://127.0.0.1/create-invoice -X POST -H "Content-Type: application/json" -d "{}" 2>&1 | head -3',
    'curl -sk https://127.0.0.1/check-payment/test123 2>&1',
    'curl -sk https://127.0.0.1/balance 2>&1',
    'curl -sk https://127.0.0.1/webhook -X POST -H "Content-Type: application/json" -d "{}" 2>&1',
    # Also test through cloudflared via port 80
    'curl -s http://127.0.0.1:8080/create-invoice -X POST -H "Content-Type: application/json" -d "{}" 2>&1 | head -3',
    # Check aerophone PM2 logs
    'pm2 logs aerophone-payments --lines 10 --nostream 2>&1',
    # Set webhook via Telegram API
    'curl -s -X POST "https://api.telegram.org/bot8738154234:AAGG_aezss1FhDAM6Uf2adrENBUmMCDl5mc/setWebhook" -d "url=https://api.perforator.dpdns.org/webhook" 2>&1',
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
        sys.stdout.buffer.write((out[:500] + '\n').encode('utf-8'))
    if err:
        sys.stdout.buffer.write(f'  ERR: {err}\n'.encode('utf-8'))

client.close()
