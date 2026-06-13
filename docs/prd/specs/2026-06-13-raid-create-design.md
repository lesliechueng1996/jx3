# 开团（创建 Raid Run）功能设计 (PRD)

- **Date**: 2026-06-13
- **Status**: Approved
- **Scope**: 登录用户创建开团（`raid_run` + `raid_signup`），页面 `/raids/create`
- **Route**: 已有占位页 `apps/web/src/routes/_app/raids/create/index.tsx`

---

## 1. 背景与目标

团长在 Web 端完成「开团信息填写 + 25 人团队布局布局 + 预填部分团员」，数据写入 `raid_run` 与 `raid_signup`。面向**所有已登录用户**，沿用 `_app` session 校验。

### 1.1 目标

- 三栏布局：左侧开团表单、中间 5×5 团队布局表、右侧选中格子的团员属性面板。
- 根据预留人数（DPS / 治疗 / 坦克 / 老板）自动分配 25 格角色类型与背景色。
- 团长可预填部分格子团员信息（`raid_signup` 字段）。
- 副本名称模糊搜索 API（Combobox）。
- **草稿模式**：用户点「暂存」手动保存；首次暂存才创建 `pending` 草稿并跳转；完成后点「发布」→ `recruiting`。

### 1.2 非目标（V1）

- 开团详情页、已发布团的编辑、取消/其他状态流转。
- 团员自助报名、审核流程、候补队列。
- 金团记账、掉落分配、`gameRaidId` 同步。
- 从「我的角色」导入团员。
- 移动端专属布局（V1 桌面宽屏为主）。

---

## 2. 已确认产品决策

| # | 问题 | 决策 |
|---|------|------|
| 1 | 坐标与队伍结构 | 5×5 = 全队 25 人；**每列 = 一个小队**（共 5 队）；`groupNumber` = 小队/列（1 左 → 5 右）；`positionNumber` = 队内行位（1 上 → 5 下） |
| 2 | 预留合计 < 25 | 剩余格 `role = pending`，中性色 |
| 3 | 状态与保存 | 进入页面**不**创建草稿；点「暂存」→ `POST` 创建 `pending` 并跳转；已有草稿点「暂存」→ `PATCH`；「发布」→ `recruiting` |
| 4 | 发布后跳转 | V1 无详情页；发布后停留当前页 + toast |
| 5 | `userId` 字段 | V1 **不在 UI 暴露**（见 §2.1 说明） |
| 6 | 角色导入 | V1 不做 |
| 7 | 改预留人数 | 格子职能变化时，**已填团员信息保留**（角色名、服务器等不清空） |
| 8 | 阵眼 | 每个小队（列）**至多 1 个** `isFormationCore` |

---

## 3. 数据模型映射

### 3.1 `raid_run`（左侧表单）

| UI 字段 | DB 列 | 草稿保存 | 发布必填 |
|---------|-------|----------|----------|
| 团队名称 | `name` | 可选 | 是 |
| 描述 | `description` | 可选 | 否 |
| 关联副本 | `dungeonId` | 可选 | 是 |
| 集合时间 | `gatherTime` | 可选 | 否 |
| 进本时间 | `startTime` | 可选 | 是 |
| 预计结束时间 | `endTime` | 可选 | 否 |
| 坦克/治疗/DPS/老板人数 | `reservedTank` 等 | 可选（默认 0） | 是（≥0，合计 ≤25） |
| 备注 | `remark` | 可选 | 否 |

**服务端自动：**

| 列 | 规则 |
|----|------|
| `createdBy` | 当前用户 |
| `status` | 创建时 `pending`；发布 → `recruiting` |
| `gameRaidId` / 金团字段 | V1 留空 |

### 3.2 `raid_signup`（网格 + 右侧面板）

