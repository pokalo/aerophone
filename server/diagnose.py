import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

cmds = [
    "pm2 list 2>&1",
    "curl -s -w '\nHTTP:%{http_code}' http://127.0.0.1:3000/balance 2>&1",
    "curl -s -w '\nHTTP:%{http_code}' -X POST http://127.0.0.1:3000/create-invoice -H 'Content-Type: application/json' -d '{\"purchaseId\":\"test_123\",\"title\":\"T\",\"description\":\"D\",\"starsAmount\":1}' 2>&1",
    "curl -s -w '\nHTTP:%{http_code}' http://127.0.0.1:8080/create-invoice -X POST -H 'Content-Type: application/json' -d '{\"purchaseId\":\"test_123\",\"title\":\"T\",\"description\":\"D\",\"starsAmount\":1}' 2>&1",
    "curl -s -w '\nHTTP:%{http_code}' http://127.0.0.1:8080/balance 2>&1",
    "tail -5 /home/pavkraft/.pm2/logs/aerophone-payments-error.log 2>&1",
]

for cmd in cmds:
    sys.stdout.buffer.write(b'\n=== ' + cmd.encode()[:60] + b' ===\n')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
    sys.stdout.buffer.write(stdout.read())

client.close()
