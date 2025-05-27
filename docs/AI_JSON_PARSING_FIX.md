# AI JSON 解析问题修复方案

## 🐛 问题描述

在使用AI API时，经常会遇到以下JSON解析错误：
```
SyntaxError: Unexpected token '`', "```json {...}" is not valid JSON
```

## 🔍 原因分析

AI模型（如GPT、DeepSeek等）有时会返回格式化的Markdown响应，包含代码块标记：

```markdown
```json
{
  "result": "some data"
}
```
```

而 `JSON.parse()` 只能解析纯JSON，无法处理这些Markdown标记。

## 🛠️ 解决方案

### 1. 创建通用工具函数

我们创建了 `src/utils/jsonUtils.ts` 工具库：

```typescript
// 清理AI响应文本
export function cleanAIResponseText(text: string): string
// 安全解析JSON
export function safeParseAIJSON<T>(text: string, fallbackValue: T): T
// 带验证的安全解析
export function safeParseValidatedJSON<T>(text: string, requiredFields: string[], fallbackValue: T): T
```

### 2. 应用到项目中

#### 角色生成功能 (`src/pages/Index.tsx`)
```typescript
// 原来的代码（会出错）
const parsedData = JSON.parse(content);

// 修复后的代码
const { safeParseValidatedJSON } = await import('@/utils/jsonUtils');
const parsedData = safeParseValidatedJSON(
  content, 
  ['characters'], 
  { characters: [] }
);
```

#### 主题分析功能 (`src/lib/topicAnalysis.ts`)
```typescript
// 原来的代码（会出错）
const result = JSON.parse(resultText);

// 修复后的代码
const { safeParseValidatedJSON } = await import('@/utils/jsonUtils');
const result = safeParseValidatedJSON(
  resultText, 
  ['relevanceScore'], 
  { relevanceScore: 0.3, reasoningBrief: '解析失败，使用默认分数' }
);
```

## 🎯 修复的核心改进

1. **自动清理**：移除 `\`\`\`json` 和 `\`\`\`` 标记
2. **回退机制**：解析失败时使用默认值，不中断程序
3. **字段验证**：确保必需字段存在
4. **错误日志**：详细记录解析失败的原因

## 📋 使用建议

### 对于新的AI API调用：

```typescript
import { safeParseValidatedJSON } from '@/utils/jsonUtils';

// 推荐做法
const result = safeParseValidatedJSON(
  aiResponse, 
  ['requiredField1', 'requiredField2'], 
  { /* 默认值结构 */ }
);
```

### API配置优化：

在API请求中添加格式限制：
```typescript
const requestBody = {
  model: 'your-model',
  messages: [...],
  response_format: { type: "json_object" }, // 强制返回JSON
  // ...其他参数
};
```

## ⚠️ 注意事项

1. **性能考虑**：工具函数使用动态导入减少主包大小
2. **错误处理**：始终提供合理的回退值
3. **调试信息**：保留详细的错误日志以便排查
4. **向前兼容**：工具函数兼容各种AI响应格式

## 🧪 测试建议

定期测试以下场景：
- 正常JSON响应
- 带Markdown标记的响应
- 格式错误的响应
- 缺少必需字段的响应
- 空响应或网络错误

通过这套方案，系统现在可以稳定处理各种AI响应格式，大大提高了系统的鲁棒性。 