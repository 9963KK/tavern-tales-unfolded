# 任务4.1：情感状态跟踪系统

## 📋 任务概述

**任务状态**: 🔄 准备开始  
**优先级**: 🔥 高优先级  
**预估工作量**: 4-5小时  
**完成目标**: 从零开始实现完整的角色情感状态跟踪系统，让AI角色具有动态的情感变化

## 🎯 项目现状分析

### ✅ 已有基础
- **角色个性系统** - 角色已有personality、interests、socialRole等属性
- **发言意愿系统** - 已集成emotionalState影响发言欲望
- **记忆系统** - 可以存储情感相关记忆
- **消息处理流程** - 完整的对话处理管道

### ❌ 需要实现的核心功能
- **情感状态模型** - 定义情感状态的数据结构和类型
- **情感分析引擎** - 根据对话内容分析和更新情感
- **情感影响机制** - 让情感状态影响角色的发言内容和风格
- **情感状态UI** - 可视化显示角色的情感状态
- **情感状态持久化** - 保存和恢复情感状态

## 🏗️ 详细实施计划

### 阶段1：情感状态模型设计 (1小时)

#### 子任务1.1：情感类型定义 (30分钟)
**目标**: 创建情感状态的TypeScript类型定义

**实施步骤**:
1. **创建 `src/types/emotion.ts`**
   ```typescript
   // 基础情感类型（基于Russell情感环形模型）
   export enum EmotionType {
     EXCITED = 'excited',      // 兴奋（高唤醒+积极）
     HAPPY = 'happy',          // 快乐（中唤醒+积极）
     CALM = 'calm',            // 平静（低唤醒+积极）
     RELAXED = 'relaxed',      // 放松（低唤醒+积极）
     BORED = 'bored',          // 无聊（低唤醒+消极）
     SAD = 'sad',              // 悲伤（低唤醒+消极）
     ANGRY = 'angry',          // 愤怒（高唤醒+消极）
     STRESSED = 'stressed',    // 紧张（高唤醒+消极）
     NEUTRAL = 'neutral'       // 中性
   }

   // 情感状态接口
   export interface EmotionalState {
     type: EmotionType;
     intensity: number;        // 强度 [0, 1]
     valence: number;          // 效价 [-1, 1] (消极到积极)
     arousal: number;          // 唤醒度 [-1, 1] (平静到兴奋)
     timestamp: Date;
     description: string;      // 人类可读的描述
     triggers: string[];       // 触发因素
   }

   // 情感变化事件
   export interface EmotionChangeEvent {
     characterId: string;
     previousState: EmotionalState;
     newState: EmotionalState;
     trigger: string;
     timestamp: Date;
   }
   ```

2. **扩展AICharacter接口**
   - 在 `src/types/tavern.ts` 中添加情感状态字段
   ```typescript
   export interface AICharacter {
     // ... 现有字段
     currentEmotionalState?: EmotionalState;
     emotionalHistory?: EmotionalState[];
     baselineEmotion?: EmotionType; // 角色的基线情感
   }
   ```

**验证标准**:
- TypeScript编译无错误
- 类型定义完整且合理

#### 子任务1.2：情感分析算法设计 (30分钟)
**目标**: 设计情感分析的核心算法

**实施步骤**:
1. **创建 `src/lib/emotionEngine.ts`**
   ```typescript
   export class EmotionEngine {
     // 基于关键词的情感分析
     analyzeMessageEmotion(text: string): EmotionalState;
     
     // 根据角色个性调整情感反应
     adjustEmotionForPersonality(
       baseEmotion: EmotionalState, 
       personality: AICharacter['personality']
     ): EmotionalState;
     
     // 情感传染机制
     applyEmotionalContagion(
       characterEmotion: EmotionalState,
       contextEmotions: EmotionalState[]
     ): EmotionalState;
     
     // 情感自然衰减
     applyEmotionalDecay(
       currentEmotion: EmotionalState,
       timeElapsed: number
     ): EmotionalState;
   }
   ```

**验证标准**:
- 算法设计合理，考虑多种影响因素
- 接口设计清晰，易于扩展

### 阶段2：情感分析引擎实现 (1.5小时)

#### 子任务2.1：基础情感分析 (45分钟)
**目标**: 实现基于关键词和语义的情感分析

**实施步骤**:
1. **实现关键词情感分析**
   ```typescript
   // 情感关键词库
   const EMOTION_KEYWORDS = {
     [EmotionType.HAPPY]: ['开心', '高兴', '快乐', '喜悦', '兴奋'],
     [EmotionType.SAD]: ['难过', '悲伤', '沮丧', '失望', '痛苦'],
     [EmotionType.ANGRY]: ['愤怒', '生气', '恼火', '烦躁', '愤慨'],
     [EmotionType.STRESSED]: ['紧张', '焦虑', '担心', '害怕', '恐惧'],
     // ... 其他情感类型
   };
   ```

