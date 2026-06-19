# 参团记录与已发布团编辑功能设计 (PRD)

- **Date**: 2026-06-19
- **Status**: Approved
- **Scope**: 参团记录页 `/raids/history`、我的开团列表 API、已发布团编辑（`recruiting` / `ongoing`）
- **Depends on**: [2026-06-13-raid-create-design.md](./2026-06-13-raid-create-design.md)

---

## 1. 背景与目标

用户需要在一个面向客户端的页面查看自己参与过的团队，并按「全部 / 我创建的 / 我是团长」筛选。列表采用卡片式布局（非 Table），适合移动端浏览。

创建者点击卡片应进入开团编辑页继续管理团队。本期一并实现 **已发布团（`recruiting`、`ongoing`）的可编辑保存**，不再只读。

### 1.1 目标

- 参团记录页：筛选 + 卡片时间线列表 + 空状态
- `GET /api/v1/raid-runs/mine`：按筛选返回当前用户的开团/参团摘要
- 创建者卡片 → `/raids/create/$raidRunId`
- 已发布团编辑：`recruiting` / `ongoing` 状态可 PATCH；UI 解除只读，保存按钮文案为「保存」
- 终态团（`completed` / `cancelled`）进入编辑页为只读，顶部提示不可编辑

### 1.2 非目标（本期）

- 参团详情页（非创建者点击卡片）
- 团状态流转（取消、标记完成、ongoing 自动切换等）
- 金团字段、掉落、`gameRaidId`
- 团员自助报名 / 审核流程
- 列表分页（首版一次返回合理上限，见 §6）
- DB migration（沿用现有 schema；可选后续加 `raid_signup.user_id` 索引）

---

## 2. 已确认产品决策

| # | 问题 | 决策 |
|---|------|------|
| 1 | 草稿是否出现在「全部 / 我是团长」 | **否**。草稿仅出现在「我创建的」 |
| 2 | 「全部」范围 | `status ≠ pending`，且（`created_by = 当前用户` **或** `raid_signup.user_id = 当前用户`） |
| 3 | 「我是团长」范围 | 同 #2，且对应 signup `is_leader = true` |
| 4 | 「我创建的」范围 | `raid_run.created_by = 当前用户`，**含** `pending` 草稿 |
| 5 | 创建者点击卡片 | 跳转 `/raids/create/$raidRunId` |
| 6 | 非创建者点击卡片 | V1 不跳转（卡片无 `cursor-pointer` / 无链接） |
| 7 | 已发布团是否可编辑 | **是**。`recruiting`、`ongoing` 可保存；`completed`、`cancelled` 只读 |
| 8 | 列表布局 | 卡片流，按 `startTime` 降序；`ongoing` / `recruiting` 可选置顶（实现简单则做） |
| 9 | 列表项是否带 25 格 signups | **否**。仅摘要字段 + `mySignup` 摘要 |

---

## 3. 页面设计

### 3.1 路由与结构

- 路由：`apps/web/src/routes/_app/raids/history/index.tsx`（薄入口）
- 容器：`history/-components/RaidHistoryComponent.tsx`
- 展示：`history/-components/RaidHistoryCardComponent.tsx`
- 筛选状态：URL search param `filter=all|created|leader`（默认 `all`），便于刷新与分享

### 3.2 筛选栏

三个 pill 按钮（shadcn `Button` outline / default 切换）：

| 值 | 文案 |
|----|------|
| `all` | 全部 |
| `created` | 我创建的 |
| `leader` | 我是团长 |

切换时更新 search param 并 refetch。

### 3.3 卡片内容

每张卡片（shadcn `Card`，`size="sm"`）：

| 区域 | 内容 |
|------|------|
| 左侧色条 | 按 `status` 着色：`pending`=muted、`recruiting`=chart-2、`ongoing`=primary、`completed`=muted-foreground、`cancelled`=destructive/30 |
| 主标题 | 副本名 `dungeonName`（API join） |
| 副标题 | 团名 `name` |
| 时间 | 进本时间 `startTime`；有 `gatherTime` 时次要行显示「集合 · …」 |
| Badge 行 | 状态中文 + `isCreator` →「创建者」+ `mySignup.isLeader` →「团长」+ 职责（坦克/治疗/DPS/老板） |
| 可选 | `mySignup.characterName` + 服务器名（有则显示） |
| 交互 | **仅 `isCreator`**：整卡可点，`Link` 到 `/raids/create/$id`，右侧 ChevronRight |

