import paramiko

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect('69.12.73.250', port=22, username='pavkraft', password='bmwbmw7642', timeout=20)
    
    stdin, stdout, stderr = client.exec_command('hostname')
    print('Host:', stdout.read().decode().strip())
    
    stdin, stdout, stderr = client.exec_command("curl -s -o /dev/null -w '%{http_code}' https://perforator.dpdns.org 2>&1; echo")
    print('Domain HTTPS:', stdout.read().decode().strip())
    
    stdin, stdout, stderr = client.exec_command("curl -s -o /dev/null -w '%{http_code}' http://perforator.dpdns.org 2>&1; echo")
    print('Domain HTTP:', stdout.read().decode().strip())
    
    stdin, stdout, stderr = client.exec_command('curl -s ifconfig.me')
    print('Server public IP:', stdout.read().decode().strip())
    
    stdin, stdout, stderr = client.exec_command("nslookup perforator.dpdns.org 2>&1 || host perforator.dpdns.org 2>&1 || echo 'no nslookup'")
    print('DNS resolve:', stdout.read().decode().strip()[:200])
    
    client.close()
except Exception as e:
    print(f'Error: {e}')
