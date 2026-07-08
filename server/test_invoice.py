import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

# Test via localhost directly
cmd = "curl -s -w '\nHTTP:%{http_code}' -X POST http://127.0.0.1:3000/create-invoice -H 'Content-Type: application/json' -d '{\"purchaseId\":\"test_123\",\"title\":\"T\",\"description\":\"D\",\"starsAmount\":1}'"
sys.stdout.buffer.write(b'Test via localhost:\n')
stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
sys.stdout.buffer.write(stdout.read())

# Test via Nginx port 8080
cmd = "curl -s -w '\nHTTP:%{http_code}' -X POST http://127.0.0.1:8080/create-invoice -H 'Content-Type: application/json' -d '{\"purchaseId\":\"test_123\",\"title\":\"T\",\"description\":\"D\",\"starsAmount\":1}'"
sys.stdout.buffer.write(b'\n\nTest via Nginx 8080:\n')
stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
sys.stdout.buffer.write(stdout.read())

# Show the exact bytes of what the server receives
cmd = "tail -5 /home/pavkraft/.pm2/logs/aerophone-payments-out.log"
sys.stdout.buffer.write(b'\n\nRecent logs:\n')
stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
sys.stdout.buffer.write(stdout.read())

client.close()
