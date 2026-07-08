import paramiko, time, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

time.sleep(3)

for fname in [
    '/home/pavkraft/.pm2/logs/aerophone-payments-out.log',
    '/home/pavkraft/.pm2/logs/aerophone-payments-error.log'
]:
    stdin, stdout, stderr = client.exec_command(f'tail -15 {fname}', timeout=10)
    data = stdout.read()
    sys.stdout.buffer.write(b'=== ' + fname.encode() + b' ===\n')
    sys.stdout.buffer.write(data)
    sys.stdout.buffer.write(b'\n')

client.close()
