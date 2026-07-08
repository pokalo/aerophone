import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

cmd = '''
cat > /home/pavkraft/aerophone-payments/ecosystem.config.cjs << 'EOF'
module.exports = {
 apps: [{
 name: 'aerophone-payments',
 script: 'index.js',
 env: {
 BOT_TOKEN: '8738154234:AAGG_aezss1FhDAM6Uf2adrENBUmMCDl5mc',
 PORT: 3000,
 PUBLIC_URL: 'https://api.perforator.dpdns.org',
 }
 }]
};
EOF

# Restart the PM2 process
su - pavkraft -c 'cd ~/aerophone-payments && pm2 restart ecosystem.config.cjs'
sleep 2

# Check logs
su - pavkraft -c 'pm2 logs aerophone-payments --lines 15 --nostream'
'''

stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
out = stdout.read().decode('utf-8', errors='replace').strip()
err = stderr.read().decode('utf-8', errors='replace').strip()
sys.stdout.buffer.write(out.encode('utf-8'))
if err:
    sys.stdout.buffer.write(f'\nSTDERR:\n{err}\n'.encode('utf-8'))

client.close()
