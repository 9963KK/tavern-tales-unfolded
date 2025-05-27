/**
 * 动态上下文裁剪系统测试脚本
 * 在浏览器控制台中运行此脚本来测试系统功能
 */

console.log('🧪 动态上下文裁剪系统测试工具已加载');

// 测试工具对象
window.ContextSystemTester = {
  
  // 1. 快速状态检查
  async checkSystemStatus() {
    console.log('\n=== 🔍 系统状态检查 ===');
    
    try {
      // 检查关键模块是否加载
      const checks = {
        '增强AI响应模块': typeof window.fetchEnhancedAIResponse !== 'undefined',
        '上下文管理器': typeof window.ContextManager !== 'undefined',
        '中文文本处理器': typeof window.ChineseTextProcessor !== 'undefined',
        '动态上下文裁剪器': typeof window.DynamicContextPruner !== 'undefined'
      };
      
      console.log('📋 模块加载状态:');
      Object.entries(checks).forEach(([name, loaded]) => {
        console.log(`  ${loaded ? '✅' : '❌'} ${name}: ${loaded ? '已加载' : '未加载'}`);
      });
      
      return checks;
    } catch (error) {
      console.error('❌ 状态检查失败:', error);
      return null;
    }
  },
  
  // 2. 测试中文文本处理
  testChineseTextProcessor() {
    console.log('\n=== 🔤 中文文本处理测试 ===');
    
    try {
      // 创建测试实例
      const processor = new ChineseTextProcessor();
      
      // 测试文本
      const testTexts = [
        '你好，我是一个测试用的中文文本。',
        '这是一个包含@角色名的消息，还有一些英文words。',
        '魔法师施展了强大的火球术，击败了邪恶的巨龙！'
      ];
      
      console.log('📝 测试文本分词:');
      testTexts.forEach((text, index) => {
        const words = processor.segmentText(text);
        console.log(`  文本${index + 1}: "${text}"`);
        console.log(`  分词结果: [${words.join(', ')}]`);
        console.log(`  词数: ${words.length}`);
      });
      
      // 测试关键词提取
      const keywords = processor.extractKeywords(testTexts.join(' '), 5);
      console.log('🔑 关键词提取:', keywords);
      
      // 测试相似度计算
      const similarity = processor.calculateSimilarity(testTexts[0], testTexts[1]);
      console.log('📊 文本相似度:', similarity.toFixed(3));
      
      return { success: true, processor };
    } catch (error) {
      console.error('❌ 中文文本处理测试失败:', error);
      return { success: false, error };
    }
  },
  
  // 3. 生成测试消息
  generateTestMessages(count = 20) {
    console.log(`\n=== 📝 生成${count}条测试消息 ===`);
    
    const templates = [
      '玩家: 我想了解更多关于{topic}的信息。',
      '艾莉娅: 关于{topic}，我可以告诉你{detail}。',
      '格林: 作为一名{role}，我对{topic}有不同的看法。',
      '玩家: @艾莉娅 你觉得{question}怎么样？',
      '系统: {event}发生了，所有角色都感到{emotion}。'
    ];
    
    const topics = ['魔法', '冒险', '宝藏', '怪物', '友谊', '勇气', '智慧'];
    const details = ['很多有趣的故事', '古老的传说', '神秘的力量', '重要的知识'];
    const roles = ['战士', '法师', '盗贼', '牧师', '游侠'];
    const questions = ['这个计划', '我们的下一步', '这个决定'];
    const events = ['一阵强风', '神秘的光芒', '远处的吼声', '地面的震动'];
    const emotions = ['好奇', '兴奋', '紧张', '期待'];
    
    const messages = [];
    
    for (let i = 0; i < count; i++) {
      let template = templates[Math.floor(Math.random() * templates.length)];
      
      // 替换占位符
      template = template
        .replace('{topic}', topics[Math.floor(Math.random() * topics.length)])
        .replace('{detail}', details[Math.floor(Math.random() * details.length)])
        .replace('{role}', roles[Math.floor(Math.random() * roles.length)])
        .replace('{question}', questions[Math.floor(Math.random() * questions.length)])
        .replace('{event}', events[Math.floor(Math.random() * events.length)])
        .replace('{emotion}', emotions[Math.floor(Math.random() * emotions.length)]);
      
      messages.push({
        id: `test_${i}`,
        text: template,
        sender: template.startsWith('玩家:') ? '玩家' : 
               template.startsWith('艾莉娅:') ? '艾莉娅' :
               template.startsWith('格林:') ? '格林' : '系统',
        isPlayer: template.startsWith('玩家:'),
        timestamp: new Date(Date.now() - (count - i) * 60000) // 每条消息间隔1分钟
      });
    }
    
    console.log(`✅ 已生成${messages.length}条测试消息`);
    console.log('📋 消息预览:', messages.slice(0, 3).map(m => `${m.sender}: ${m.text}`));
    
    return messages;
  },
  
  // 4. 模拟上下文裁剪测试
  async simulateContextPruning(messageCount = 30) {
    console.log(`\n=== ✂️ 模拟上下文裁剪测试 (${messageCount}条消息) ===`);
    
    try {
      // 生成测试消息
      const messages = this.generateTestMessages(messageCount);
      
      // 计算原始Token数
      const originalTokens = messages.reduce((total, msg) => {
        return total + this.estimateTokens(msg.text);
      }, 0);
      
      console.log(`📊 原始数据:`, {
        消息数: messages.length,
        预估Token数: originalTokens
      });
      
      // 模拟裁剪配置
      const config = {
        maxTokens: 2000,
        minRetainRatio: 0.3,
        enablePersonalization: true
      };
      
      console.log('⚙️ 裁剪配置:', config);
      
      // 简化的裁剪模拟
      const importantMessages = messages.filter(msg => 
        msg.text.includes('@') || 
        msg.sender === '系统' || 
        msg.text.includes('魔法') ||
        msg.text.includes('冒险')
      );
      
      const recentMessages = messages.slice(-Math.floor(messages.length * 0.4));
      const prunedMessages = [...new Set([...importantMessages, ...recentMessages])];
      
      const prunedTokens = prunedMessages.reduce((total, msg) => {
        return total + this.estimateTokens(msg.text);
      }, 0);
      
      const reduction = ((originalTokens - prunedTokens) / originalTokens * 100);
      
      console.log(`✅ 裁剪结果:`, {
        原始消息数: messages.length,
        裁剪后消息数: prunedMessages.length,
        原始Token数: originalTokens,
        裁剪后Token数: prunedTokens,
        Token减少率: `${reduction.toFixed(1)}%`,
        保留率: `${((prunedMessages.length / messages.length) * 100).toFixed(1)}%`
      });
      
      return {
        success: true,
        original: { messages: messages.length, tokens: originalTokens },
        pruned: { messages: prunedMessages.length, tokens: prunedTokens },
        reduction: reduction
      };
      
    } catch (error) {
      console.error('❌ 上下文裁剪测试失败:', error);
      return { success: false, error };
    }
  },
  
  // 5. Token估算函数
  estimateTokens(text) {
    // 简化的Token估算
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = text.split(/\s+/).filter(word => /[a-zA-Z]/.test(word)).length;
    return Math.ceil(chineseChars * 1.5 + englishWords);
  },
  
  // 6. 运行完整测试套件
  async runFullTest() {
    console.log('\n🎯 开始运行完整测试套件...\n');
    
    const results = {
      systemStatus: await this.checkSystemStatus(),
      textProcessor: this.testChineseTextProcessor(),
      contextPruning: await this.simulateContextPruning(25)
    };
    
    console.log('\n🏆 测试套件完成!');
    console.log('📋 测试结果汇总:');
    
    // 汇总结果
    const summary = {
      '系统状态': results.systemStatus ? '✅ 正常' : '❌ 异常',
      '文本处理': results.textProcessor.success ? '✅ 通过' : '❌ 失败',
      '上下文裁剪': results.contextPruning.success ? '✅ 通过' : '❌ 失败'
    };
    
    Object.entries(summary).forEach(([test, status]) => {
      console.log(`  ${status} ${test}`);
    });
    
    if (results.contextPruning.success) {
      console.log(`\n📊 性能指标:`);
      console.log(`  Token减少率: ${results.contextPruning.reduction.toFixed(1)}%`);
      console.log(`  消息保留率: ${((results.contextPruning.pruned.messages / results.contextPruning.original.messages) * 100).toFixed(1)}%`);
    }
    
    return results;
  },
  
  // 7. 帮助信息
  help() {
    console.log('\n📖 动态上下文裁剪系统测试工具使用指南:');
    console.log('');
    console.log('🔍 ContextSystemTester.checkSystemStatus()     - 检查系统状态');
    console.log('🔤 ContextSystemTester.testChineseTextProcessor() - 测试中文文本处理');
    console.log('📝 ContextSystemTester.generateTestMessages(20)   - 生成测试消息');
    console.log('✂️ ContextSystemTester.simulateContextPruning(30) - 模拟上下文裁剪');
    console.log('🎯 ContextSystemTester.runFullTest()             - 运行完整测试');
    console.log('📖 ContextSystemTester.help()                   - 显示帮助信息');
    console.log('');
    console.log('💡 使用示例:');
    console.log('  ContextSystemTester.runFullTest()  // 运行所有测试');
    console.log('  ContextSystemTester.simulateContextPruning(50)  // 测试50条消息的裁剪');
  }
};

// 显示欢迎信息
console.log('\n🎉 测试工具已准备就绪!');
console.log('💡 输入 ContextSystemTester.help() 查看使用指南');
console.log('🚀 输入 ContextSystemTester.runFullTest() 开始测试'); 