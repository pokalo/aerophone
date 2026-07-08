import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

stdin, stdout, stderr = client.exec_command('cat /home/pavkraft/.pm2/logs/aerophone-payments-out.log 2>/dev/null', timeout=10)
lines = stdout.read().decode('utf-8', errors='replace').split('\n')

# Find all successful payment lines
for line in lines:
    if 'Платёж подтверждён' in line:
        print(line)

# Also search for any raw update data (webhook body)
for line in lines:
    if 'telegram_user' in line.lower() or 'from' in line.lower() and 'id' in line.lower():
        print(line)

client.close()
