# AI酒馆奇谈 Tavern Tales Unfolded

## 项目简介

**AI酒馆奇谈** 是一个以"酒馆"为核心场景的AI驱动角色扮演与叙事游戏。玩家既可以作为"场景构筑者"设定酒馆世界，也可以作为"参与者"扮演角色，与AI驱动的NPC展开自由互动，体验动态生成的故事。

## 核心功能

- **多角色AI驱动对话**：每个NPC都可配置独立的AI模型与专属Prompt，拥有独特性格、目标和行为风格。
- **场景与事件系统**：支持玩家自定义酒馆背景、NPC设定、初始事件，AI可根据场景动态推进剧情。
- **玩家介入与观察**：玩家可随时插入对话或旁观AI互动，影响故事走向。
- **对话上下文管理**：全局对话历史+角色私有记忆+场景状态，保证AI行为连贯且个性鲜明。
- **灵活AI模型配置**：支持为每个角色单独设置API端点、API Key、模型名、专属Prompt。

## 技术栈

- **前端**：React + TypeScript + Vite
- **UI**：shadcn-ui + Tailwind CSS
- **AI集成**：支持多种大模型API（如OpenAI、Claude等），可扩展

## 快速开始

1. 安装依赖
   ```bash
   npm install
   ```
2. 启动开发服务器
   ```bash
   npm run dev
   ```
3. 浏览器访问本地地址（如 http://localhost:5173 ）

## 主要目录结构

- `src/components/tavern/`  —— 业务核心组件（角色栏、对话窗、配置弹窗等）
- `src/types/`              —— TypeScript 类型定义
- `src/pages/`              —— 页面级组件
- `src/data/`               —— 静态/Mock数据

## 角色AI模型与Prompt配置

- 进入角色栏，点击角色头像旁的"配置"按钮，可为每个角色单独设置：
  - API Base URL
  - API Key
  - Model Name
  - 角色专属Prompt（如性格、语气、背景等提示词）
- 保存后，该角色的AI行为将根据配置生效。

## 参与开发与贡献

1. Fork 本仓库并 clone 到本地
2. 新建分支进行开发
3. 提交 PR，描述你的改动内容

## 未来规划

- 支持更多场景类型与AI事件
- 多人协作构建世界观
- 2D/3D可视化界面
- 更丰富的AI行为与记忆系统

---

如有建议或问题，欢迎提 Issue 或 PR！
