import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

cmds = [
    "su - pavkraft -c 'pm2 list'",
    "curl -s http://127.0.0.1:3000/balance",
    "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/ -X POST -H 'Content-Type: application/json' -d '{\"test\":1}'",
]

for cmd in cmds:
    stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
    out = stdout.read()
    with open(f'bug_{cmds.index(cmd)}.log', 'wb') as f:
        f.write(out)

client.close()
print('done')
