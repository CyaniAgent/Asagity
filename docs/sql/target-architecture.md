# 目标架构

## 目标公式

```
PostgreSQL (+ pgvector + CJK 分词器) + Valkey + River + 自研混合检索层
```

- **River 正位**：任务队列（向量管线的发动机），不是向量插件。
- **pgvector 正位**：向量插件（语义腿），裸上，优化储备。
- **Valkey 正位**：Redis 的许可洁净版 drop-in。
- **自研层正位**：混合检索融合 + scope 权限过滤，不重复造存储。

## 数据流向

```
写：note.created → River job → embedding worker → pgvector（+ 原表）
查：query → [关键词腿 ‖ 向量腿] → scope 先行过滤 → RRF 融合 → 返回
```

- scope 过滤必须在融合**之前**（别把无权内容融进来再丢）。
- RRF 取 Top-N 双腿候选再融；rerank 为后期项。

## 三块硬骨头

### 1. pgvector 优化（储备，不先做）
- 手段：binary quantization、表分区、纵向加内存；代价：构建慢、吃 RAM。
- 触发线：向量规模逼近单机 HNSW 内存之前都不动。

### 2. CJK 关键词腿（最大坑）
- 扔掉 Bleve 则中文分词必须有去处：PG 侧 `zhparser`（SCWS）或 `pg_jieba`（Pleroma 同为联邦项目，有先例）。
- Bleve 现有 CJK/拼音工作别直接扔：**第一阶段保留 Bleve 跑关键词腿**，自研层只做 RRF 融合；关键词腿迁 PG FTS 是第二步。

### 3. embedding 管线（唯一没有现成答案的一项）
- 待定：多语言模型选型（CJK 语义必需）、推理位置（sidecar / 外部 API）、延迟与成本。
- 该项不定，语义腿不开工；关键词腿 + RRF 架子可先行。
