import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

# Create a systemd service for aerophone-payments as root
service = """[Unit]
Description=Aerophone Payments Bot
After=network.target

[Service]
Type=forking
User=pavkraft
WorkingDirectory=/home/pavkraft/aerophone-payments
ExecStart=/usr/bin/pm2 start 1
ExecStop=/usr/bin/pm2 stop 1
ExecReload=/usr/bin/pm2 restart 1
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
"""

stdin, stdout, stderr = client.exec_command('cat > /etc/systemd/system/aerophone-payments.service << EOF\n' + service + '\nEOF\necho "done"', timeout=10)
print(stdout.read().decode())
print(stderr.read().decode())

# Enable and start
cmds = [
    "systemctl daemon-reload 2>&1",
    "systemctl enable aerophone-payments 2>&1",
    "systemctl start aerophone-payments 2>&1",
    "systemctl status aerophone-payments --no-pager 2>&1 | head -15",
]
for cmd in cmds:
    stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
    sys.stdout.buffer.write(stdout.read()[:500])
    sys.stdout.buffer.write(b'\n')

client.close()
