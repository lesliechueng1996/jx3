# 开团（创建 Raid Run）Implementation Plan

- **PRD**: [2026-06-13-raid-create-design.md](../specs/2026-06-13-raid-create-design.md)
- **Date**: 2026-06-13
- **Status**: In progress

## Summary

为**已登录用户**（非 super_admin 专属）实现「我要开团」功能：三栏页面填写 `raid_run`、5×5 站位网格预填 `raid_signup`，支持**手动暂存**草稿与**发布**招募。

### 核心需求

| 区域 | 内容 |
|------|------|
| **左侧表单** | 团队名称、描述、副本（Combobox 模糊搜索）、集合/进本/结束时间、坦克/治疗/DPS/老板预留人数、备注 → `raid_run` |
| **中间网格** | 5×5 = 全队；**每列 = 一个小队**；按预留人数着色；点击选中；每队至多 1 个阵眼 |
| **右侧属性栏** | 按选中格编辑 `raid_signup`：角色名、服务器、门派、心法、团长/黑本/阵眼、备注；`userId` V1 不展示 |
| **保存流程** | 进入 `/raids/create` **不**调 API；点「暂存」→ 首次 `POST` 创建 `pending` 草稿并跳转 `$raidRunId`；再次「暂存」→ `PATCH`；点「发布开团」→ `recruiting` |
| **鉴权** | 继承 `_app` session；业务 API 均为 `auth: true` |

### 已确认产品决策

1. 5×5 = 全队；**每列 = 一个小队**（5 队）；`groupNumber` = 列/小队（1 左 → 5 右），`positionNumber` = 队内行位（1 上 → 5 下）
2. 预留合计 < 25 时，剩余格为 `pending` + 中性色
3. **手动暂存**，无自动保存；进入页面不创建草稿
4. 发布后无详情页，停留当前页 + toast
5. 改预留人数时，已填团员信息保留，仅更新 `role` 与颜色
6. **每个小队至多 1 个阵眼**（`isFormationCore`，同列互斥）
7. V1 不做：角色导入、详情页、已发布团编辑、报名审核、金团/掉落

### 站位角色分配（视觉网格：左→右、上→下）

`reservedDps` → `reservedHealer` → `reservedTank` → `reservedBoss` → 剩余 `pending`；四者之和 ≤ 25。

---

## Architecture

```
/raids/create（本地 state）
  └─ 暂存 ──► POST /api/v1/raid-runs ──► /raids/create/$id

/raids/create/$id（loader 拉草稿）
  ├─ 暂存 ──► PATCH /api/v1/raid-runs/:id
  ├─ 发布 ──► PATCH（若有脏数据）──► POST /api/v1/raid-runs/:id/publish
  └─ 参考数据（已开放给登录用户）：
       GET /api/v1/dungeons?name=
       GET /api/v1/game-servers
       GET /api/v1/schools/options
       GET /api/v1/kungfu/options?schoolId=
```

**Tech stack:** Bun, Elysia, Drizzle (`raid_run` / `raid_signup` 表已存在，无需 migration), TanStack Start + React Query, shadcn/ui, zod.

---

## File Structure

### API（待建）

| File | Purpose |
|------|---------|
| `apps/api/src/schemas/raid-runs.ts` | Request/response zod schemas |
| `apps/api/src/services/raid-runs.ts` | Create/patch/publish、role 重算、signup 推导、权限校验 |
| `apps/api/src/routes/raid-runs.ts` | `POST` / `GET` / `PATCH` / `POST .../publish` |
| `apps/api/src/app.ts` | Register `raidRunsRoute` |
| `apps/api/tests/services/raid-runs.test.ts` | Service unit tests |
| `apps/api/tests/routes/raid-runs.test.ts` | Route tests via `app.handle()` |

### Web（待建）

| File | Purpose |
|------|---------|
| `apps/web/src/lib/api/raid-runs-api.ts` | Client API + query keys |
| `apps/web/src/lib/api/game-reference-api.ts` | 副本/服务器/门派/心法只读查询（非 admin 路径） |
| `apps/web/src/routes/_app/raids/create/index.tsx` | 新建模式（本地 state） |
| `apps/web/src/routes/_app/raids/create/$raidRunId/index.tsx` | 草稿模式 loader |
| `apps/web/src/routes/_app/raids/create/-components/*` | 三栏 UI、schema、role-slot-utils |
| `apps/web/tests/routes/_app/raids/create/*` | Vitest 单元测试 |

### 参考数据 API（已完成）

| 变更 | 状态 |
|------|------|
| `GET /api/v1/dungeons` → `auth: true` | [x] |
| `GET /api/v1/game-servers` → `auth: true` | [x] |
| `GET /api/v1/schools/options` → `auth: true` | [x] |
| `GET /api/v1/kungfu/options?schoolId=` 新增 | [x] |

