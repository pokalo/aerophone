import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

cmd = "su - pavkraft -c 'pm2 restart 1' 2>&1 | head -10"
stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
sys.stdout.buffer.write(stdout.read())
client.close()
