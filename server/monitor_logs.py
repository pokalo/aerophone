import paramiko, sys, time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

for attempt in range(3):
    time.sleep(2)
    stdin, stdout, stderr = client.exec_command(
        "tail -3 /home/pavkraft/.pm2/logs/aerophone-payments-out.log", timeout=10)
    data = stdout.read()
    sys.stdout.buffer.write(b'=== Attempt ' + str(attempt+1).encode() + b' ===\n')
    sys.stdout.buffer.write(data)
    sys.stdout.buffer.write(b'\n')

client.close()
