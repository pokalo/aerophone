import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='pavkraft', password='bmwbmw7642', timeout=20)

cmds = [
    "cat ~/aerophone-payments/index.js",
    # Check if perforator.dpdns.org resolves from this server
    "host perforator.dpdns.org 2>&1 || nslookup perforator.dpdns.org 2>&1 || dig perforator.dpdns.org +short 2>&1",
    # Check what IP this server has
    "ip addr show | grep 'inet ' | grep -v 127.0.0.1",
]

def safe(text):
    if not text: return ''
    return text.encode('utf-8', errors='replace').decode('utf-8', errors='replace')

for cmd in cmds:
    stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
    out = safe(stdout.read().decode('utf-8', errors='replace').strip())
    err = safe(stderr.read().decode('utf-8', errors='replace').strip()[:100])
    sys.stdout.buffer.write(f'===== {cmd} =====\n'.encode('utf-8'))
    if out:
        sys.stdout.buffer.write((out[:2000] + '\n').encode('utf-8'))
    if err:
        sys.stdout.buffer.write(f'  ERR: {err}\n'.encode('utf-8'))

client.close()
