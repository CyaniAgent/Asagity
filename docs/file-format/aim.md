# AIM (Asagity Integrated Module)

> Asagity 模块生态系统规范文档

## 概述

**AIM (Asagity Integrated Module)** 是 Asagity 特有的模块生态系统，基于 `.tar.gz` 构建。它允许开发者以模块化的方式扩展 Asagity 平台的前端和后端功能。

## 文件格式

AIM 模块文件使用 `.aim` 扩展名，本质上是一个 tar.gz 压缩包。

### 目录结构

```
module-name-v1.0.0.aim
├── manifest.json          # 模块元数据（必需）
├── backend/              # Go 后端
│   ├── handler/
│   ├── service/
│   ├── repository/
│   └── model/
├── frontend/             # Nuxt 前端
│   ├── components/
│   ├── pages/
│   ├── composables/
│   ├── plugins/
│   └── stores/
├── assets/              # 静态资源（可选）
│   ├── images/
│   └── icons/
├── config/              # 配置文件（可选）
│   └── default.yaml
└── README.md            # 模块说明
```

### 必须包含的文件

| 路径 | 说明 | 必需 |
|------|------|------|
| `/manifest.json` | 模块元数据 | ✅ 是 |
| `/backend/` | Go 后端 | ✅ 是 |
| `/frontend/` | Nuxt 前端 | ✅ 是 |
| `/assets/` | 静态资源 | 可选 |
| `/config/` | 配置文件 | ✅ 是 |

---

## manifest.json 规范

