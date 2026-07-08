import paramiko, sys, time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

# Read local file
with open('C:\\Users\\pav\\aerophone\\server\\remote_index.js', 'r', encoding='utf-8') as f:
    content = f.read()

print('Local file size:', len(content), 'bytes')

# Write via SFTP with explicit flush and close
transport = client.get_transport()
sftp = transport.open_sftp_client()
with sftp.open('/home/pavkraft/aerophone-payments/index.js', 'w') as f:
    f.write(content)
    f.flush()

# Verify the file on the server
stdin, stdout, stderr = client.exec_command("md5sum /home/pavkraft/aerophone-payments/index.js && wc -c /home/pavkraft/aerophone-payments/index.js && head -10 /home/pavkraft/aerophone-payments/index.js", timeout=10)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print('Server file after write:')
print(out)
if err:
    print('ERR:', err)

# Restart PM2
stdin, stdout, stderr = client.exec_command('su - pavkraft -c "pm2 restart 1"', timeout=15)
print('PM2 restart result:', stdout.read().decode('utf-8', errors='replace')[:200])

time.sleep(2)

# Verify new code is running - check for [MSG] log
stdin, stdout, stderr = client.exec_command("grep 'text.includes\\|MSG\\|includes' /home/pavkraft/aerophone-payments/index.js", timeout=5)
print('\nGrep for new code:')
print(stdout.read().decode('utf-8', errors='replace')[:500])

sftp.close()
client.close()
