# 智能工作台助手部署清单（Alibaba Cloud Linux 3）

本文档适用于 **Alibaba Cloud Linux 3 + Docker Compose** 部署当前项目（`frontend + backend + mysql`）。

---

## 0. 部署目标

- 在云服务器上以容器方式启动：
  - `mysql`（数据库）
  - `backend`（Node.js + Express API）
  - `frontend`（Nginx 托管前端静态资源，并代理 `/api`）
- 通过 **子路径** 访问应用：`http://118.31.52.245/ai_project/workbenchByAgent`（前端与 API 均在该路径下；根路径 `/` 仍可访问旧版或占位）。

---

## 1. 云控制台准备（阿里云）

### 1.1 安全组放行端口

- 放行入方向：
  - `22/tcp`（SSH 登录）
  - `80/tcp`（HTTP 访问）
  - `443/tcp`（HTTPS，后续启用）

**作用**：确保你能远程登录服务器，并允许公网访问网站。

---

## 2. 登录服务器并确认系统

```bash
ssh root@<你的ECS公网IP>
cat /etc/os-release
```

你应看到类似 `Alibaba Cloud Linux release 3`。

**作用**：确认后续安装命令和系统匹配，避免包管理器不兼容。

---

## 3. 安装 Docker 与 Compose（Alibaba Cloud Linux 3）

```bash
sudo dnf -y update
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
docker --version
docker compose version
```

**作用**：
- 安装 Docker 引擎和 Compose 插件。
- 设置 Docker 开机自启并立即启动。

---

## 4. 创建项目目录（推荐）

```bash
sudo mkdir -p /opt/ai_project
sudo chown -R $USER:$USER /opt/ai_project
cd /opt/ai_project
```

**作用**：统一服务部署目录，便于后续维护和备份。

---

## 5. 拉取项目代码

### 5.1 使用 Git（推荐）

```bash
cd /opt/ai_project
git clone <你的仓库地址> .
```

### 5.2 或手动上传代码

- 用 SFTP / SCP 上传项目到 `/opt/ai_project`。

**作用**：把本地开发代码放到服务器部署目录。

---

## 6. 配置生产环境变量

```bash
cd /opt/ai_project
cp .env.docker.example .env.docker
vim .env.docker
```

至少配置：

```env
MYSQL_ROOT_PASSWORD=请改成强密码
JWT_SECRET=请改成高强度随机串
CORS_ORIGIN=http://118.31.52.245
DASHSCOPE_API_KEY=你的百炼API_KEY
QQ_MAIL_USER=你的QQ邮箱
QQ_MAIL_AUTH_CODE=你的QQ邮箱授权码
```

> 若已有域名，`CORS_ORIGIN` 建议改为 `https://你的域名`。

**作用**：
- 注入数据库、鉴权、AI、邮箱等运行配置。
- 避免把敏感信息写死在代码中。

---

## 7. 启动容器服务

```bash
cd /opt/ai_project
docker compose --env-file .env.docker up -d --build
docker compose ps
```

**作用**：
- 构建镜像并后台启动所有服务。
- `ps` 用于确认容器是否正常运行。

---

## 8. 查看日志与健康检查

```bash
docker compose logs -f mysql
docker compose logs -f backend
docker compose logs -f frontend
```

```bash
curl http://127.0.0.1/api/health
```

预期返回：

```json
{"code":"OK","message":"healthy"}
```

**作用**：
- 日志用于定位启动失败、连接失败等问题。
- 健康检查确认后端 API 正常。

---

## 9. 访问应用

- **子路径（推荐）**：`http://118.31.52.245/ai_project/workbenchByAgent`
- 根路径（可选）：`http://118.31.52.245/`
- 前端通过 Nginx 将 `/ai_project/workbenchByAgent/api` 代理到后端。

**作用**：验证公网可访问与前后端联通。

---

## 10. 常用运维命令

### 10.1 重建并更新

```bash
cd /opt/ai_project
git pull
docker compose --env-file .env.docker up -d --build
```

### 10.2 重启某个服务

```bash
docker compose restart backend
docker compose restart frontend
docker compose restart mysql
```

### 10.3 停止/删除容器（不删数据卷）

```bash
docker compose down
```

### 10.4 停止并删除数据卷（危险）

```bash
docker compose down -v
```

**作用**：用于版本更新、故障重启、重置环境。

---

## 11. HTTPS（建议上线后尽快做）

最简单路径：
- 先确认域名已解析到 ECS。
- 再加反向代理（Nginx/Caddy）并申请证书（Let’s Encrypt）。

**作用**：
- 提升安全性（加密传输）。
- 浏览器与第三方 API 更稳定（避免混合内容/安全告警）。

---

## 12. 常见问题排查

### 12.1 `docker compose` 找不到

- 检查：
  ```bash
  docker compose version
  ```
- 若失败，重装 `docker-compose-plugin`。

### 12.2 前端能开，接口报 CORS

- 检查 `.env.docker` 的 `CORS_ORIGIN` 是否与访问地址一致。
- 修改后执行：
  ```bash
  docker compose --env-file .env.docker up -d --build backend
  ```

### 12.3 MySQL 初始化脚本未生效

- `backend/scripts/migrate.sql` 只在数据库卷首次初始化时执行。
- 若要重跑（会清空数据）：
  ```bash
  docker compose down -v
  docker compose --env-file .env.docker up -d --build
  ```

---

## 13. 上线检查清单（勾选）

- [ ] 安全组已放行 22/80/443
- [ ] Docker 与 Compose 已安装
- [ ] 代码已上传到 `/opt/ai_project`
- [ ] `.env.docker` 已填写真实配置
- [ ] `docker compose ps` 全部服务为运行状态
- [ ] `curl /api/health` 返回 `OK`
- [ ] 浏览器可打开首页
- [ ] 已配置 HTTPS（生产建议）

---

如需，我可以下一步再给你一份 **“阿里云 + 域名 + HTTPS（Caddy 自动证书）”** 的完整命令版文档。
