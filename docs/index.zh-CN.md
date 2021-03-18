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

#### 为什么要使用 Docker 安装 gitlab、jenkins、nginx？

因为原生安装上述东西，需要安装依赖以及编译。比如安装 jenkins 还需要安装 java 环境。

而使用 docker 比直接编译安装更适合服务编排和组织，并且可以做镜像备份和传输。

### CICD 为什么需要多台机器？

因为实际生产不可能构建机和服务在同一台。

#### 安装 Docker

```shell
# 安装依赖
yum install -y yum-utils device-mapper-persistent-data lvm2
# 使用阿里云源安装Docker
sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
yum install docker-ce
# 启动Docker
systemctl start docker
systemctl enable docker
# 验证是否安装成功
docker -v
```

#### 如何加速 Docker？

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

#### Docker容器无法ping通宿主机ip

[Docker容器无法ping通宿主机ip问题解决记录](https://www.cnblogs.com/surging-dandelion/p/14381349.html)

原因可能是`docker 加载内核的bridge.ko 驱动异常，导致docker0 网卡无法转发数据包，也就是系统内核的网桥模块bridge.ko 加载失败导致`需要`升级操作系统内核，重新安装docker`

#### 什么是 Docker in Docker？

Docker 采用的是 C/S（即 Client/Server）架构。我们在执行 `docker xxx`  等命令时，**其实是使用 `Client`  在和`docker engine`  在进行通信。**

我们在安装 Docker CE 时，会生成一个 `systemd service`  服务。这个服务启动时，就是 `Docker Engine`  服务。默认情况下，Docker 守护进程会生成一个 socket（`/var/run/docker.sock`）文件来进行本地进程通信，因此只能在本地使用 docker 客户端或者使用 Docker API 进行操作。

> \*.sock 文件：sock 文件是 UNIX 域套接字，它可以通过文件系统（而非网络地址）进行寻址和访问。

因此，只要把**宿主机的 Docker 套接字通过 Docker 数据卷挂载到容器内部**，就能实现在容器内使用 Docker 命令（如下图）。![cicd_231](https://images.gitee.com/uploads/images/2020/0725/103000_c028c6dd_1720749.png)

要实现在 Jenkins 内部访问宿主机 docker，要写一个 DockerFile 进行二次镜像构建。<br />此 DockerFile 的作用，就是为了安装容器使用宿主机 `Docker`  缺少的依赖。这里我们在容器内安装 `libltdl7` 。

1. **新建配置文件**

```shell
vi Dockerfile
```

```dockerfile
FROM jenkins/jenkins
USER root
# 清除了基础镜像设置的源，切换成阿里云源
RUN echo '' > /etc/apt/sources.list.d/jessie-backports.list \
  && echo "deb http://mirrors.aliyun.com/debian jessie main contrib non-free" > /etc/apt/sources.list \
  && echo "deb http://mirrors.aliyun.com/debian jessie-updates main contrib non-free" >> /etc/apt/sources.list \
  && echo "deb http://mirrors.aliyun.com/debian-security jessie/updates main contrib non-free" >> /etc/apt/sources.list
# 更新源并安装缺少的包
RUN apt-get update && apt-get install -y libltdl7
ARG dockerGid=999

RUN echo "docker:x:${dockerGid}:jenkins" >> /etc/group
```

2. 然后**构建镜像**

```shell
docker build -t local/jenkins .
```

如果报错`Temporary failure resolving 'mirrors.aliyun.com'`则
```shell
修改网卡配置文件
vim /etc/resolv.conf
# 加入下面
nameserver 114.114.114.114
nameserver 8.8.8.8
nameserver 8.8.4.4
# 重启网卡
/etc/init.d/network restart
# 再次构建
docker build -t local/jenkins .
```

如果再报错`[Warning] IPv4 forwarding is disabled. Networking will not work`则
```shell
vim /etc/sysctl.conf
# 添加这段代码
net.ipv4.ip_forward = 1
# 重启network服务
systemctl restart network && systemctl restart docker
# 查看是否修改成功 （备注：返回1，就是成功）
sysctl net.ipv4.ip_forward
# 再次构建
docker build -t local/jenkins .
```

3. 然后**启动镜像**

我们将 Jenkins 用户目录外挂到宿主机内，先新建一个 `/home/jenkins`  目录，并设置权限：

```shell
mkdir /home/jenkins
chown -R 1000 /home/jenkins/
```

接下来我们用镜像创建容器并启动：

```shell
docker run -itd --name jenkins -p 8080:8080 -p 50000:50000 \
-v /var/run/docker.sock:/var/run/docker.sock \
-v /usr/bin/docker:/usr/bin/docker \
-v /home/jenkins:/var/jenkins_home \
--restart always \
--user root local/jenkins
```

如果报错`docker: Error response from daemon: Conflict. The container name "/jenkins" is already in use by container`则表示 docker 重复了，可先删除在启动

```shell
docker rm dockerid
```

如果报错`docker: Error response from daemon: driver failed programming external connectivity on endpoint jenkins`则表示端口被占用，需换个端口，比如将`8080`换成`8090`

4. 然后**查看运行情况**

```shell
docker ps
```

如果期望的容器没有在列表内，多半是启动失败。可以加`-a`参数查看运行状态，再使用`docker logs -f dockerid`查看容器内日志输出。（当然也可以先试试重启下 docker

```shell
systemctl restart docker
```

5. 要想在外网访问安装的 jenkins，需**设置防火墙**

```shell
firewall-cmd --zone=public --add-port=8080/tcp --permanent
firewall-cmd --zone=public --add-port=50000/tcp --permanent
systemctl restart firewalld
```

6. 打开`ip:8080`**正常访问**jenkins

因为`jenkins`安装在 docker 容器内，若想进入容器内操作，可使用如下命令

```shell
docker exec -it jenkins /bin/bash
# -i 即使没有附加也保持stdin打开
# -t 分配一个伪终端
```

7. **替换镜像源**为清华大学的 Jenkins 插件源

```shell
find / -name 'default.json'
sed -i 's/http:\/\/updates.jenkins-ci.org\/download/https:\/\/mirrors.tuna.tsinghua.edu.cn\/jenkins/g' /var/jenkins_home/updates/default.json && sed -i 's/http:\/\/www.google.com/https:\/\/www.baidu.com/g' /var/jenkins_home/updates/default.json
exit;
```

### Jenkins

#### Jenkins 安装 nodejs 卡死，怎么解决？

解决方法

1. 下载[node-v15.9.0-linux-x64.tar.gz](https://nodejs.org/dist/v15.9.0/node-v15.9.0-linux-x64.tar.gz)到本地，

2. 然后上传到服务器

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

3. 然后前往 jenkins 的全局工具配置修改 nodejs 安装目录为`/var/jenkins_home/tools/jenkins.plugins.nodejs.tools.NodeJSInstallation/NODE_JS/node-v15.9.0-linux-x64`

4. 最后重新构建即可

### Gitlab

#### 如何安装 Gitlab？

1. 拉取 Gitlab 镜像

```shell
docker pull gitlab/gitlab-ce
```

2. 创建 Gitlab 容器

```shell
mkdir /home/gitlab #创建Gitlab工作目录

docker run -itd -p 443:443 \
-p 8899:8899 \
-p 333:333 \
--name gitlab \
--restart always \
-v /home/gitlab/config:/etc/gitlab \
-v /home/gitlab/logs:/var/log/gitlab \
-v /home/gitlab/data:/var/opt/gitlab \
gitlab/gitlab-ce
```

3. 防火墙放行端口

```shell
firewall-cmd --zone=public --add-port=333/tcp --permanent
firewall-cmd --zone=public --add-port=8899/tcp --permanent
systemctl reload firewalld
```

4. 修改 Gitlab 配置文件

```shell
vi /home/gitlab/config/gitlab.rb
# 新增三条配置
external_url 'http://外部访问域名/地址' # 实测不需要加端口！！！
# 下面两项走默认即可
# gitlab_rails['gitlab_ssh_host'] = 'SSH外部访问域名/地址'
# gitlab_rails['gitlab_shell_ssh_port'] = SSH端口
```

5. 修改容器内 SSH 端口为 333

```shell
# 进入容器
docker exec -it gitlab /bin/bash
# 将顶部的22端口改为333
vim /assets/sshd_config
vim /etc/ssh/sshd_config
```

6. 重启 Gitlab

```shell
docker restart gitlab
```

7. 浏览器打开访问 http://ip或域名:8899

打开后秒 502 卡死？怎么解决？

8080 端口被占用，解决如下

```shell
# 前往配置文件进行修改
vim /home/gitlab/config/gitlab.rb
# 放开下面几个注释
# unicorn['port'] = 8088 # 为8080时改为8088
# postgresql['shared_buffers'] = "256MB"
# postgresql['max_connections'] = 200
```

因为服务器配置过低，耐心等候一段时间。