---

## Tasks

### Phase 1: API — raid-runs

- [ ] **1.1** `schemas/raid-runs.ts`：SignupInput、create/patch body、response、publish 校验 schema
- [ ] **1.2** `services/raid-runs.ts`：
  - `computeSlotRoles(reserved*)` 纯函数（与前端共享逻辑或镜像测试）
  - `deriveSignupFields(role, characterName)` → `status` / `isReserved`
  - `createRaidRunDraft`：事务插入 1 run + 25 signups
  - `patchRaidRunDraft`：仅 `status=pending` + `createdBy` 校验
  - `publishRaidRun`：全量校验后 `status=recruiting`（含每队阵眼 ≤1、全团团长 ≤1）
- [ ] **1.3** `routes/raid-runs.ts`：四个端点，`auth: true`，Swagger `Raids` tag
- [ ] **1.4** 注册到 `app.ts`
- [ ] **1.5** 测试：401、403 非创建者、409 非 pending、400 校验失败、201/200  happy path

### Phase 2: Web — 基础与工具

- [ ] **2.1** `role-slot-utils.ts`：25 格初始 state、role 重算、Tailwind 颜色映射
- [ ] **2.2** `raid-run-form-schema.ts`：草稿宽松校验 + 发布严格校验（zod）
- [ ] **2.3** `raid-signup-draft.ts`：Signup 草稿类型与 update helpers
- [ ] **2.4** `raid-runs-api.ts` + `game-reference-api.ts`
- [ ] **2.5** Vitest：`role-slot-utils`、`raid-run-form-schema`

### Phase 3: Web — UI 组件

- [ ] **3.1** `RaidRunFormComponent`：左侧表单 + 副本 Combobox（`GET /dungeons?name=`）
- [ ] **3.2** `RaidGridComponent`：5×5 可点击网格（列 = 小队，列头可选标注）；选中态、角色色
- [ ] **3.3** `SignupPanelComponent`：右侧属性栏；服务器/门派/心法下拉；团长全团互斥、**阵眼同列互斥**
- [ ] **3.4** `CreateRaidComponent`：三栏布局、state 管理、暂存/发布 mutation、脏数据检测
- [ ] **3.5** 路由：`create/index.tsx`（新建）、`create/$raidRunId/index.tsx`（loader + 草稿）
- [ ] **3.6** 页脚：[暂存] [发布开团]；未暂存时发布 disabled + 提示

### Phase 4: 集成与 polish

- [ ] **4.1** 暂存成功：toast「已暂存」；新建模式 navigate 到 `$raidRunId`
- [ ] **4.2** 发布成功：toast「开团已发布」；按钮态更新（已发布不可再 PATCH）
- [ ] **4.3** 错误处理：ApiRequestError → Sonner；reserved 合计 > 25 内联提示
- [ ] **4.4** 组件测试：网格选中、发布 disabled 逻辑（可选 `beforeunload` 提示）

---

## API Contract（Quick Reference）

| Method | Path | 用途 |
|--------|------|------|
| `POST` | `/api/v1/raid-runs` | 首次暂存，创建 `pending` + 25 signups |
| `GET` | `/api/v1/raid-runs/:id` | 加载草稿 |
| `PATCH` | `/api/v1/raid-runs/:id` | 再次暂存 |
| `POST` | `/api/v1/raid-runs/:id/publish` | 发布 → `recruiting` |

发布必填：`name`、`dungeonId`、`startTime`、四个 reserved（合计 ≤25）。

---

## Verification

```bash
# API
bun run --filter @jx3/api check
bun run --filter @jx3/api typecheck
bun run --filter @jx3/api test

# Web
bun run --filter @jx3/web check
bun run --filter @jx3/web typecheck
bun run --filter @jx3/web test
```

### Manual test checklist

- [ ] 未登录访问 `/raids/create` → 跳转登录
- [ ] `/raids/create` 填写表单与网格，未暂存前刷新 → 数据丢失（预期）
- [ ] 点「暂存」→ 跳转 `/raids/create/$id`，DB 有 1 run + 25 signups，`status=pending`
- [ ] 修改预留人数 → 格子颜色变化，已填角色名保留
- [ ] 同列勾选两个阵眼 → 后者取消前者 / 暂存或发布报错
- [ ] 再次「暂存」→ PATCH 成功
- [ ] 未暂存时「发布开团」disabled
- [ ] 发布缺字段 → 错误提示；填全后发布 → `recruiting` + toast
- [ ] 普通用户（非 admin）可使用副本/服务器/门派/心法下拉

---

## Out of Scope (P1+)

- 开团详情页、`/raids/history` 联动
- 从「我的角色」导入
- 已发布团编辑、取消、报名审核
- 金团字段、`raid_loot`、`gameRaidId`
