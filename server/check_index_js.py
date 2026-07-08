import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

cmd = "head -20 /home/pavkraft/aerophone-payments/index.js"
stdin, stdout, stderr = client.exec_command(cmd, timeout=5)
sys.stdout.buffer.write(stdout.read())

cmd = "ls -la /home/pavkraft/aerophone-payments/index.js 2>&1"
stdin, stdout, stderr = client.exec_command(cmd, timeout=5)
sys.stdout.buffer.write(b'\n---\n')
sys.stdout.buffer.write(stdout.read())

cmd = "pm2 show aerophone-payments 2>&1 | grep -i script"
stdin, stdout, stderr = client.exec_command(cmd, timeout=5)
sys.stdout.buffer.write(b'\n---\n')
sys.stdout.buffer.write(stdout.read())

client.close()
