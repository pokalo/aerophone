import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

cmd = 'pm2 list 2>&1 && echo "---" && cat /home/pavkraft/.pm2/logs/aerophone-payments-error.log | tail -20'
stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
with open('bot_status.log', 'wb') as f:
    f.write(stdout.read())
client.close()
print('done')
