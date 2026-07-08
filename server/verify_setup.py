import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

cmds = [
    # Check PM2 env
    "pm2 env 1 2>/dev/null | grep -E 'PUBLIC_URL|BOT_TOKEN'",
    # Check current webhook via Telegram API
    'curl -s "https://api.telegram.org/bot8738154234:AAGG_aezss1FhDAM6Uf2adrENBUmMCDl5mc/getWebhookInfo" 2>&1',
    # Test invoice creation via nginx
    'curl -sk https://127.0.0.1/create-invoice -X POST -H "Content-Type: application/json" -d "{\"purchaseId\":\"test123\",\"title\":\"Test\",\"description\":\"Test\",\"starsAmount\":1}" 2>&1',
    # Quick test from external (if domain resolves)
    'curl -sk -w "\nHTTP %{http_code}" "https://api.perforator.dpdns.org/balance" 2>&1 | tail -3',
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
        sys.stdout.buffer.write((out[:800] + '\n').encode('utf-8'))
    if err:
        sys.stdout.buffer.write(f'  ERR: {err}\n'.encode('utf-8'))

client.close()