状态中文映射：

| status | 文案 |
|--------|------|
| `pending` | 草稿 |
| `recruiting` | 招募中 |
| `ongoing` | 进行中 |
| `completed` | 已完成 |
| `cancelled` | 已取消 |

### 3.4 空状态

| filter | 文案 |
|--------|------|
| `all` | 暂无参团记录 |
| `created` | 还没有创建过团队；可前往「我要开团」 |
| `leader` | 暂无担任团长的记录 |

「我创建的」空状态可提供链到 `/raids/create` 的按钮。

### 3.5 加载与错误

- 加载：3–5 个卡片骨架（`animate-pulse` 矩形）
- 错误：简短说明 + 「重试」按钮（`refetch`）

---

## 4. 已发布团编辑（扩展现有开团页）

### 4.1 可编辑状态矩阵

| status | 表单/网格 | 保存按钮 | 发布按钮 |
|--------|-----------|----------|----------|
| `pending` | 可编辑 | 「暂存」 | 可用（现有逻辑） |
| `recruiting` | 可编辑 | 「保存」 | 隐藏（已发布） |
| `ongoing` | 可编辑 | 「保存」 | 隐藏 |
| `completed` | 只读 | 隐藏 | 隐藏 |
| `cancelled` | 只读 | 隐藏 | 隐藏 |

只读时在页面标题下显示 `Alert` 风格条：「该团已结束，不可编辑」。

### 4.2 前端逻辑调整（`CreateRaidComponent`）

替换单一 `isPublished = status !== 'pending'`：

```ts
const isDraft = status === 'pending';
const isEditable = ['pending', 'recruiting', 'ongoing'].includes(status);
const isTerminal = ['completed', 'cancelled'].includes(status);
```

- `disabled={!isEditable}` 用于表单、网格、团员面板
- 保存：`isEditable && isDirty && canSave`；pending 用现有 draft schema，已发布用现有 publish schema（与发布校验一致）
- 离开页未保存提示：`isDirty && isEditable`
- 页面标题：从参团记录进入时可保持「我要开团」或 subtitled 显示团名（V1 保持现有标题即可）

### 4.3 后端 PATCH 调整

`patchRaidRunDraft`（可重命名为 `patchRaidRun` 或保留名称仅扩展行为）：

1. `assertOwner` 不变
2. 替换 `assertPending` 为 `assertEditable`：允许 `pending` | `recruiting` | `ongoing`；否则 `409 CONFLICT`
3. 校验：
   - `pending` → 现有 draft 校验（`validateDraftSignups` + 宽松 run 字段）
   - `recruiting` / `ongoing` → 合并更新后的 run 字段后执行 `validatePublishRun`（与发布同等严格）
4. **Signup 合并**：PATCH 替换 signups 时，按 `(groupNumber, positionNumber)` 从旧记录保留 `userId`、`status`（若存在），避免清掉已关联用户；`userId` 仍由服务端维护，客户端 payload 不含该字段
5. `status` 字段 **不可** 通过 PATCH 修改

`getRaidRunDraft`（GET 单条）：创建者仍可读取任意状态的团（现有 `assertOwner` 已满足参团记录跳转）。

### 4.4 API 文档

更新 PATCH route `detail.description`：说明 pending 草稿与已发布团均可由创建者更新。

---

## 5. 列表 API

### 5.1 端点

```
GET /api/v1/raid-runs/mine?filter=all|created|leader
```

- Auth：必须登录
- 默认 `filter=all`

### 5.2 查询逻辑

**`created`**

```sql
WHERE raid_run.created_by = :userId
ORDER BY start_time DESC
LIMIT 100
```

**`all`**

