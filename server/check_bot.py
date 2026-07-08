import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

cmds = [
    "su - pavkraft -c 'pm2 list'",
    "su - pavkraft -c 'pm2 info 1'",
    "cat /home/pavkraft/.pm2/logs/aerophone-payments-out.log | tail -20",
    "cat /home/pavkraft/.pm2/logs/aerophone-payments-error.log | tail -10",
]

for cmd in cmds:
    stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
    out = stdout.read()
    with open(f'check_{cmds.index(cmd)}.log', 'wb') as f:
        f.write(out)

client.close()
print('Done')
