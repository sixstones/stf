# 开发指导
## 前端
- /res/app
> stf app模块主要页面

- /res/auth
> stf auth模块主要页面，登录、注册等

- /res/common
> 国际化、图标、status.js

- /res/build
> 前端打包生成文件目录

### 重新打包
```
gulp clean
gulp webpack:clean
```

## 开发环境搭建
```
  npm install phantomjs --phantomjs_cdnurl=https://npm.taobao.org/dist/phantomjs
  npm install
  npm link
```

# 相关部件
## PM2
> pm2 是一个带有负载均衡功能的Node应用的进程管理器

### 安装
```
npm install -g pm2
```
### 常用命令
```
pm2 start `which stf ` -- local --public-ip 192.168.132.54 --allow-remote
pm2 list
pm2 stop stf
pm2 restart stf
pm2 stop all
pm2 restart all
pm2 delete stf
pm2 delete all
```
### 日志
> ~/.pm2/logs/

## nrm
> npm register管理工具

### 安装
```
npm install -g nrm
```
### 常用命令
```
nrm ls
nrm add qbnpm http://192.168.130.42:4873/
nrm use qbnpm
```


## Sinopia
> NPM私有仓库
>> 访问地址：http://192.168.130.42:4873

### 安装
```
npm install -g sinopia
```

### 配置文件
> ~/.config/sinopia/config.yaml
```
...
 #注释该配置项，可防止于官方库同步
 #proxy: npmjs
 #新增监听4873端口，实现局域网内访问
 listen: 0.0.0.0:4873
```

### 启动
```
 pm2 start sinopia -- --config ~/.config/sinopia/config.yaml
```

### 包路径
> ~/.config/sinopoa/storage

## PM2
> pm2 是一个带有负载均衡功能的Node应用的进程管理器

### 安装
```
npm install -g pm2
```
### 常用命令
```
pm2 start `which stf ` -- local --public-ip 192.168.132.54 --allow-remote
pm2 list
pm2 stop stf
pm2 restart stf
pm2 stop all
pm2 restart all
pm2 delete stf
pm2 delete all
```
### 日志
> ~/.pm2/logs/

## nrm
> npm register管理工具

### 安装
```
npm install -g nrm
```
### 常用命令
```
nrm ls
nrm add qbnpm http://192.168.130.42:4873/
nrm use qbnpm
```
