import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

# Check the wrapper script and the current index.js
for cmd in [
    "head -5 /usr/local/bin/aerophone-wrapper.js 2>&1",
    "grep -n 'text.includes\\|\\[MSG\\]\\|includes' /home/pavkraft/aerophone-payments/index.js | head -10",
    "wc -c /home/pavkraft/aerophone-payments/index.js",
    "md5sum /home/pavkraft/aerophone-payments/index.js",
    "grep -c 'aerophone@support' /home/pavkraft/aerophone-payments/index.js",
]:
    sys.stdout.buffer.write(b'\n=== ' + cmd.encode()[:70] + b' ===\n')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
    sys.stdout.buffer.write(stdout.read())

client.close()