2. **实现情感强度计算**
   - 基于关键词密度
   - 考虑标点符号（!、?、...）
   - 考虑语气词和程度副词

3. **实现Russell情感模型映射**
   - 将关键词分析结果映射到二维情感空间
   - 计算valence（效价）和arousal（唤醒度）

**验证标准**:
- 能正确识别基本情感类型
- 情感强度计算合理
- 支持中文文本分析

#### 子任务2.2：个性化情感调整 (45分钟)
**目标**: 根据角色个性调整情感反应

**实施步骤**:
1. **实现个性影响算法**
   ```typescript
   // 外向性影响情感表达强度
   if (personality.extroversion > 0.7) {
     emotion.intensity *= 1.2; // 外向角色情感表达更强烈
   }
   
   // 反应敏感度影响情感变化速度
   const reactivityFactor = personality.reactivity || 0.5;
   emotion.intensity *= (0.5 + reactivityFactor);
   ```

2. **实现社交角色调整**
   ```typescript
   switch (character.socialRole) {
     case 'host':
       // 主人角色对客人更积极
       if (isPlayerMessage) emotion.valence += 0.1;
       break;
     case 'entertainer':
       // 娱乐者情感表达更夸张
       emotion.intensity *= 1.3;
       break;
     // ... 其他角色
   }
   ```

**验证标准**:
- 不同个性的角色表现出不同的情感反应
- 社交角色影响合理

### 阶段3：情感影响机制 (1小时)

#### 子任务3.1：情感影响对话生成 (45分钟)
**目标**: 让角色的情感状态影响其对话内容和风格

**实施步骤**:
1. **修改AI提示词生成**
   - 在 `src/lib/enhancedAIResponse.ts` 中集成情感状态
   ```typescript
   const emotionContext = character.currentEmotionalState ? 
     `当前情感状态：${character.currentEmotionalState.description}
      情感强度：${character.currentEmotionalState.intensity}
      请根据这种情感状态调整你的回应风格。` : '';
   ```

2. **创建情感风格模板**
   ```typescript
   const EMOTION_STYLE_PROMPTS = {
     [EmotionType.HAPPY]: "用更加愉快、积极的语调回应",
     [EmotionType.SAD]: "用更加低沉、简短的语调回应",
     [EmotionType.ANGRY]: "用更加直接、强硬的语调回应",
     [EmotionType.EXCITED]: "用更加热情、活跃的语调回应",
     // ... 其他情感类型
   };
   ```

**验证标准**:
- 角色在不同情感状态下表现出明显不同的对话风格
- 情感影响自然，不突兀

#### 子任务3.2：情感传染机制 (15分钟)
**目标**: 实现角色间的情感传染

**实施步骤**:
1. **实现情感传染算法**
   ```typescript
   // 分析最近几条消息的情感氛围
   const recentEmotions = getRecentEmotions(messages.slice(-3));
   const averageValence = calculateAverageValence(recentEmotions);
   
   // 根据角色敏感度调整传染强度
   const contagionStrength = character.personality?.reactivity || 0.3;
   character.currentEmotionalState.valence += 
     averageValence * contagionStrength * 0.1;
   ```

**验证标准**:
- 角色能受到对话氛围影响
- 传染效果适度，不过于敏感

### 阶段4：UI可视化与集成 (1.5小时)

#### 子任务4.1：情感状态显示组件 (1小时)
**目标**: 创建情感状态的可视化组件

**实施步骤**:
1. **创建 `src/components/tavern/EmotionIndicator.tsx`**
   ```typescript
   interface EmotionIndicatorProps {
     emotion: EmotionalState;
     size?: 'small' | 'medium' | 'large';
     showDetails?: boolean;
   }
   
   // 情感图标映射
   const EMOTION_ICONS = {
     [EmotionType.HAPPY]: '😊',
     [EmotionType.SAD]: '😢',
     [EmotionType.ANGRY]: '😡',
     [EmotionType.EXCITED]: '🤩',
     // ... 其他情感
   };
   
   // 情感颜色映射
   const EMOTION_COLORS = {
     [EmotionType.HAPPY]: 'text-green-500',
     [EmotionType.SAD]: 'text-blue-500',
     [EmotionType.ANGRY]: 'text-red-500',
     // ... 其他情感
   };
   ```

2. **修改 `AvatarBar.tsx`**
   - 在角色头像上显示情感指示器
   - 添加悬停显示详细情感信息

**验证标准**:
- 情感状态可视化直观易懂
- UI美观，与整体设计风格一致

