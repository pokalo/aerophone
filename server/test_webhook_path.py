import paramiko, sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

# Test direct webhook access
cmds = [
    # Test 1: Direct to port 3000
    "curl -s -w '\nHTTP_CODE:%{http_code}' -X POST http://127.0.0.1:3000/webhook -H 'Content-Type: application/json' -d '{\"update_id\":1,\"message\":{\"message_id\":1,\"from\":{\"id\":518789001},\"chat\":{\"id\":518789001,\"type\":\"private\"},\"date\":1782284000,\"text\":\"/balance\"}}'",
    # Test 2: Through Nginx port 8080
    "curl -s -w '\nHTTP_CODE:%{http_code}' -X POST http://127.0.0.1:8080/webhook -H 'Content-Type: application/json' -d '{\"update_id\":2,\"message\":{\"message_id\":2,\"from\":{\"id\":518789001},\"chat\":{\"id\":518789001,\"type\":\"private\"},\"date\":1782284000,\"text\":\"/balance\"}}'",
]

for i, cmd in enumerate(cmds):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
    out = stdout.read().decode('utf-8', errors='replace')
    print(f'=== Test {i+1} ===')
    sys.stdout.buffer.write(out.encode())
    print()

client.close()
