import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

stdin, stdout, stderr = client.exec_command('curl -s -w "\nHTTP %{http_code} Size: %{size_download}" -o /dev/null https://api.perforator.dpdns.org/download/aerophone-1.6.apk', timeout=15)
out = stdout.read().decode('utf-8', errors='replace').strip()
err = stderr.read().decode('utf-8', errors='replace').strip()
sys.stdout.buffer.write(out.encode('utf-8'))
if err:
    sys.stdout.buffer.write(f'\nSTDERR:\n{err}\n'.encode('utf-8'))

# Also check if the file is accessible locally
stdin, stdout, stderr = client.exec_command('ls -la /opt/apks/aerophone-1.6.apk', timeout=5)
out = stdout.read().decode('utf-8', errors='replace').strip()
sys.stdout.buffer.write(f'\n{out}\n'.encode('utf-8'))

client.close()
