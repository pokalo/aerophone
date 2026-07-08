import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

# Check current code on server
cmd = "grep -n 'text.includes\\|update.message\\[.*MSG' /home/pavkraft/aerophone-payments/index.js"
stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
sys.stdout.buffer.write(stdout.read())

# Check if server is actually responding to webhook
cmd = "curl -s -w '%{http_code}' -o /dev/null http://127.0.0.1:3000/balance 2>&1"
stdin, stdout, stderr = client.exec_command(cmd, timeout=5)
sys.stdout.buffer.write(b'\nBalance endpoint: ')
sys.stdout.buffer.write(stdout.read())

client.close()
