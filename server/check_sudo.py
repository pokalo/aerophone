import paramiko, sys, getpass

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='pavkraft', password='bmwbmw7642', timeout=20)

# Check sudo rights
stdin, stdout, stderr = client.exec_command('sudo -n true 2>&1; echo "exit:$?"', timeout=10)
out = stdout.read().decode('utf-8', errors='replace').strip()
sys.stdout.buffer.write(f'Sudo check:\n{out}\n'.encode('utf-8'))

# Try pavkraft password for sudo
cmd = 'echo bmwbmw7642 | sudo -S cp -v /etc/nginx/sites-available/ws-proxy /etc/nginx/sites-available/ws-proxy.bak 2>&1'
stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
out = stdout.read().decode('utf-8', errors='replace').strip()
err = stderr.read().decode('utf-8', errors='replace').strip()
sys.stdout.buffer.write(f'Sudo with password:\n{out}\n'.encode('utf-8'))
if err:
    sys.stdout.buffer.write(f'ERR:{err}\n'.encode('utf-8'))

client.close()
