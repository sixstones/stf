# 钱宝STF部署
## 部署环境
1. centos 7
2. nginx v1.13.7
3. node v8.9.1
## 部署方式
### 1. 自定义系统服务，共14个，其中部分模版服务可同时运行多个
* stf-api.service

```
[Unit]
Description=STF api

[Service]
TimeoutStartSec=0
Restart=always
ExecStart=/opt/node/bin/stf api --port 7106 --secret kittykat --connect-sub tcp://stf.qbao.com:7113  --connect-push tcp://stf.qbao.com:7111
ExecStop=kill -9 `ps -ef | grep 'stf api'|grep -v grep | tr -s ' ' | awk -F' ' '{print $2}'`
````
* stf-app.service
```
[Unit]
Description=STF app

[Service]
TimeoutStartSec=0
Restart=always
ExecStart=/opt/node/bin/stf app --port 7105 --secret kittykat --auth-url http://stf.qbao.com/auth/mock/ --websocket-url http://stf.qbao.com/
ExecStop=kill -9 `ps -ef | grep 'stf app'|grep -v grep | tr -s ' ' | awk -F' ' '{print $2}'`
```
* stf-auth.service
```
[Unit]
Description=STF mock auth

[Service]
TimeoutStartSec=0
Restart=always
ExecStart=/opt/node/bin/stf auth-mock --port 7120 --secret kittykat --app-url http://stf.qbao.com/
ExecStop=kill -9 `ps -ef | grep 'stf auth-mock'|grep -v grep | tr -s ' ' | awk -F' ' '{print $2}'`
```
* stf-migrate.service
```
[Unit]
Description=STF migrate

[Service]
Type=oneshot
ExecStart=/opt/node/bin/stf migrate
ExecStop=kill -9 `ps -ef | grep 'stf migrate'|grep -v grep | tr -s ' ' | awk -F' ' '{print $2}'`
```
* stf-processor@54.service（模版服务）
```
[Unit]
Description=STF processor

[Service]
TimeoutStartSec=0
Restart=always
ExecStart=/opt/node/bin/stf processor %p-%i  --connect-app-dealer tcp://stf.qbao.com:7112 --connect-dev-dealer tcp://stf.qbao.com:7115
ExecStop=kill -9 `ps -ef | grep 'stf processor'|grep -v grep | tr -s ' ' | awk -F' ' '{print $2}'`
```
* stf-provider@54.service
```
[Unit]
Description=STF provider

[Service]
TimeoutStartSec=0
Restart=always
ExecStart=/opt/node/bin/stf provider \
    --name "%H/%i" \
    --connect-sub tcp://stf.qbao.com:7114 \
    --connect-push tcp://stf.qbao.com:7116 \
    --storage-url http://stf.qbao.com/ \
    --public-ip 192.168.132.54 \
    --adb-host 192.168.195.66 \
    --adb-port 5037 \
    --allow-remote \
    --min-port=15000 \
    --max-port=25000 \
    --heartbeat-interval 10000 \
    --screen-ws-url-pattern "ws://stf.qbao.com/d/%i/<%= serial %>/<%= publicPort %>/"
```
* stf-reaper.service
```
[Unit]
Description=STF reaper

[Service]
TimeoutStartSec=0
Restart=always
ExecStart=/opt/node/bin/stf reaper dev --connect-push tcp://stf.qbao.com:7116 --connect-sub tcp://stf.qbao.com:7111 --heartbeat-timeout 30000
ExecStop=kill -9 `ps -ef | grep 'stf reaper'|grep -v grep | tr -s ' ' | awk -F' ' '{print $2}'`
```
* stf-storage-plugin-apk.service
```
[Unit]
Description=STF APK storage plugin

[Service]
TimeoutStartSec=0
Restart=always
ExecStart=/opt/node/bin/stf storage-plugin-apk --port 7104 --storage-url http://stf.qbao.com/
ExecStop=kill -9 `ps -ef | grep 'stf storage-plugin-apk'|grep -v grep | tr -s ' ' | awk -F' ' '{print $2}'`
```
* stf-storage-plugin-image.service
```
[Unit]
Description=STF image storage plugin

[Service]
TimeoutStartSec=0
Restart=always
ExecStart=/opt/node/bin/stf storage-plugin-image --port 7103 --storage-url http://stf.qbao.com/
ExecStop=kill -9 `ps -ef | grep 'stf storage-plugin-image'|grep -v grep | tr -s ' ' | awk -F' ' '{print $2}'`
```
* stf-storage-temp.service
```
[Unit]
Description=STF image storage plugin

[Service]
TimeoutStartSec=0
Restart=always
ExecStart=/opt/node/bin/stf storage-plugin-image --port 7103 --storage-url http://stf.qbao.com/
ExecStop=kill -9 `ps -ef | grep 'stf storage-plugin-image'|grep -v grep | tr -s ' ' | awk -F' ' '{print $2}'`
```
* stf-triproxy-app.service
```
[Unit]
Description=STF app triproxy

