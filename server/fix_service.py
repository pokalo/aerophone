import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

service = """[Unit]
Description=Aerophone Payments Bot
After=network.target

[Service]
Type=simple
User=pavkraft
WorkingDirectory=/home/pavkraft/aerophone-payments
ExecStart=/usr/bin/node /home/pavkraft/aerophone-payments/index.js
Restart=on-failure
RestartSec=10
Environment=BOT_TOKEN=8738154234:AAGG_aezss1FhDAM6Uf2adrENBUmMCDl5mc
Environment=PORT=3000
Environment=PUBLIC_URL=https://api.perforator.dpdns.org

[Install]
WantedBy=multi-user.target
"""

cmds = [
    f"cat > /etc/systemd/system/aerophone-payments.service << 'SERVICEEOF'\n{service}\nSERVICEEOF",
    "systemctl daemon-reload 2>&1",
    "systemctl enable aerophone-payments 2>&1",
    "systemctl restart aerophone-payments 2>&1",
    "sleep 2",
    "systemctl status aerophone-payments --no-pager 2>&1 | head -15",
    "curl -s -w '%{http_code}' http://127.0.0.1:3000/balance -o /dev/null 2>&1",
]
for cmd in cmds:
    stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
    sys.stdout.buffer.write(stdout.read()[:500])
    sys.stdout.buffer.write(b'\n')

client.close()
