import paramiko, sys, os

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

sftp = client.open_sftp()
local = r'C:\Users\pav\aerophone\app\build\outputs\apk\release\app-release.apk'
remote = '/opt/apks/aerophone-1.6.apk'

sftp.put(local, remote)
sftp.close()
client.close()

print(f'Uploaded {os.path.getsize(local)} bytes -> {remote}')
