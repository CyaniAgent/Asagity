# AIM (Asagity Integrated Module)

> Asagity 模块生态系统规范

## 注意

关于`.aim`文件的安装/卸载/启用/禁用操作**需要管理员权限用户组内的用户操作**，如果你不在用户组内，但是在你的 Skyline 云盘上传了`.aim`文件，可以**向管理员发送文件**或**分享该文件给管理员**。

编辑`.aim`模块的代码可由这两类用户进行编辑：
1. 具有**管理员权限**用户组的用户，但是发布到 Git 远程仓库需要向**模块原作者申请**。
2. **模块原作者**，既可以编辑，也可以发布到 Git 远程仓库中。

## 概述

**AIM (Asagity Integrated Module)** 是 Asagity 特有的模块生态系统，基于 `.tar.gz` 构建。它允许开发者以模块化的方式扩展 Asagity 平台的前端和后端功能。

## 文件格式

AIM 模块文件使用 `.aim` 扩展名，本质上是一个 tar.gz 压缩包。

### 目录结构

```
module-name-v1.0.0.aim
├── manifest.json          # 模块元数据（必需）
├── backend/              # Go 后端扩展
│   ├── handler/
│   ├── service/
│   ├── repository/
│   └── model/
├── frontend/             # Nuxt 前端扩展
│   ├── components/
│   ├── pages/
│   ├── composables/
│   ├── plugins/
│   └── stores/
├── assets/              # 静态资源（可选）
│   ├── images/
│   └── icons/
├── config/              # 配置文件
│   └── default.yaml
└── README.md            # 模块说明
```

### 必须包含的文件

| 路径 | 说明 | 必需 |
|------|------|------|
| `/manifest.json` | 模块元数据 | ✅ 是 |
| `/backend/` | Go 后端扩展 | ✅ 是 |
| `/frontend/` | Nuxt 前端扩展 | ✅ 是 |
| `/assets/` | 静态资源 | 可选 |
| `/config/` | 配置文件 | ✅ 是 |

---

## manifest.json 规范

### 必填字段

```json
{
  "name": "module-name",
  "version": "1.0.0",
  "type": "full"
}
```

### 可选字段

```json
{
  "name": "module-name",
  "display_name": "模块显示名称",
  "version": "1.0.0",
  "description": "模块功能描述",
  "author": {
    "name": "作者名称",
    "email": "author@example.com",
    "url": "https://example.com"
  },
  "type": "full",
  "dependencies": {
    "@other-module": ">=1.0.0"
  },
  "entry": {
    "frontend": "index.ts",
    "backend": "main.go"
  },
  "permissions": [
    "read_notes",
    "write_notes"
  ],
  "hooks": {
    "onInstall": "scripts/install.sh",
    "onUninstall": "scripts/uninstall.sh"
  },
  "config": {
    "enabled": true,
    "settings": {}
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 模块唯一标识符（kebab-case） |
| `display_name` | string | 模块显示名称 |
| `version` | string | 语义化版本号 (semver) |
| `description` | string | 模块功能描述 |
| `author` | object | 作者信息 |
| `type` | string | 模块类型：`frontend` / `backend` / `full` |
| `dependencies` | object | 依赖的其他 AIM 模块 |
| `entry.frontend` | string | 前端入口文件路径 |
| `entry.backend` | string | 后端入口文件路径 |
| `permissions` | string[] | 权限列表 |
| `hooks` | object | 生命周期钩子 |
| `config` | object | 默认配置 |

---

## 前端集成

### 解析流程

```
.aim 文件 → tarparser 解析 → 读取 manifest.json → 动态注册
```

### 注册内容

- **组件** (`/frontend/components/`)：自动注册为全局组件
- **页面** (`/frontend/pages/`)：自动注册路由
- **Composable** (`/frontend/composables/`)：自动导入
- **插件** (`/frontend/plugins/`)：自动加载
- **Store** (`/frontend/stores/`)：自动注册 Pinia store

### 示例

```typescript
// manifest.json
{
  "name": "music-player",
  "version": "1.0.0",
  "type": "frontend",
  "entry": {
    "frontend": "index.ts"
  }
}

// frontend/index.ts
export default defineAIMPlugin({
  name: 'music-player',
  setup() {
    // 注册组件
    registerComponents()
    // 注册路由
    registerPages()
    // 初始化 store
    useMusicStore()
  }
})
```

---

## 后端集成

### 解压流程

```
.aim 文件 → tarutil 解压 → 读取 manifest.json → 注册模块
```

### 目录结构映射

```
/backend/
├── handler/     → 自动注册 HTTP 路由
├── service/     → 注入依赖容器
├── repository/  → 自动注册数据访问层
└── model/      → 自动迁移数据库模型
```

### 注册内容

- **路由** (`/backend/handler/`)：自动注册 API 路由到 `/api/modules/{module-name}/`
- **服务** (`/backend/service/`)：注册到服务容器
- **中间件**：`/backend/middleware/`
- **迁移**：`/backend/migrations/`

### 示例

```go
// manifest.json
{
  "name": "music-player",
  "version": "1.0.0",
  "type": "backend",
  "entry": {
    "backend": "module.go"
  }
}

// backend/module.go
package musicplayer

func Module() *asagity.Module {
    return &asagity.Module{
        Name:        "music-player",
        Version:     "1.0.0",
        RoutePrefix: "/api/music",
        Handlers:    []Handler{},
        Services:    []Service{},
    }
}
```

---

## 生命周期

### 安装流程

```
1. 验证模块签名
2. 检查依赖兼容性
3. 解压到 modules/ 目录
4. 执行 onInstall 钩子
5. 迁移数据库
6. 注册路由和组件
```

### 卸载流程

```
1. 执行 onUninstall 钩子
2. 清理数据库迁移
3. 移除文件
4. 更新配置
```

---

## 模块市场

AIM 模块可以通过以下方式分发：

1. **本地安装**：从文件系统安装 `.aim` 文件
2. **云盘安装**：从自己的 Skyline 云盘上传并安装`.aim`文件
4. **模块市场**：从 Asagity 模块市场下载
5. **Git 仓库**：从 Git 仓库直接安装

---

## 版本兼容性

| Asagity 版本 | AIM 版本支持 |
|--------------|--------------|
| 1.0.x | 1.0.x |
| 1.1.x | 1.0.x - 1.1.x |
| 2.0.x | 1.x - 2.x |

---

## 相关工具

- `tarparser` - 前端 AIM 解析库
- `tarutil` - 后端 AIM 解压工具
- `aimctl` - AIM 模块管理 CLI