| UI | DB 列 | V1 UI |
|----|-------|-------|
| 行 / 列 | `groupNumber`, `positionNumber` | 只读（由网格决定） |
| 职能（算法分配） | `role` | 只读 Badge |
| 角色名 | `characterName` | Input |
| 服务器 | `serverId` | Combobox |
| 门派 | `schoolId` | Select |
| 心法 | `kungfuId` | Select（依赖门派） |
| 是否团长 / 黑本 / 阵眼 | `isLeader`, `isDarkRun`, `isFormationCore` | Checkbox |
| 备注 | `remark` | Textarea |
| **关联用户** | `userId` | **V1 不展示** |
| 报名状态 | `status` | 服务端推导 |
| 是否预留位 | `isReserved` | 服务端推导 |

#### 关于 `userId`（问题 5 的说明）

`userId` 是 `raid_signup` 表上的字段，表示**该格子对应的真实登录用户**（例如团员自己报名后关联账号）。与 `characterName`（游戏内角色名）不同：

- V1 团长手动预填时用角色名 + 服务器等即可，`userId` 留空。
- 后续「团员自助报名」流程再写入 `userId`。
- 因此 V1 右侧属性栏**不出现**该字段。

**V1 不在 UI 暴露的 signup 字段：** `userId`、`raidRunId`、`createdBy`、坐标、`status`、`isReserved`（均由服务端维护）。

---

## 4. 团队布局网格规则

### 4.1 布局与队伍结构

- **5 行 × 5 列 = 25 格**，表示整个团队的全部团队布局。
- **每一列 = 一个小队**（`groupNumber`，共 5 个小队）；列从左到右编号 1 → 5。
- **每一行 = 队内纵向位置**（`positionNumber`）；行从上到下编号 1 → 5。
- 单元格坐标：`(groupNumber, positionNumber)` = 第 N 队、队内第 M 位。

```
         小队1    小队2    小队3    小队4    小队5
       (g=1)    (g=2)    (g=3)    (g=4)    (g=5)
p=1    [  ]     [  ]     [  ]     [  ]     [  ]
p=2    [  ]     [  ]     [  ]     [  ]     [  ]
p=3    [  ]     [  ]     [  ]     [  ]     [  ]
p=4    [  ]     [  ]     [  ]     [  ]     [  ]
p=5    [  ]     [  ]     [  ]     [  ]     [  ]
```

- 职能着色遍历顺序不变：**从左到右、从上到下**（先 `positionNumber=1` 的 5 列，再 `positionNumber=2`…）。

### 4.2 角色分配

1. 前 `reservedDps` 格 → `dps`
2. 接着 `reservedHealer` → `healer`
3. 接着 `reservedTank` → `tank`
4. 接着 `reservedBoss` → `boss`
5. 剩余 → `pending`

约束：`reservedDps + reservedHealer + reservedTank + reservedBoss ≤ 25`。超出时阻止保存并提示。

### 4.3 配色

| role | 样式 |
|------|------|
| `dps` | 蓝色 |
| `healer` | 绿色 |
| `tank` | 红色 |
| `boss` | 灰色 |
| `pending` | 中性 `bg-muted` |

### 4.4 修改预留人数（问题 7）

举例：原先 10 个 DPS 位，你在其中 3 格填了角色名；把 DPS 改成 8 后，最后 2 个原 DPS 格会变成治疗/坦克/pending，**但这 3 格已填的角色名、服务器等信息仍然保留**，仅 `role` 与颜色更新。

若合计 > 25：不允许保存预留人数，直到改回合法值。

### 4.5 阵眼（`isFormationCore`）

- 每个小队（同一 `groupNumber` / 同一列）**最多 1 人**可勾选阵眼。
- 客户端：在某格勾选「是否阵眼」时，清除**同列**其他格的 `isFormationCore`（与团长全团互斥类似，但作用域为列）。
- 服务端：暂存 / 发布时校验，每个 `groupNumber` 下至多 1 条 `isFormationCore = true`；违反 → 400。
- UI 可选：列头显示小队编号（如「1 队」…「5 队」），便于辨认。

