import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

cmds = [
    "su - pavkraft -c 'pm2 list' 2>&1",
    "su - pavkraft -c 'pm2 restart 1' 2>&1",
    "sleep 2 && curl -s -w '%{http_code}' http://127.0.0.1:3000/balance -o /dev/null 2>&1",
]

for cmd in cmds:
    sys.stdout.buffer.write(b'\n=== ' + cmd.encode()[:60] + b' ===\n')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
    sys.stdout.buffer.write(stdout.read())

client.close()
