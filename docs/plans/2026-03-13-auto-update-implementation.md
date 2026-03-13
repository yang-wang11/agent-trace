# Auto Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为当前 Electron 应用实现基于 GitHub Releases 的 macOS 自动更新闭环，并补齐测试与发布契约。

**Architecture:** 主进程新增独立更新服务封装 `electron-updater`，通过 IPC/preload 暴露给渲染层，渲染层由 `AppStore` 统一持有更新状态，并在设置页与左下角提示弹窗中呈现。发布链路改为产出 `latest-mac.yml` 和 blockmap，保证自动更新可工作。

**Tech Stack:** Electron, electron-updater, electron-builder, React 19, Zustand, Sonner, Vitest

---

### Task 1: 补齐发布契约测试

**Files:**
- Modify: `tests/unit/release-config.test.ts`
- Test: `tests/unit/release-config.test.ts`

**Step 1: 写失败测试**

- 断言 `electron-builder.yml` 存在 GitHub publish 配置
- 断言 workflow 上传 `latest-mac.yml`、`*.zip.blockmap`、`*.dmg.blockmap`

**Step 2: 运行测试确认失败**

Run: `pnpm exec vitest run tests/unit/release-config.test.ts`

**Step 3: 保持失败状态，进入后续实现**

### Task 2: 为主进程更新服务写失败测试

**Files:**
- Create: `tests/unit/update-service.test.ts`
- Test: `tests/unit/update-service.test.ts`

**Step 1: 写失败测试**

- 模拟 updater 事件
- 验证 `checking -> available -> downloading -> downloaded`
- 验证错误状态映射
- 验证非法状态下拒绝下载和安装

**Step 2: 运行测试确认失败**

Run: `pnpm exec vitest run tests/unit/update-service.test.ts`

### Task 3: 为 IPC 和 preload 写失败测试

**Files:**
- Modify: `tests/unit/ipc-handlers.test.ts`
- Create: `tests/unit/preload-update-api.test.ts`
- Test: `tests/unit/ipc-handlers.test.ts`
- Test: `tests/unit/preload-update-api.test.ts`

**Step 1: 写失败测试**

- IPC 常量包含更新 channel
- `registerIpcHandlers` 注册更新 handler
- preload 暴露 `getUpdateState`、`checkForUpdates`、`downloadUpdate`、`quitAndInstall`、`onUpdateStateChanged`

**Step 2: 运行测试确认失败**

Run: `pnpm exec vitest run tests/unit/ipc-handlers.test.ts tests/unit/preload-update-api.test.ts`

### Task 4: 为渲染层更新 UI 写失败测试

**Files:**
- Create: `tests/renderer/update-ui.test.tsx`
- Test: `tests/renderer/update-ui.test.tsx`

**Step 1: 写失败测试**

- 设置页在 `idle` 状态显示“检查更新”
- `available` 状态显示“下载更新”
- `downloaded` 状态显示“重启安装”
- 状态变化时触发左下角 toast

**Step 2: 运行测试确认失败**

Run: `pnpm exec vitest run --project renderer tests/renderer/update-ui.test.tsx`

### Task 5: 实现共享类型与主进程更新服务

**Files:**
- Create: `src/shared/update.ts`
- Create: `src/main/update/update-service.ts`
- Modify: `src/main/index.ts`
- Test: `tests/unit/update-service.test.ts`

**Step 1: 写最小实现**

- 定义更新状态类型
- 封装更新服务
- 在主进程中初始化服务并安排延迟检查

**Step 2: 运行测试**

Run: `pnpm exec vitest run tests/unit/update-service.test.ts`

### Task 6: 实现 IPC 与 preload

**Files:**
- Modify: `src/shared/ipc-channels.ts`
- Modify: `src/main/ipc/register-ipc.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/preload/api.d.ts`
- Modify: `src/renderer/src/lib/electron-api.ts`
- Test: `tests/unit/ipc-handlers.test.ts`
- Test: `tests/unit/preload-update-api.test.ts`

**Step 1: 写最小实现**

- 新增 channel
- 暴露更新 handler 和事件订阅
- 渲染层 API 类型同步

**Step 2: 运行测试**

Run: `pnpm exec vitest run tests/unit/ipc-handlers.test.ts tests/unit/preload-update-api.test.ts`

### Task 7: 实现 AppStore、设置页和左下角提示

**Files:**
- Modify: `src/renderer/src/stores/app-store.ts`
- Modify: `src/renderer/src/components/settings-dialog.tsx`
- Create: `src/renderer/src/components/update-toast-listener.tsx`
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/main.tsx`
- Test: `tests/renderer/live-updates.test.tsx`
- Test: `tests/renderer/update-ui.test.tsx`

**Step 1: 写最小实现**

- store 初始化时拉取状态并订阅推送
- 设置页展示更新状态与操作按钮
- toast 仅在关键状态变更时弹出
- Toaster 调整到左下角

**Step 2: 运行测试**

Run: `pnpm exec vitest run --project renderer tests/renderer/live-updates.test.tsx tests/renderer/update-ui.test.tsx`

### Task 8: 更新发布配置

**Files:**
- Modify: `package.json`
- Modify: `electron-builder.yml`
- Modify: `.github/workflows/release-macos.yml`
- Test: `tests/unit/release-config.test.ts`

**Step 1: 写最小实现**

- 增加 `electron-updater`
- builder 配置 GitHub publish
- workflow 上传自动更新所需资产

**Step 2: 运行测试**

Run: `pnpm exec vitest run tests/unit/release-config.test.ts`

### Task 9: 全量验证

**Files:**
- Verify only

**Step 1: 运行单元测试**

Run: `pnpm exec vitest run tests/unit/release-config.test.ts tests/unit/update-service.test.ts tests/unit/ipc-handlers.test.ts tests/unit/preload-update-api.test.ts`

**Step 2: 运行渲染层测试**

Run: `pnpm exec vitest run --project renderer tests/renderer/live-updates.test.tsx tests/renderer/update-ui.test.tsx`

**Step 3: 运行 harness**

Run: `pnpm harness`

**Step 4: 运行完整构建**

Run: `pnpm build`

**Step 5: 运行本地 macOS 打包验证**

Run: `pnpm exec node ./scripts/run-electron-builder.cjs --mac --dir --arm64 --publish never`

**Step 6: 提交**

```bash
git add docs/plans package.json pnpm-lock.yaml electron-builder.yml .github/workflows/release-macos.yml src tests
git commit -m "feat: add macOS auto update flow"
```