---

## 5. 暂存、草稿与发布流程

### 5.1 生命周期

```
进入 /raids/create（纯本地编辑，不调 API）
    │
    │  编辑左侧 / 中间 / 右侧（React state）
    ▼
点击「暂存」──► POST 创建草稿 (status=pending) + 当前全部数据
    │              redirect → /raids/create/$raidRunId
    ▼
继续编辑 ──► 点击「暂存」──► PATCH 更新草稿
    │
    ▼
点击「发布开团」──► POST publish（全量校验）──► status=recruiting + toast
```

**两种页面模式：**

| 模式 | 路由 | 数据来源 | 暂存行为 |
|------|------|----------|----------|
| 新建 | `/raids/create` | 本地 state（默认 25 格） | `POST /api/v1/raid-runs` → 跳转 |
| 编辑草稿 | `/raids/create/$raidRunId` | loader 拉取服务端 | `PATCH /api/v1/raid-runs/:id` |

### 5.2 暂存（手动保存）

- **按钮**：页脚 **暂存**（secondary）；与「发布开团」并列。
- **触发**：仅用户点击，**无** debounce / 自动保存。
- **请求体**：当前 run 全部字段 + 完整 25 条 signups（含 role 重算结果）。
- **反馈**：loading 态禁用按钮；成功 toast「已暂存」；新建模式成功后 `navigate` 到 `$raidRunId`；失败 toast，保留本地编辑内容。
- **草稿校验（宽松）**：允许 name、dungeonId、startTime 等为空；**reserved 合计 ≤25** 须满足；外键 ID 若填写则须合法。
- **未暂存离开**：在 `/raids/create` 本地模式下刷新或离开会丢失数据；可选 V1 用 `beforeunload` 提示（非必须）。

### 5.3 发布

- 按钮：**发布开团**（与暂存独立）。
- **前置条件**：须已暂存过（存在 `$raidRunId`）；在 `/raids/create` 本地模式下若未暂存，发布按钮 disabled，提示「请先暂存」。
- **未保存变更**：若编辑草稿后有未 PATCH 的本地修改，发布前须先暂存，或发布接口接受全量 body 一并写入（V1 建议：**发布前强制 PATCH 最新数据**，或 publish 接受 optional body 同步写入；实现时二选一，推荐 publish 前先调用 PATCH）。
- **严格校验**：
  - `name`、`dungeonId`、`startTime` 必填
  - 四个 reserved 必填且合计 ≤25
  - 时间：`gatherTime ≤ startTime`（若填 gather）；`startTime < endTime`（若填 end）
  - signup role 与 reserved 算法一致；`isLeader` 至多 1 个（全团）
  - 每个 `groupNumber`（小队/列）`isFormationCore` 至多 1 个
- 成功：`status → recruiting`，toast「开团已发布」，**停留当前页**（V1 无详情页）。
- 失败：toast + 字段级错误提示。

### 5.4 权限

- 仅 `createdBy === 当前用户` 可 PATCH / publish。
- `status !== 'pending'` 时 PATCH 返回 409（V1 不支持改已发布团）。

---

## 6. 页面结构

```
┌──────────────────────────────────────────────────────────────────┐
│ 我要开团                                                         │
├──────────────┬────────────────────────────┬──────────────────────┤
│ RaidRun 表单 │ 5×5 RaidGrid               │ Signup 属性面板      │
│              │                            │                      │
│              │                            │                      │
├──────────────┴────────────────────────────┴──────────────────────┤
│                          [暂存]  [发布开团]                     │
└──────────────────────────────────────────────────────────────────┘
```

### 6.1 路由

| 路径 | 说明 |
|------|------|
| `GET /raids/create` | 本地新建页，不调用创建 API |
| `GET /raids/create/$raidRunId` | 编辑已暂存草稿（loader 拉取 run + signups） |

### 6.2 组件

