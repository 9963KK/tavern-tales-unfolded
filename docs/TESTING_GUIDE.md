# 🧪 动态上下文裁剪系统测试指南

## 🚀 快速开始

### 1. 启动应用
```bash
npm run dev
```
访问: http://localhost:8080/

### 2. 基础界面测试

#### 打开上下文管理面板
1. 点击主界面的"🧠 上下文管理"按钮
2. 查看4个标签页：概览、配置、性能、历史

#### 概览页面测试
- 查看系统状态（应显示"运行中"）
- 查看处理统计（消息数、Token节省等）
- 查看最近处理结果

#### 配置页面测试
- 调整"最大Token数"（默认4000）
- 修改"个性化权重"（0-1之间）
- 更改"缓存大小"设置

### 3. 长对话测试

#### 创建长对话场景
1. 发送20+条消息与AI角色对话
2. 观察浏览器控制台输出
3. 查看上下文裁剪日志

#### 预期日志输出
```
🧠 上下文裁剪系统生效: {
  原始消息数: 25,
  处理后消息数: 18,
  Token减少: 28.5%,
  策略: "enhanced",
  个性化: "是",
  处理时间: "156ms"
}
```

## 🧪 控制台测试

### 在浏览器控制台中运行：

#### 1. 快速功能测试
```javascript
// 导入测试模块
import('./src/utils/contextSystemTest.js').then(module => {
  return module.quickContextTest();
}).then(result => {
  console.log('✅ 快速测试结果:', result);
});
```

#### 2. 性能基准测试
```javascript
import('./src/utils/contextSystemTest.js').then(module => {
  return module.performanceBenchmark();
}).then(result => {
  console.log('⚡ 性能测试结果:', result);
});
```

#### 3. 检查系统状态
```javascript
import('./src/lib/enhancedAIResponse.js').then(module => {
  const stats = module.getEnhancedAIResponseStats();
  console.log('📊 系统统计:', stats);
});
```

## 🎯 测试场景

### 场景1: 基础裁剪测试
1. 发送简短消息（5条以内）
2. 观察是否触发裁剪（应该不会）
3. 继续发送消息直到超过Token限制
4. 查看裁剪效果

### 场景2: @提及测试
1. 使用@角色名 发送消息
2. 观察被@的角色是否优先保留相关消息
3. 检查个性化裁剪是否生效

### 场景3: 话题相关性测试
1. 讨论特定话题（如"魔法"、"冒险"）
2. 切换到新话题
3. 观察系统是否保留相关话题的消息

### 场景4: 性能压力测试
1. 快速发送大量消息（50+条）
2. 观察处理时间是否保持在合理范围
3. 检查内存使用情况

## 📊 验证指标

### 功能指标
- ✅ 能够动态裁剪长对话
- ✅ 保留重要消息（@提及、系统消息）
- ✅ 个性化裁剪生效
- ✅ 话题相关性分析工作

### 性能指标
- ✅ 处理时间 < 500ms（1000条消息）
- ✅ Token减少率 > 20%
- ✅ 信息保留率 > 85%
- ✅ 缓存命中率 > 60%

### 用户体验指标
- ✅ 对话连贯性良好
- ✅ 角色个性保持一致
- ✅ 无明显上下文断裂
- ✅ 实时处理不阻塞UI

## 🐛 常见问题排查

### 问题1: 上下文管理面板打不开
**解决方案:**
1. 检查控制台是否有错误
2. 确认所有依赖文件已正确加载
3. 重新刷新页面

### 问题2: 裁剪系统不生效
**解决方案:**
1. 检查消息数量是否足够（需要>10条）
2. 确认Token数量是否超过限制
3. 查看控制台日志确认系统状态

### 问题3: 性能问题
**解决方案:**
1. 检查缓存设置是否合理
2. 调整Token限制参数
3. 清理缓存重新测试

## 🔧 调试技巧

### 启用详细日志
在控制台中运行：
```javascript
// 启用调试模式
import('./src/lib/enhancedAIResponse.js').then(module => {
  module.updateEnhancedAIResponseConfig({
    debugMode: true,
    logContextInfo: true
  });
});
```

### 查看缓存状态
```javascript
import('./src/lib/contextManager.js').then(module => {
  const manager = new module.ContextManager();
  console.log('缓存状态:', manager.getCacheStats());
});
```

### 手动触发裁剪测试
```javascript
import('./src/utils/contextSystemTest.js').then(module => {
  // 生成测试数据
  const testMessages = module.generateLongConversation(50);
  console.log('生成测试消息:', testMessages.length, '条');
  
  // 执行裁剪测试
  return module.testBasicPruning();
}).then(result => {
  console.log('裁剪测试结果:', result);
});
```

## 📈 测试报告模板

### 测试环境
- 浏览器: Chrome/Firefox/Safari
- 系统: macOS/Windows/Linux
- 时间: YYYY-MM-DD HH:mm

### 测试结果
- [ ] 基础功能测试通过
- [ ] 性能测试通过
- [ ] 长对话测试通过
- [ ] @提及测试通过
- [ ] 话题相关性测试通过

### 性能数据
- 平均处理时间: ___ms
- Token减少率: ___%
- 缓存命中率: ___%
- 内存使用: ___MB

### 发现的问题
1. 问题描述
2. 复现步骤
3. 预期结果
4. 实际结果

---

*最后更新: 2024-12-19*
*版本: v1.0* 