import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

cmd = 'su - pavkraft -c "cd /home/pavkraft/aerophone-payments && pm2 restart 1 && pm2 logs aerophone-payments --lines 5 --nostream"'
stdin, stdout, stderr = client.exec_command(cmd, timeout=15)

with open('restart_result.log', 'wb') as f:
    f.write(stdout.read())
    err = stderr.read()
    if err:
        f.write(b'\nERR:\n')
        f.write(err)

sys.stdout.buffer.write(b'Done. Check restart_result.log\n')
client.close()
