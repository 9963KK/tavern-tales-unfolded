/**
 * 中文文本处理器 - 浏览器兼容版本
 * 不依赖外部分词库，使用简化的中文文本处理算法
 */

// 中文停用词列表
const CHINESE_STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你',
  '会', '着', '没有', '看', '好', '自己', '这', '那', '他', '她', '它', '们', '这个', '那个', '什么', '怎么', '为什么', '哪里',
  '时候', '可以', '应该', '能够', '已经', '还是', '或者', '但是', '因为', '所以', '如果', '虽然', '然后', '现在', '以后',
  '之前', '之后', '里面', '外面', '上面', '下面', '前面', '后面', '左边', '右边', '中间', '旁边', '附近', '周围'
]);

// 中文标点符号
const CHINESE_PUNCTUATION = /[，。！？；：""''（）【】《》〈〉「」『』〔〕［］｛｝]/g;

// 英文标点符号
const ENGLISH_PUNCTUATION = /[,.!?;:"'()\[\]{}<>]/g;

// 分词结果缓存
interface SegmentationCache {
  [key: string]: string[];
}

// 关键词提取结果
interface KeywordExtractionResult {
  word: string;
  frequency: number;
  score: number;
}

export class ChineseTextProcessor {
  private cache: SegmentationCache = {};
  private maxCacheSize = 1000;

  constructor() {
    console.log('🔤 中文文本处理器初始化完成（浏览器兼容版本）');
  }

  /**
   * 中文文本分词 - 简化版本
   */
  segmentText(text: string): string[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // 检查缓存
    const cacheKey = text.trim();
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    try {
      // 使用简化分词算法
      const words = this.performSimpleSegmentation(text);
      
      // 缓存结果
      this.saveToCache(cacheKey, words);
      
      return words;
    } catch (error) {
      console.warn('文本分词失败，返回原文:', error);
      return [text];
    }
  }

  /**
   * 简化的中文分词算法
   */
  private performSimpleSegmentation(text: string): string[] {
    // 清理文本
    const cleanText = this.cleanText(text);
    
    // 按标点符号分割
    const segments = cleanText.split(/[，。！？；：""''（）【】《》〈〉「」『』〔〕［］｛｝,.!?;:"'()\[\]{}<>\s]+/)
      .filter(segment => segment.length > 0);
    
    const words: string[] = [];
    
    for (const segment of segments) {
      // 分离中文和英文
      const parts = this.separateChineseAndEnglish(segment);
      words.push(...parts);
    }
    
    // 过滤停用词和短词
    return words.filter(word => 
      word.length > 0 && 
      !CHINESE_STOP_WORDS.has(word) &&
      word.length >= 1 // 保留单字，因为中文单字也可能有意义
    );
  }

  /**
   * 分离中文和英文文本
   */
  private separateChineseAndEnglish(text: string): string[] {
    const parts: string[] = [];
    let currentPart = '';
    let isCurrentChinese = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const isChinese = this.isChineseCharacter(char);
      
      if (i === 0) {
        currentPart = char;
        isCurrentChinese = isChinese;
      } else if (isChinese === isCurrentChinese) {
        currentPart += char;
      } else {
        if (currentPart.trim().length > 0) {
          if (isCurrentChinese) {
            // 中文按字符分割（简化处理）
            parts.push(...this.segmentChineseText(currentPart));
          } else {
            // 英文按单词分割
            parts.push(...currentPart.split(/\s+/).filter(w => w.length > 0));
          }
        }
        currentPart = char;
        isCurrentChinese = isChinese;
      }
    }
    
    // 处理最后一部分
    if (currentPart.trim().length > 0) {
      if (isCurrentChinese) {
        parts.push(...this.segmentChineseText(currentPart));
      } else {
        parts.push(...currentPart.split(/\s+/).filter(w => w.length > 0));
      }
    }
    
    return parts.filter(part => part.length > 0);
  }

  /**
   * 简化的中文文本分割
   */
  private segmentChineseText(text: string): string[] {
    const words: string[] = [];
    
    // 简化策略：尝试识别常见的2-3字词组，否则按字分割
    for (let i = 0; i < text.length; i++) {
      if (i < text.length - 2) {
        const threeChar = text.substr(i, 3);
        if (this.isCommonThreeCharWord(threeChar)) {
          words.push(threeChar);
          i += 2; // 跳过已处理的字符
          continue;
        }
      }
      
      if (i < text.length - 1) {
        const twoChar = text.substr(i, 2);
        if (this.isCommonTwoCharWord(twoChar)) {
          words.push(twoChar);
          i += 1; // 跳过已处理的字符
          continue;
        }
      }
      
      // 单字
      words.push(text[i]);
    }
    
    return words;
  }

  /**
   * 判断是否为中文字符
   */
  private isChineseCharacter(char: string): boolean {
    const code = char.charCodeAt(0);
    return (code >= 0x4e00 && code <= 0x9fff) || // 基本汉字
           (code >= 0x3400 && code <= 0x4dbf) || // 扩展A
           (code >= 0x20000 && code <= 0x2a6df); // 扩展B
  }

  /**
   * 常见的两字词判断（简化版本）
   */
  private isCommonTwoCharWord(word: string): boolean {
    const commonWords = new Set([
      '可以', '应该', '能够', '已经', '还是', '或者', '但是', '因为', '所以', '如果', '虽然', '然后', '现在', '以后',
      '之前', '之后', '里面', '外面', '上面', '下面', '前面', '后面', '左边', '右边', '中间', '旁边', '附近', '周围',
      '朋友', '家人', '老师', '学生', '工作', '学习', '生活', '时间', '地方', '东西', '事情', '问题', '方法', '机会',
      '希望', '梦想', '目标', '计划', '想法', '感觉', '心情', '情况', '状态', '结果', '原因', '理由', '条件', '要求'
    ]);
    return commonWords.has(word);
  }

  /**
   * 常见的三字词判断（简化版本）
   */
  private isCommonThreeCharWord(word: string): boolean {
    const commonWords = new Set([
      '不知道', '没关系', '对不起', '不客气', '没问题', '怎么样', '为什么', '什么时候', '在哪里', '怎么办',
      '很重要', '很有趣', '很好看', '很好吃', '很漂亮', '很聪明', '很努力', '很开心', '很难过', '很生气'
    ]);
    return commonWords.has(word);
  }

  /**
   * 清理文本
   */
  private cleanText(text: string): string {
    return text
      .replace(CHINESE_PUNCTUATION, ' ')
      .replace(ENGLISH_PUNCTUATION, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 提取关键词
   */
  extractKeywords(text: string, maxKeywords: number = 10): KeywordExtractionResult[] {
    const words = this.segmentText(text);
    const wordFreq: { [key: string]: number } = {};
    
    // 统计词频
    words.forEach(word => {
      if (word.length >= 2) { // 只考虑长度>=2的词
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    // 计算关键词分数（简化的TF-IDF近似）
    const keywords: KeywordExtractionResult[] = Object.entries(wordFreq)
      .map(([word, frequency]) => ({
        word,
        frequency,
        score: frequency * Math.log(words.length / frequency) // 简化的TF-IDF
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxKeywords);
    
    return keywords;
  }

  /**
   * 计算文本相似度（基于词汇重叠）
   */
  calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(this.segmentText(text1));
    const words2 = new Set(this.segmentText(text2));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * 缓存管理
   */
  private saveToCache(key: string, words: string[]): void {
    if (Object.keys(this.cache).length >= this.maxCacheSize) {
      // 简单的LRU：删除一半缓存
      const keys = Object.keys(this.cache);
      const keysToDelete = keys.slice(0, Math.floor(keys.length / 2));
      keysToDelete.forEach(k => delete this.cache[k]);
    }
    
    this.cache[key] = words;
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: Object.keys(this.cache).length,
      maxSize: this.maxCacheSize
    };
  }
} 