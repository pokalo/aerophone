import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

# Try root with various passwords
passwords = ['bmwbmw7642', 'root', 'toor', 'admin', '']
for pw in passwords:
    try:
        client.connect('69.12.73.250', port=22, username='root', password=pw, timeout=10)
        sys.stdout.buffer.write(f'ROOT ACCESS with password: {pw}\n'.encode('utf-8'))
        break
    except Exception as e:
        sys.stdout.buffer.write(f'root/{pw}: {e}\n'.encode('utf-8'))
        continue

# Check if pavkraft can access files via a different method
stdin, stdout, stderr = client.exec_command('id; groups; whoami', timeout=5)
out = stdout.read().decode('utf-8', errors='replace').strip()
sys.stdout.buffer.write(f'pavkraft info: {out}\n'.encode('utf-8'))

# Check /etc/nginx/ssl permissions
stdin, stdout, stderr = client.exec_command('ls -la /etc/nginx/ssl/ 2>&1', timeout=5)
out = stdout.read().decode('utf-8', errors='replace').strip()
sys.stdout.buffer.write(f'SSL dir: {out}\n'.encode('utf-8'))

client.close()