```
routes/_app/raids/create/
  index.tsx                    # 本地模式 CreateRaidComponent
  $raidRunId/
    index.tsx                  # loader + CreateRaidComponent（draft 模式）
  -components/
    CreateRaidComponent.tsx    # 容器：mode、暂存/发布 mutation
    RaidRunFormComponent.tsx
    RaidGridComponent.tsx
    SignupPanelComponent.tsx
    raid-run-form-schema.ts
    raid-signup-draft.ts
    role-slot-utils.ts
```

---

## 7. API 设计

全部 `auth: true`。

### 7.1 创建草稿（首次暂存）

```
POST /api/v1/raid-runs
Body: {
  name?: string;
  description?: string | null;
  dungeonId?: string | null;
  gatherTime?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  reservedTank?: number;
  reservedHealer?: number;
  reservedDps?: number;
  reservedBoss?: number;
  remark?: string | null;
  signups: Array<SignupInput>;   // 必填，恰好 25 条
}
Response 201: { id, status: 'pending', signups: [...], ... }
```

- 用户点击「暂存」时调用；写入当前表单与网格全部内容。
- `status = pending`；`createdBy` = 当前用户。
- 校验规则同 §5.2（宽松草稿校验）。

### 7.2 获取草稿

```
GET /api/v1/raid-runs/:id
Response 200: { ...run, signups: [...] }
```

- 404 不存在；403 非创建者。

### 7.3 更新草稿（再次暂存）

```
PATCH /api/v1/raid-runs/:id
Body: {
  name?: string;
  description?: string | null;
  dungeonId?: string | null;
  gatherTime?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  reservedTank?: number;
  reservedHealer?: number;
  reservedDps?: number;
  reservedBoss?: number;
  remark?: string | null;
  signups?: Array<SignupInput>;  // 可选；若提供须恰好 25 条
}
Response 200: 完整 run + signups
```

- 仅 `status === 'pending'`。
- 提供 `signups` 时：校验坐标覆盖 1-1…5-5；role 与服务端重算一致；推导 `status` / `isReserved`。
- 更新 reserved 时：服务端按算法重算各格 `role`（客户端也应同步重算，请求体携带新 role）。

### 7.4 发布

```
POST /api/v1/raid-runs/:id/publish
Body: {} 
Response 200: { ...run, status: 'recruiting', signups }
```

- 仅 `status === 'pending'`；执行 §5.3 全量校验后更新 status。

### 7.5 副本搜索（复用现有列表接口）

```
GET /api/v1/dungeons?name=<string>&page=1&pageSize=20
```

- 已有 admin 列表接口，**只读 GET 权限已放宽为 `auth: true`**（任意登录用户，含 `user` 角色）。
- `name` 参数：`ILIKE` 模糊匹配，供 Combobox 使用。
- 返回字段含 id、name、difficulty、expansionName、seasonName、playerLimit 等（与 admin 列表一致）。

### 7.6 参考数据（signup 面板，方案 B）

复用现有只读 GET，**权限从 `super_admin` 改为 `auth: true`**；写操作（POST/PATCH/DELETE）仍为 super_admin。

| 接口 | 用途 | 变更 |
|------|------|------|
| `GET /api/v1/game-servers` | 服务器列表（前端可本地过滤） | 权限 → 登录用户 |
| `GET /api/v1/schools/options` | 门派下拉 | 权限 → 登录用户 |
| `GET /api/v1/kungfu/options?schoolId=` | 心法下拉 | **新增**，登录用户 |

**无需**单独新建 `game-data` 路由模块；开团页直接调用上述路径（勿走 admin 专用 mutation 接口）。

### 7.7 Swagger tags

`Raids`、`Dungeons`、`Schools`、`Kungfu`、`GameServers`

---

## 8. 前端数据流

**新建模式** (`/raids/create`):

