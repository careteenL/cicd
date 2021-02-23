---
hero:
  title: Site Name
  desc: dumi site app 脚手架
  actions:
    - text: 快速上手
      link: /getting-started
features:
  - icon: https://gw.alipayobjects.com/zos/bmw-prod/881dc458-f20b-407b-947a-95104b5ec82b/k79dm8ih_w144_h144.png
    title: 特性 1
    desc: Balabala
  - icon: https://gw.alipayobjects.com/zos/bmw-prod/d60657df-0822-4631-9d7c-e7a869c2f21c/k79dmz3q_w126_h126.png
    title: 特性 2
    desc: Balabala
  - icon: https://gw.alipayobjects.com/zos/bmw-prod/d1ee0c6f-5aed-4a45-a507-339a4bfe076c/k7bjsocq_w144_h144.png
    title: 特性 3
    desc: Balabala
footer: Open-source MIT Licensed | Copyright © 2020<br />Powered by [dumi](https://d.umijs.org)
---

## CICD

### 笔记

- Why
- How
- What

### Docer 使用

#### 加速 Docker

配置镜像加速器
针对 Docker 客户端版本大于 1.10.0 的用户

您可以通过修改 daemon 配置文件/etc/docker/daemon.json 来使用加速器

```shell
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://vhuo92qh.mirror.aliyuncs.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### Jenkins

#### Jenkins 安装 nodejs 卡死

解决方法

- 下载[node-v15.9.0-linux-x64.tar.gz](https://nodejs.org/dist/v15.9.0/node-v15.9.0-linux-x64.tar.gz)到本地，

- 然后上传到服务器

```shell
# 服务器下操作 保证目录存在
mkdir -p /var/jenkins_home/tools/jenkins.plugins.nodejs.tools.NodeJSInstallation/NODE_JS
# 本地电脑操作 进行拷贝
sudo scp /Users/apple/Desktop/node-v15.9.0-linux-x64.tar.gz root@serverIp:/var/jenkins_home/tools/jenkins.plugins.nodejs.tools.NodeJSInstallation/NODE_JS
# 解压nodejs
cd /var/jenkins_home/tools/jenkins.plugins.nodejs.tools.NodeJSInstallation/NODE_JS
tar zxvf node-v15.9.0-linux-x64.tar.gz
rm -rf node-v15.9.0-linux-x64.tar.gz
```

- 然后前往 jenkins 的全局工具配置修改 nodejs 安装目录为`/var/jenkins_home/tools/jenkins.plugins.nodejs.tools.NodeJSInstallation/NODE_JS/node-v15.9.0-linux-x64`

- 最后重新构建即可
