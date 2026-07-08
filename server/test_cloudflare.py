import paramiko, sys, time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

# Send test through Cloudflare
cmd = "curl -s -X POST 'https://api.perforator.dpdns.org/create-invoice' -H 'Content-Type: application/json' -d '{\"purchaseId\":\"xxx\",\"title\":\"T\",\"description\":\"D\",\"starsAmount\":1}'"
stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
sys.stdout.buffer.write(b'Response:\n' + stdout.read() + b'\n')
sys.stdout.buffer.write(b'ERR:\n' + stderr.read()[:200] + b'\n')

time.sleep(1)

# Check what the server received
cmd = "tail -10 /home/pavkraft/.pm2/logs/aerophone-payments-out.log"
stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
sys.stdout.buffer.write(b'Server logs:\n' + stdout.read())

client.close()
