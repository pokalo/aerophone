import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

# Kill PM2 aerophone-payments if running (to avoid port conflict)
cmds = [
    "su - pavkraft -c 'pm2 delete 1' 2>&1",
    "su - pavkraft -c 'pm2 save' 2>&1",
    # Verify only systemd process is on port 3000
    "ss -tlnp | grep 3000 2>&1",
]

for cmd in cmds:
    sys.stdout.buffer.write(b'\n=== ' + cmd.encode()[:60] + b' ===\n')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
    sys.stdout.buffer.write(stdout.read())

client.close()