### 完整字段示例

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
  "compatibility": {
    "asagity": ">=1.0.0",
    "api": ">=1.0.0"
  },
  "runtime": {
    "frontend": "nuxt3",
    "backend": "go1.22"
  },

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

  "capabilities": [
    "realtime",
    "ui-overlay",
    "federation"
  ],

  "injection": {
    "navbar": true,
    "sidebar": true,
    "settings": true
  },

  "assets": [
    "assets/icon.png",
    "assets/banner.jpg"
  ],

  "exports": {
    "api": "backend/api.go",
    "components": [
      "frontend/components/MeetingButton.vue"
    ]
  },

  "hooks": {
    "onInstall": "scripts/install.sh",
    "onUninstall": "scripts/uninstall.sh",
    "onUpdate": "scripts/update.sh"
  },

  "signature": {
    "type": "ed25519",
    "public_key": "xxxx",
    "signature": "xxxx"
  },

  "registry": "https://aim.asagity.org/modules",

  "config": {
    "enabled": true,
    "settings": {}
  }
}
```

### 字段说明

#### 1. 基础字段 (Required)

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 模块唯一标识符（kebab-case） |
| `version` | string | 语义化版本号 (semver) |
| `type` | string | 模块类型：`frontend` / `backend` / `full` |

#### 2. 元数据 (Metadata)

| 字段 | 类型 | 说明 |
|------|------|------|
| `display_name` | string | 模块显示名称 |
| `description` | string | 模块功能描述 |
| `author` | object | 作者信息 |

#### 3. 兼容性 (Compatibility) - 新增

声明模块适配的 Asagity 版本，避免模块因版本不兼容而崩溃。

```json
"compatibility": {
  "asagity": ">=1.0.0 <2.0.0",
  "api": ">=1.0.0"
}
```

| 子字段 | 类型 | 说明 |
|--------|------|------|
| `asagity` | string | Asagity 版本范围（semver ranges） |
| `api` | string | API 版本范围 |

#### 4. 运行环境 (Runtime) - 新增

声明模块需要的运行环境，避免模块在错误环境运行。

```json
"runtime": {
  "frontend": "nuxt3",
  "backend": "go1.22"
}
```

| 子字段 | 类型 | 说明 |
|--------|------|------|
| `frontend` | string | 前端框架版本要求 |
| `backend` | string | 后端版本要求 |

#### 5. 签名 (Signature) - 新增

用于安全验证，避免恶意模块。

```json
"signature": {
  "type": "ed25519",
  "public_key": "base64-encoded-public-key",
  "signature": "base64-encoded-signature"
}
```

| 子字段 | 类型 | 说明 |
|--------|------|------|
| `type` | string | 签名算法：`ed25519`、`rsa`、`ecdsa` |
| `public_key` | string | 公钥（base64 编码） |
| `signature` | string | 模块签名（base64 编码） |

#### 6. 资源声明 (Assets) - 新增

声明模块包含哪些静态资源，方便前端加载。

```json
"assets": [
  "assets/icon.png",
  "assets/banner.jpg",
  "assets/locales/ja.json",
  "assets/locales/zh.json"
]
```

#### 7. 能力声明 (Capabilities) - 新增

声明模块提供哪些能力（类似 Chrome extension），方便系统自动识别模块类型。

```json
"capabilities": [
  "realtime",       // 实时通信
  "ui-overlay",     // UI 覆盖层
  "federation",    // 联邦支持
  "ai",           // AI 能力
  "media",        // 媒体处理
  "storage",       // 存储扩展
  "webhook",      // Webhook 支持
  "oauth",        // OAuth 提供者
  "custom-emoji"  // 自定义 emoji
]
```

#### 8. UI 注入点 (Injection) - 新注

声明模块要注入到 Asagity 的哪些 UI 区域，让前端模块自动挂载。

```json
"injection": {
  "navbar": true,        // 导航栏
  "sidebar": true,       // 侧边栏
  "settings": true,      // 设置页
  "post-menu": true,     // 帖子菜单
  "user-card": true,     // 用户卡片
  "timeline": true,      // 时间线
  "composer": true,     // 撰写器
  "footer": true,       // 页脚
  "floating": true       // 悬浮按钮
}
```

每个注入点可以是一个布尔值，也可以是一个对象来指定具体位置：

```json
"injection": {
  "navbar": {
    "position": "right",  // left, center, right
    "priority": 100        // 优先级，数字越大越优先
  }
}
```

#### 9. 模块导出 (Exports) - 新增

用于模块间通信，让其他模块可以调用。

```json
"exports": {
  "api": "backend/api.go",
  "components": [
    "frontend/components/MeetingButton.vue"
  ],
  "composables": [
    "frontend/composables/useMeeting.ts"
  ],
  "stores": [
    "frontend/stores/meeting.ts"
  ]
}
```

#### 10. 模块来源 (Registry) - 新增

用于模块市场（AIM Store），未来可以做模块更新、下载、验证。

```json
"registry": "https://aim.asagity.org/modules"
```

完整 URL 格式：
```
https://aim.asagity.org/modules/{name}/{version}/download
https://aim.asagity.org/modules/{name}/latest
https://aim.asagity.org/modules/{name}/versions
```

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
└── model/       → 自动迁移数据库模型
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

## 模块生命周期

### 安装流程

```
1. 验证模块签名 (signature)
2. 检查兼容性 (compatibility)
3. 检查运行环境 (runtime)
4. 解压到 modules/ 目录
5. 执行 onInstall 钩子
6. 迁移数据库
7. 注册路由和组件
```

### 卸载流程

```
1. 执行 onUninstall 钩子
2. 清理数据库迁移
3. 移除文件
4. 更新配置
```

### 更新流程

```
1. 执行 onUpdate 钩子
2. 迁移数据库
3. 重载模块
```

---

## 模块市场

AIM 模块可以通过以下方式分发：

1. **本地安装**：从文件系统安装 `.aim` 文件
2. **模块市场**：从 Asagity 模块市场下载
3. **Git 仓库**：从 Git 仓库直接安装

### 模块市场 API

```
# 获取模块信息
GET /api/modules/store/{name}

# 下载模块
GET api/modules/store/{name}/{version}/download

# 搜索模块
GET /api/modules/store?q=keyword

# 验证模块签名
POST /api/modules/verify
Body: { "name": "...", "signature": "..." }
```

---

## 版本兼容性

| Asagity 版本 | AIM 版本支持 |
|--------------|--------------|
| 1.0.x | 1.0.x |
| 1.1.x | 1.0.x - 1.1.x |
| 2.0.x | 1.x - 2.x |

---

## 最佳实践

### 1. 模块命名

- 使用 kebab-case：`my-awesome-module`
- 不要使用 `asagity-` 前缀（保留给官方模块）
- 使用 `@scope/` 前缀表示组织模块：`@acme/module-name`

### 2. 版本管理

- 遵循语义化版本 (semver)：`MAJOR.MINOR.PATCH`
- 首次发布使用 `1.0.0`
- 不兼容改动增加 MAJOR 版本
- 新功能增加 MINOR 版本
- 修复增加 PATCH 版本

### 3. 安全建议

- 始终签名模块
- 不要在 `hooks` 中执行不���信���码
- 最小化 permissions
- 审查所有 dependencies

---

## 相关工具

- `tarparser` - 前端 AIM 解析库
- `tarutil` - 后端 AIM 解压工具
- `aimctl` - AIM 模块管理 CLI