[Service]
TimeoutStartSec=0
Restart=always
ExecStart=/opt/node/bin/stf triproxy app --bind-pub "tcp://*:7111" --bind-dealer "tcp://*:7112" --bind-pull "tcp://*:7113"
ExecStop=kill -9 `ps -ef | grep 'stf triproxy app'|grep -v grep | tr -s ' ' | awk -F' ' '{print $2}'`
```
* stf-triproxy-dev.service
```
[Unit]
Description=STF dev triproxy

[Service]
TimeoutStartSec=0
Restart=always
ExecStart=/opt/node/bin/stf triproxy dev --bind-pub "tcp://*:7114" --bind-dealer "tcp://*:7115"   --bind-pull "tcp://*:7116"
ExecStop=kill -9 `ps -ef | grep 'stf triproxy dev'|grep -v grep | tr -s ' ' | awk -F' ' '{print $2}'`
```
#### 2. Nginx设置域名代理
```
http {
  upstream stf_app {
    server 192.168.132.54:7105 max_fails=0;
  }

  upstream stf_auth {
    server 192.168.132.54:7120 max_fails=0;
  }

  upstream stf_storage_apk {
    server 192.168.132.54:7104 max_fails=0;
  }

  upstream stf_storage_image {
    server 192.168.132.54:7103 max_fails=0;
  }

  upstream stf_storage {
    server 192.168.132.54:7102 max_fails=0;
  }

  upstream stf_websocket {
    server 192.168.132.54:7110 max_fails=0;
  }

  upstream stf_api {
    server 192.168.132.54:7106 max_fails=0;
  }

  map $http_upgrade $connection_upgrade {
    default  upgrade;
    ''       close;
  }

types {
    application/javascript  js;
    image/gif               gif;
    image/jpeg              jpg;
    text/css                css;
    text/html               html;
  }
  server {
    listen 80;
    server_name stf.qbao.com;
    access_log  logs/stf.access.log ;
    error_log  logs/stf.error.log ;
    location ~ "^/d/53/([^/]+)/(?<port>[0-9]{5})/$" {
      proxy_pass http://192.168.132.54:$port/;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection $connection_upgrade;
      proxy_set_header X-Forwarded-For $remote_addr;
      proxy_set_header X-Real-IP $remote_addr;
    }

     location ~ "^/d/sixstones/([^/]+)/(?<port>[0-9]{5})/$" {
      proxy_pass http://192.168.132.54:$port/;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection $connection_upgrade;
      proxy_set_header X-Forwarded-For $remote_addr;
      proxy_set_header X-Real-IP $remote_addr;
    }
     location ~ "^/d/mac/([^/]+)/(?<port>[0-9]{5})/$" {
      proxy_pass http://192.168.132.54:$port/;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection $connection_upgrade;
      proxy_set_header X-Forwarded-For $remote_addr;
      proxy_set_header X-Real-IP $remote_addr;
    }

    location /auth/ {
      proxy_pass http://stf_auth/auth/;
    }

    location /api/ {
      proxy_pass http://stf_api/api/;
    }

    location /s/image/ {
      proxy_pass http://stf_storage_image;
    }

    location /s/apk/ {
      proxy_pass http://stf_storage_apk;
    }

    location /s/ {
      client_max_body_size 1024m;
      client_body_buffer_size 128k;
      proxy_pass http://stf_storage;
    }

    location /socket.io/ {
      proxy_pass http://stf_websocket;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection $connection_upgrade;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Real-IP $http_x_real_ip;
    }

    location / {
      proxy_pass http://stf_app;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Real-IP $http_x_real_ip;
    }
  }
}
```
## 启动过程
### Nginx启动
```
./nginx -s reload
```
### 服务启动
1. start_stf.sh
```
systemctl start stf-api.service
systemctl start stf-app.service
systemctl start stf-auth.service
systemctl start stf-migrate.service
systemctl start stf-processor@54.service
systemctl start stf-provider@mac.service
systemctl start stf-reaper.service
systemctl start stf-storage-plugin-apk.service
systemctl start stf-storage-plugin-image.service
systemctl start stf-storage-temp.service
systemctl start stf-triproxy-app.service
systemctl start stf-triproxy-dev.service
systemctl start stf-websocket.service
```
2. stop_stf.sh
```
systemctl stop stf-api.service
systemctl stop stf-app.service
systemctl stop stf-auth.service
systemctl stop stf-migrate.service
systemctl stop stf-processor@54.service
systemctl stop stf-provider@mac.service
systemctl stop stf-reaper.service
systemctl stop stf-storage-plugin-apk.service
systemctl stop stf-storage-plugin-image.service
systemctl stop stf-storage-temp.service
systemctl stop stf-triproxy-app.service
systemctl stop stf-triproxy-dev.service
systemctl stop stf-websocket.service
```
### 日志
/var/log/message
