import paramiko, sys, time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

# Check the code on the server
cmd = "grep -o 'text.includes\\|\\[MSG\\]' /home/pavkraft/aerophone-payments/index.js"
stdin, stdout, stderr = client.exec_command(cmd, timeout=5)
sys.stdout.buffer.write(b'Grep: ' + stdout.read() + b'\n')

# Restart PM2
cmd = "su - pavkraft -c 'pm2 restart 1' 2>&1 | tail -5"
stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
sys.stdout.buffer.write(b'PM2 restart:\n' + stdout.read() + b'\n')

time.sleep(2)

# Check current output log
cmd = "tail -10 /home/pavkraft/.pm2/logs/aerophone-payments-out.log"
stdin, stdout, stderr = client.exec_command(cmd, timeout=5)
sys.stdout.buffer.write(b'Logs after restart:\n' + stdout.read() + b'\n')

# Check error log
cmd = "tail -3 /home/pavkraft/.pm2/logs/aerophone-payments-error.log"
stdin, stdout, stderr = client.exec_command(cmd, timeout=5)
sys.stdout.buffer.write(b'Errors:\n' + stdout.read() + b'\n')

client.close()