```
本地 state（默认 25 格）
  ├─ RaidRunForm / RaidGrid / SignupPanel ──onChange──► 更新 state
  ├─「暂存」──► POST /api/v1/raid-runs ──► navigate(/raids/create/$id)
  └─「发布开团」disabled（须先暂存）
```

**草稿模式** (`/raids/create/$raidRunId`):

```
Loader: GET /api/v1/raid-runs/:id ──► 初始化 state
  ├─ 编辑 ──► 更新 state（仅本地，不自动请求）
  ├─「暂存」──► PATCH /api/v1/raid-runs/:id
  └─「发布开团」──► PATCH（若有脏数据）──► POST .../publish ──► toast
```

- React Query：`useQuery` 加载草稿；`useMutation` 用于 POST / PATCH / publish。
- API 模块：`raid-runs-api.ts`；参考数据复用 `GET /api/v1/dungeons`、`/game-servers`、`/schools/options`、`/kungfu/options`（非 admin mutation 路径）。

---

## 9. 业务规则

### 9.1 `isReserved` / signup `status`（服务端推导）

| 条件 | isReserved | signup status |
|------|------------|---------------|
| role ≠ pending 且无 characterName | true | pending |
| 有 characterName | false | confirmed |
| role = pending | false | pending |

### 9.2 时间校验

- 草稿：不强制。
- 发布：见 §5.3。

### 9.3 团长位

- 客户端互斥；服务端 publish 时校验至多 1 个 `isLeader`（全团范围）。

### 9.4 阵眼

- 客户端：同列（同 `groupNumber`）互斥；服务端暂存 / 发布时校验每队至多 1 个 `isFormationCore`。

---

## 10. 后端文件结构

```
apps/api/src/
  routes/raid-runs.ts      # POST, GET, PATCH, POST publish
  schemas/raid-runs.ts
  services/raid-runs.ts   # draft create, patch, publish, authz
  app.ts
  # 参考数据：复用 dungeons-admin / schools-admin / game-servers-admin / kungfu-admin 的只读 GET

apps/api/tests/
  routes/raid-runs.test.ts
  services/raid-runs.test.ts
```

---

## 11. 测试策略

### API

- 401 未登录
- POST 草稿 → 1 run + 25 signups，`pending`
- PATCH 部分字段、PATCH signups、reserved 重算 role
- PATCH 非 pending → 409
- publish 缺字段 → 400；成功 → `recruiting`
- 全团两个 `isLeader` 或同一 `groupNumber` 两个 `isFormationCore` → 400
- 非 createdBy → 403
- publish 后不可 PATCH

### Web

- `role-slot-utils`：分配顺序、改 reserved 保留团员数据
- `raid-run-form-schema`：发布校验 vs 草稿校验
- 暂存：新建 POST + 跳转；草稿 PATCH
- 未暂存时发布按钮 disabled
- 团长互斥（全团）
- 阵眼互斥（同列 / 同小队）

---

## 12. 实施阶段

| 阶段 | 内容 |
|------|------|
| **P0** | 草稿 CRUD API + publish + 副本/参考数据搜索 + 三栏 UI + 手动暂存 + 发布 |
| **P1** | 详情页；从我的角色导入；已发布团编辑 |
| **P2** | 报名审核、参团记录 |

---

## 13. 风险与依赖

- 无 DB migration。
- 参考数据只读 GET 已对登录用户开放（方案 B，见 §7.6）；写操作仍限 super_admin。
- 首次进入 `/raids/create` 未暂存前刷新会丢数据；暂存后 `$raidRunId` URL 可恢复。
- 每次暂存 payload 含 25 条 signups；后续可优化为单格 PATCH。

---

## 14. 参考

- `packages/db/src/schema/raid-run.ts`
- `packages/db/src/schema/raid-signup.ts`
- `packages/db/src/schema/dungeon.ts`
- `apps/api/src/middleware/auth-macro.ts`
- `apps/web/src/routes/_app/route.tsx`
