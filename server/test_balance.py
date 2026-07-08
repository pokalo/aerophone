import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

body = '{"update_id":999,"message":{"message_id":999,"from":{"id":518789001,"is_bot":false,"first_name":"Test"},"chat":{"id":518789001,"type":"private"},"date":1782284000,"text":"/balance"}}'

cmd = "curl -s -X POST http://127.0.0.1:3000/webhook -H 'Content-Type: application/json' -d '" + body + "'"
stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print('Response:', out)
if err:
    print('ERR:', err[:200])

# Check logs for the result
stdin, stdout, stderr = client.exec_command("tail -5 /home/pavkraft/.pm2/logs/aerophone-payments-out.log", timeout=5)
print('Logs:')
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
