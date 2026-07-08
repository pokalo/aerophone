import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

cmd = "tail -20 /home/pavkraft/.pm2/logs/aerophone-payments-out.log"
stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
with open('tail_log.log', 'wb') as f:
    f.write(stdout.read())
client.close()
print('done')