#### 子任务4.2：主应用集成 (30分钟)
**目标**: 将情感系统集成到主应用中

**实施步骤**:
1. **修改 `src/pages/Index.tsx`**
   ```typescript
   import { EmotionEngine } from '@/lib/emotionEngine';
   
   // 创建情感引擎实例
   const emotionEngine = new EmotionEngine();
   
   // 在消息处理中添加情感分析
   const handleSendMessage = async (text: string) => {
     // ... 现有逻辑
     
     // 分析玩家消息情感，影响AI角色
     const playerEmotion = emotionEngine.analyzeMessageEmotion(text);
     updateCharacterEmotions(playerEmotion);
   };
   
   // 在AI响应中添加情感分析
   const fetchAIResponse = async (character: AICharacter, messages: Message[]) => {
     // 分析AI响应的情感
     const response = await getAIResponse(character, messages);
     const aiEmotion = emotionEngine.analyzeMessageEmotion(response);
     
     // 更新角色情感状态
     character.currentEmotionalState = aiEmotion;
     
     return response;
   };
   ```

**验证标准**:
- 情感系统完全集成到对话流程中
- 不影响现有功能的正常运行

## 🎨 UI设计规范

### 情感指示器设计
1. **图标系统**
   - 使用emoji表示基本情感类型
   - 大小：小(16px)、中(24px)、大(32px)
   - 支持动画效果（淡入淡出、缩放）

2. **颜色系统**
   - 积极情感：绿色系 (#10B981, #34D399)
   - 消极情感：红色系 (#EF4444, #F87171)
   - 中性情感：灰色系 (#6B7280, #9CA3AF)
   - 高强度：饱和度更高
   - 低强度：饱和度更低

3. **交互设计**
   - 悬停显示详细信息
   - 点击显示情感历史
   - 平滑的过渡动画

## 🧪 测试验证计划

### 功能测试
1. **情感分析测试**
   - [ ] 正确识别积极情感
   - [ ] 正确识别消极情感
   - [ ] 正确识别中性情感
   - [ ] 情感强度计算合理

2. **个性化测试**
   - [ ] 外向角色情感表达更强烈
   - [ ] 内向角色情感表达更内敛
   - [ ] 不同社交角色表现差异

3. **情感影响测试**
   - [ ] 情感状态影响对话风格
   - [ ] 情感传染机制正常工作
   - [ ] 情感自然衰减

4. **UI测试**
   - [ ] 情感指示器正确显示
   - [ ] 悬停交互正常
   - [ ] 动画效果流畅

### 性能测试
- 情感分析响应时间 < 100ms
- UI更新流畅，无卡顿
- 内存使用合理

## 📊 成功指标

### 技术指标
- [ ] 情感识别准确率 > 70%
- [ ] 系统响应时间 < 100ms
- [ ] UI组件渲染性能良好
- [ ] 无TypeScript编译错误

### 用户体验指标
- [ ] 角色情感变化自然合理
- [ ] 情感状态可视化直观
- [ ] 对话风格变化明显
- [ ] 系统运行稳定

## 🚀 实施时间表

| 阶段 | 子任务 | 预估时间 | 开始时间 | 完成时间 |
|------|--------|----------|----------|----------|
| 阶段1 | 1.1 情感类型定义 | 30分钟 | - | - |
| 阶段1 | 1.2 算法设计 | 30分钟 | - | - |
| 阶段2 | 2.1 基础情感分析 | 45分钟 | - | - |
| 阶段2 | 2.2 个性化调整 | 45分钟 | - | - |
| 阶段3 | 3.1 影响对话生成 | 45分钟 | - | - |
| 阶段3 | 3.2 情感传染机制 | 15分钟 | - | - |
| 阶段4 | 4.1 UI组件 | 1小时 | - | - |
| 阶段4 | 4.2 主应用集成 | 30分钟 | - | - |

**总计**: 4-5小时

## 📝 注意事项

1. **简单优先**: 先实现基础功能，后续可以逐步优化
2. **性能考虑**: 情感分析应该轻量级，不影响对话响应速度
3. **用户体验**: 情感变化应该自然，避免过于频繁或剧烈
4. **扩展性**: 为未来添加更复杂的情感模型预留接口
5. **调试友好**: 提供清晰的日志和调试信息

## 🔗 相关文档

- [角色个性系统](src/types/tavern.ts)
- [发言意愿计算](src/lib/speakingDesire.ts)
- [增强AI响应](src/lib/enhancedAIResponse.ts)
- [记忆系统](src/lib/integratedMemoryManager.ts)

---

**创建时间**: 2024-12-19  
**最后更新**: 2024-12-19  
**负责人**: AI助手  
**状态**: 📋 计划制定完成，准备开始实施 