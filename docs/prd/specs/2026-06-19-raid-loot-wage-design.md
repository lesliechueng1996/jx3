# 开团掉落与工资记录设计

- **Date**: 2026-06-19
- **Status**: Approved
- **Scope**: `/raids/create/$id` 编辑页 — 重要掉落列表、添加/编辑掉落、记录工资
- **Depends on**: [2026-06-19-raid-history-design.md](./2026-06-19-raid-history-design.md)

---

## 1. 产品决策

| # | 决策 |
|---|------|
| 1 | 掉落/工资在 `ongoing`、`completed` 可编辑 |
| 2 | 人均工资：填总收入后自动 ÷ 有效人数，可手动覆盖 |
| 3 | 中间栏上下分区：上团队布局，下重要掉落 |
| 4 | 添加掉落时获得者、成交价可选，后续可编辑 |
| 5 | 物品不在库时可当场创建（最小字段：name / type / quality） |

---

## 2. 页面布局

左中右三栏不变。中间栏 `flex flex-col gap-4`：

- **上**：团队布局（`RaidGridComponent`）
- **下**：重要掉落（`LootPanelComponent`）— 标题栏含「记录工资」「添加掉落」

---

## 3. 权限

| 状态 | 布局/团员 | 掉落/工资 |
|------|-----------|-----------|
| pending / recruiting | 可编辑 | 只读 |
| ongoing | 可编辑 | 可编辑 |
| completed | 只读 | 可编辑 |
| cancelled | 只读 | 只读 |

---

## 4. API

```
GET  /api/v1/raid-runs/:id          → 扩展 totalIncome, wagePerPerson, loot[]
POST /api/v1/raid-runs/:id/loot
PATCH /api/v1/raid-runs/:id/loot/:lootId
DELETE /api/v1/raid-runs/:id/loot/:lootId
PATCH /api/v1/raid-runs/:id/wage
GET  /api/v1/game-items/search?q=
POST /api/v1/game-items
```

Loot 变更与工资 PATCH 独立于主表单 PATCH，不走 dirty 状态。

---

## 5. 有效人数

有 `characterName` 的 signup 数量，用于人均工资自动计算与获得者下拉。
