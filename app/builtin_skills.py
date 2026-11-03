"""Skills the platform ships and installs into the shared, agent-neutral root.

The HR job depends on its process skill the way the web tools depend on their
extension: it is platform behaviour, not user content. Installation is additive —
an existing directory is never overwritten, so an operator edit wins.
"""

from __future__ import annotations

import logging
from pathlib import Path

logger = logging.getLogger(__name__)

OMA_HIRING_NAME = "oma-hiring"

OMA_HIRING_DESCRIPTION = (
    "岗位编制流程。当用户要新建、修改、合并或撤销 Agent 岗位，要判断一个需求该不该单独设岗，"
    "或要做岗位复盘时使用。产出岗位卡并按八个阶段推进：任务盘点、定责、查重、定权、定标、"
    "起草、落地、review。不用于直接产出业务成果。"
)

OMA_HIRING_BODY = """# 岗位编制流程

一个岗位只由四件事定义：**唯一交付物、职责边界、权限最小集、验收标准**。
技能清单不是岗位，人格不是岗位，平台和品牌是参数。缺了交付物与验收，
你在做的不是岗位，是实验。

## 八阶段

每次只推进一个阶段，拿到确认再进入下一个。

### 1. 任务盘点
问 3–5 个问题，一次问完：谁用这份产出；多久要一次；输入是什么；
交给谁看；怎么算做对。输出任务清单给用户确认。

### 2. 定责定岗
把任务聚成 1–3 个候选岗位。每个候选写两行：唯一交付物、明确不接的活。
交付物相同就是同一岗位的变体，不新开岗位。

### 3. 查重
调 `find_agents` 报相似岗位与差异（共享技能、描述相似度、交付物相似度）。
结果必须是三选一：复用已有岗位 / 做成它的变体 / 确认新建。
没有这一步不许进入下一步。

### 4. 定权
调 `list_tools` 和 `find_skills`，给最小权限集。默认不授予 bash、写文件、
出图。能力缺口有三种处理：现造 skill、换方案、接受限制，让用户选。

### 5. 定标
写 3–5 条可判定的验收标准。可判定的意思是：换一个人能照着核对。
"质量高""专业"不算标准。

### 6. 起草 JD
按 `# Role / # Deliverable / # Boundaries / # Routing / # Environment` 五段写，
1200 字以内。`# Routing` 只写 skill 名与一句何时加载，不抄 skill 内容。
至少一条拒绝类边界。写完自己核对一遍再给用户。

### 7. 落地
`create_agent` 带 confirm；有重复时用 duplicate_decision 说明是新建还是变体。
先建 skill 再建岗位时，顺序不能反。

### 8. review
提示首次复盘时间。复盘输入是会话数、成本、验收通过率、与其他岗位的重叠度；
输出只能是四类动作之一：合并、撤岗、重写定义、加编（副本，不是新岗位）。

## 判断口径

- 只有人设或视角不同 → 做成 skill，不做岗位。
- 只有平台或品牌不同 → 同一岗位的变体，用参数或 skill 表达。
- 一份 JD 里出现两个交付物 → 拆成两个岗位，或显式声明借调。
- 岗位 90 天跑不到 3 个会话，且与某岗位技能重叠 ≥ 0.8 → 合并或撤岗。

## 边界

不代写业务内容。用户要成果时指出该由哪个岗位接。
未经确认不写入。删除必须二次确认，并说明该岗位还有多少历史会话。
"""

BUILTIN_SKILLS = {
    OMA_HIRING_NAME: (OMA_HIRING_DESCRIPTION, OMA_HIRING_BODY),
}


def ensure_builtin_skills(agents_home: Path) -> list[Path]:
    """Install missing built-in skills into the shared skills root.

    Returns the directories that exist afterwards so callers can attach only
    skills that are really installed.
    """

    root = Path(agents_home).expanduser() / "skills"
    installed: list[Path] = []
    for name, (description, body) in BUILTIN_SKILLS.items():
        directory = root / name
        skill_file = directory / "SKILL.md"
        if not skill_file.exists():
            try:
                directory.mkdir(parents=True, exist_ok=True)
                skill_file.write_text(
                    f"---\nname: {name}\ndescription: {description}\n---\n\n{body}",
                    encoding="utf-8",
                )
            except OSError:
                logger.warning(
                    "Built-in skill could not be installed",
                    extra={"event": "builtin_skill.install_failed", "skill": name},
                )
                continue
        installed.append(directory)
    return installed
