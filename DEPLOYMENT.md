# Admin Panel 部署指南

## Cloudflare Pages 部署（推荐）

通过 Cloudflare Dashboard 连接 GitHub 仓库，自动构建和部署。

### 配置步骤

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → **Create** → **Pages**
3. 选择 **Connect to Git**
4. 授权并选择 `Mirage` 仓库
5. 配置构建设置：

| 配置项 | 值 |
|--------|-----|
| Project name | `chameleon-admin` |
| Production branch | `main` |
| Root directory | `admin-panel` |
| Build command | `npm run build` |
| Build output directory | `dist` |

6. 添加环境变量：

| 变量名 | 值 |
|--------|-----|
| `VITE_API_URL` | `https://chameleon-api-446996287300.us-central1.run.app` |

7. 点击 **Save and Deploy**

### 部署 URL

| 环境 | URL |
|------|-----|
| Production | `https://chameleon-admin.pages.dev` |
| Preview | `https://<branch>.chameleon-admin.pages.dev` |

### 后端配置

确保后端配置了 `ADMIN_PASSWORD` 环境变量：

```bash
~/google-cloud-sdk/bin/gcloud run services update chameleon-api \
  --region=us-central1 \
  --update-env-vars="ADMIN_PASSWORD=your-secure-password"
```

### 手动部署（可选）

```bash
cd admin-panel
npm run build
npx wrangler pages deploy dist --project-name=chameleon-admin
```

### 故障排查

1. **构建失败**
   - 检查 Node.js 版本兼容性
   - 确认 `package-lock.json` 已提交

2. **CORS 错误**
   - 确认 `VITE_API_URL` 配置正确
   - 检查后端 CORS 配置

3. **登录失败**
   - 确认后端 `ADMIN_PASSWORD` 已配置
   - 检查 API 地址是否正确
