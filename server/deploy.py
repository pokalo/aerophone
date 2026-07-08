import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

with open('C:\\Users\\pav\\aerophone\\server\\remote_index.js', 'r', encoding='utf-8') as f:
    content = f.read()

transport = client.get_transport()
sftp = transport.open_sftp_client()
file = sftp.file('/home/pavkraft/aerophone-payments/index.js', 'w')
file.write(content)
file.close()
sftp.close()

cmd = 'su - pavkraft -c "pm2 restart 1"'
stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
with open('deploy_result.log', 'wb') as f:
    f.write(stdout.read())
client.close()
print('Deployed')
