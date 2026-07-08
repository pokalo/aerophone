import paramiko, sys, time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

# Check ecosystem file exists and what's in it
cmds = [
    "cat /home/pavkraft/aerophone-payments/ecosystem.config.cjs 2>&1",
    "ls -la /home/pavkraft/aerophone-payments/index.js 2>&1",
    # Start the process via ecosystem
    "su - pavkraft -c 'cd /home/pavkraft/aerophone-payments && pm2 start ecosystem.config.cjs' 2>&1",
]

for cmd in cmds:
    sys.stdout.buffer.write(b'\n=== ' + cmd.encode()[:60] + b' ===\n')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
    sys.stdout.buffer.write(stdout.read())

time.sleep(3)

# Verify
for cmd in [
    "su - pavkraft -c 'pm2 list' 2>&1",
    "curl -s -w '%{http_code}' http://127.0.0.1:3000/balance -o /dev/null 2>&1",
]:
    sys.stdout.buffer.write(b'\n=== ' + cmd.encode()[:60] + b' ===\n')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
    sys.stdout.buffer.write(stdout.read())

client.close()