```sql
FROM raid_run
LEFT JOIN raid_signup
  ON raid_signup.raid_run_id = raid_run.id
 AND raid_signup.user_id = :userId
WHERE raid_run.status != 'pending'
  AND (raid_run.created_by = :userId OR raid_signup.user_id = :userId)
ORDER BY raid_run.start_time DESC
LIMIT 200
```

去重：同一 `raid_run.id` 只返回一条（用户理论上单团单 signup；若多格关联取 `is_leader` 优先，否则任一条）。

**`leader`**

在 `all` 条件上增加 `raid_signup.is_leader = true`。

### 5.3 响应 schema

```ts
listMyRaidRunsQuerySchema = z.object({
  filter: z.enum(['all', 'created', 'leader']).default('all'),
});

raidRunListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: raidRunStatusSchema,
  dungeonId: z.string().uuid().nullable(),
  dungeonName: z.string().nullable(),
  gatherTime: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  createdAt: z.string(),
  isCreator: z.boolean(),
  mySignup: z
    .object({
      role: raidSignupRoleSchema,
      status: raidSignupStatusSchema,
      isLeader: z.boolean(),
      characterName: z.string().nullable(),
      serverId: z.string().uuid().nullable(),
      serverName: z.string().nullable(),
    })
    .nullable(),
});

listMyRaidRunsResponseSchema = z.object({
  items: z.array(raidRunListItemSchema),
});
```

- `isCreator`: `created_by === userId`
- `mySignup`: 当前用户在该团的 signup 摘要；创建者若无 `userId` 关联则为 `null`（卡片仍显示「创建者」Badge）
- `dungeonName` / `serverName`：服务端 join `game_dungeon` / `game_server`

### 5.4 排序增强（可选）

Primary sort：状态权重 `ongoing` > `recruiting` > 其他，secondary：`startTime DESC`。

---

## 6. Web API 客户端

新增 `apps/web/src/lib/api/raid-runs-api.ts` 扩展：

```ts
listMine(filter: 'all' | 'created' | 'leader')
raidRunsMineQueryKey = ['raid-runs', 'mine'] as const
```

`RaidHistoryComponent` 使用 `useQuery` + filter in queryKey。

---

## 7. 测试

### 7.1 API service（`apps/api/tests/services/raid-runs.test.ts`）

- `listMyRaidRuns`：三种 filter 各一条；草稿仅出现在 `created`
- `patchRaidRunDraft`：`recruiting` 可 PATCH；`completed` 返回 409
- 已发布 PATCH 使用 publish 级校验（缺 name 失败）
- PATCH signups 保留已有 `userId`

### 7.2 API route（`apps/api/tests/routes/raid-runs.test.ts`）

- `GET /mine` 401/200
- query filter 校验

### 7.3 Web

- `raid-runs-api` listMine 解析
- 可选：筛选 pill 与空状态 snapshot（轻量）

---

## 8. 文件清单（实现参考）

| 层 | 文件 |
|----|------|
| API schema | `apps/api/src/schemas/raid-runs.ts` |
| API service | `apps/api/src/services/raid-runs.ts` |
| API route | `apps/api/src/routes/raid-runs.ts` |
| Web API | `apps/web/src/lib/api/raid-runs-api.ts` |
| 页面 | `apps/web/src/routes/_app/raids/history/index.tsx` |
| 组件 | `history/-components/RaidHistoryComponent.tsx`, `RaidHistoryCardComponent.tsx` |
| 编辑页 | `apps/web/src/routes/_app/raids/create/-components/CreateRaidComponent.tsx` |

---

## 9. 风险与依赖

- 无 DB migration；`user_id` 无索引时列表查询依赖数据量，首版 `LIMIT 100` 可接受
- 已发布 PATCH 删除重建 signups 时须合并 `userId`/`status`，否则未来报名数据会被 wipe
- `completed` / `cancelled` 从「我创建的」仍可进入查看，但不可改 — 需在 UI 明确提示

---

## 10. 参考

- `packages/db/src/schema/raid-run.ts`
- `packages/db/src/schema/raid-signup.ts`
- `apps/web/src/routes/_app/raids/history/index.tsx`
- `apps/web/src/routes/_app/raids/create/$raidRunId/index.tsx`
