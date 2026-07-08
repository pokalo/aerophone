import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

stdin, stdout, stderr = client.exec_command('cat /home/pavkraft/aerophone-payments/index.js', timeout=10)
content = stdout.read()  # Keep as bytes

with open('remote_index.js', 'wb') as f:
    f.write(content)

print(f'Written {len(content)} bytes')
client.close()
