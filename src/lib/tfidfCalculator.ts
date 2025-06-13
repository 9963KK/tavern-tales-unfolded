import { ChineseTextProcessor, SegmentResult } from '../utils/chineseTextProcessor';

// TF-IDF向量接口
export interface TFIDFVector {
  documentId: string;
  vector: Map<string, number>;
  magnitude: number;
  keywords: string[];
}

// 文档统计信息
export interface DocumentStats {
  totalDocuments: number;
  totalTerms: number;
  vocabulary: Set<string>;
  documentFrequency: Map<string, number>; // 每个词出现在多少个文档中
  termFrequency: Map<string, Map<string, number>>; // 每个文档中每个词的频率
}

// TF-IDF计算结果
export interface TFIDFResult {
  documentVectors: TFIDFVector[];
  vocabulary: string[];
  documentStats: DocumentStats;
  processingTime: number;
}

// 相似度计算结果
export interface SimilarityResult {
  documentId1: string;
  documentId2: string;
  similarity: number;
  commonTerms: string[];
  method: 'cosine' | 'jaccard' | 'euclidean';
}

// TF-IDF计算器类
export class TFIDFCalculator {
  private textProcessor: ChineseTextProcessor;
  private documentStats: DocumentStats;
  private documentVectors: Map<string, TFIDFVector>;
  private cache: Map<string, any>;
  private enableCaching: boolean;

  constructor(enableCaching: boolean = true) {
    this.textProcessor = new ChineseTextProcessor();
    this.documentStats = {
      totalDocuments: 0,
      totalTerms: 0,
      vocabulary: new Set(),
      documentFrequency: new Map(),
      termFrequency: new Map()
    };
    this.documentVectors = new Map();
    this.cache = new Map();
    this.enableCaching = enableCaching;
  }

  /**
   * 计算文档集合的TF-IDF向量
   */
  calculateTFIDF(documents: { id: string; content: string }[]): TFIDFResult {
    const startTime = Date.now();

    // 1. 预处理所有文档
    const processedDocs = this.preprocessDocuments(documents);

    // 2. 构建词汇表和文档频率
    this.buildVocabularyAndDF(processedDocs);

    // 3. 计算TF-IDF向量
    const documentVectors = this.computeTFIDFVectors(processedDocs);

    const processingTime = Date.now() - startTime;

    return {
      documentVectors,
      vocabulary: Array.from(this.documentStats.vocabulary),
      documentStats: { ...this.documentStats },
      processingTime
    };
  }

  /**
   * 预处理文档
   */
  private preprocessDocuments(documents: { id: string; content: string }[]): Array<{
    id: string;
    content: string;
    segmentResult: SegmentResult;
  }> {
    return documents.map(doc => {
      const content = doc.content || '';
      const cacheKey = `segment_${doc.id}_${this.hashString(content)}`;
      
      let segmentResult: SegmentResult;
      if (this.enableCaching && this.cache.has(cacheKey)) {
        segmentResult = this.cache.get(cacheKey);
      } else {
        segmentResult = this.textProcessor.segmentText(content);
        if (this.enableCaching) {
          this.cache.set(cacheKey, segmentResult);
        }
      }

      return {
        id: doc.id,
        content,
        segmentResult
      };
    });
  }

  /**
   * 构建词汇表和文档频率
   */
  private buildVocabularyAndDF(processedDocs: Array<{
    id: string;
    content: string;
    segmentResult: SegmentResult;
  }>): void {
    // 重置统计信息
    this.documentStats = {
      totalDocuments: processedDocs.length,
      totalTerms: 0,
      vocabulary: new Set(),
      documentFrequency: new Map(),
      termFrequency: new Map()
    };

    // 遍历所有文档
    for (const doc of processedDocs) {
      const { filteredWords } = doc.segmentResult;
      const uniqueWords = new Set(filteredWords);
      
      // 更新词汇表
      for (const word of uniqueWords) {
        this.documentStats.vocabulary.add(word);
      }

      // 更新文档频率（DF）
      for (const word of uniqueWords) {
        const currentDF = this.documentStats.documentFrequency.get(word) || 0;
        this.documentStats.documentFrequency.set(word, currentDF + 1);
      }

      // 计算词频（TF）
      const termFreq = new Map<string, number>();
      for (const word of filteredWords) {
        termFreq.set(word, (termFreq.get(word) || 0) + 1);
      }
      this.documentStats.termFrequency.set(doc.id, termFreq);

      // 更新总词数
      this.documentStats.totalTerms += filteredWords.length;
    }
  }

  /**
   * 计算TF-IDF向量
   */
  private computeTFIDFVectors(processedDocs: Array<{
    id: string;
    content: string;
    segmentResult: SegmentResult;
  }>): TFIDFVector[] {
    const vectors: TFIDFVector[] = [];

    for (const doc of processedDocs) {
      const vector = new Map<string, number>();
      const termFreq = this.documentStats.termFrequency.get(doc.id) || new Map();
      const totalTermsInDoc = doc.segmentResult.filteredWords.length;

      // 计算每个词的TF-IDF值
      for (const [term, tf] of termFreq.entries()) {
        const tfValue = this.calculateTF(tf, totalTermsInDoc);
        const idfValue = this.calculateIDF(term);
        const tfidfValue = tfValue * idfValue;
        
        if (tfidfValue > 0) {
          vector.set(term, tfidfValue);
        }
      }

      // 计算向量的模长
      const magnitude = this.calculateMagnitude(vector);

      // 提取关键词（TF-IDF值最高的词）
      const keywords = Array.from(vector.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([term]) => term);

      const tfidfVector: TFIDFVector = {
        documentId: doc.id,
        vector,
        magnitude,
        keywords
      };

      vectors.push(tfidfVector);
      this.documentVectors.set(doc.id, tfidfVector);
    }

    return vectors;
  }

  /**
   * 计算词频（TF）
   */
  private calculateTF(termFreq: number, totalTermsInDoc: number): number {
    if (totalTermsInDoc === 0) return 0;
    
    // 使用对数归一化的TF
    return Math.log(1 + termFreq);
    
    // 或者使用简单的频率归一化
    // return termFreq / totalTermsInDoc;
  }

  /**
   * 计算逆文档频率（IDF）
   */
  private calculateIDF(term: string): number {
    const df = this.documentStats.documentFrequency.get(term) || 1;
    const totalDocs = this.documentStats.totalDocuments;
    
    if (totalDocs === 0 || df === 0) return 0;
    
    // 使用平滑的IDF计算，避免除零
    return Math.log(totalDocs / (df + 1)) + 1;
  }

  /**
   * 计算向量的模长
   */
  private calculateMagnitude(vector: Map<string, number>): number {
    let sumOfSquares = 0;
    for (const value of vector.values()) {
      sumOfSquares += value * value;
    }
    return Math.sqrt(sumOfSquares);
  }

  /**
   * 计算两个文档的余弦相似度
   */
  calculateCosineSimilarity(docId1: string, docId2: string): number {
    const vector1 = this.documentVectors.get(docId1);
    const vector2 = this.documentVectors.get(docId2);

    if (!vector1 || !vector2) {
      throw new Error(`Document vectors not found for ${docId1} or ${docId2}`);
    }

    return this.computeCosineSimilarity(vector1.vector, vector2.vector, vector1.magnitude, vector2.magnitude);
  }

  /**
   * 计算余弦相似度的核心算法
   */
  private computeCosineSimilarity(
    vector1: Map<string, number>,
    vector2: Map<string, number>,
    magnitude1: number,
    magnitude2: number
  ): number {
    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    let dotProduct = 0;
    
    // 计算点积
    for (const [term, value1] of vector1.entries()) {
      const value2 = vector2.get(term) || 0;
      dotProduct += value1 * value2;
    }

    // 余弦相似度 = 点积 / (模长1 * 模长2)
    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * 计算Jaccard相似度
   */
  calculateJaccardSimilarity(docId1: string, docId2: string): number {
    const vector1 = this.documentVectors.get(docId1);
    const vector2 = this.documentVectors.get(docId2);

    if (!vector1 || !vector2) {
      throw new Error(`Document vectors not found for ${docId1} or ${docId2}`);
    }

    const terms1 = new Set(vector1.vector.keys());
    const terms2 = new Set(vector2.vector.keys());

    const intersection = new Set([...terms1].filter(term => terms2.has(term)));
    const union = new Set([...terms1, ...terms2]);

    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  /**
   * 批量计算相似度
   */
  calculateAllSimilarities(method: 'cosine' | 'jaccard' = 'cosine'): SimilarityResult[] {
    const results: SimilarityResult[] = [];
    const docIds = Array.from(this.documentVectors.keys());

    for (let i = 0; i < docIds.length; i++) {
      for (let j = i + 1; j < docIds.length; j++) {
        const docId1 = docIds[i];
        const docId2 = docIds[j];

        let similarity: number;
        if (method === 'cosine') {
          similarity = this.calculateCosineSimilarity(docId1, docId2);
        } else {
          similarity = this.calculateJaccardSimilarity(docId1, docId2);
        }

        // 找出共同词汇
        const vector1 = this.documentVectors.get(docId1)!;
        const vector2 = this.documentVectors.get(docId2)!;
        const commonTerms = Array.from(vector1.vector.keys())
          .filter(term => vector2.vector.has(term));

        results.push({
          documentId1: docId1,
          documentId2: docId2,
          similarity,
          commonTerms,
          method
        });
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * 增量更新：添加新文档
   */
  addDocument(document: { id: string; content: string }): TFIDFVector {
    // 预处理新文档
    const segmentResult = this.textProcessor.segmentText(document.content || '');
    const { filteredWords } = segmentResult;
    const uniqueWords = new Set(filteredWords);

    // 更新文档统计
    this.documentStats.totalDocuments += 1;
    this.documentStats.totalTerms += filteredWords.length;

    // 更新词汇表和文档频率
    for (const word of uniqueWords) {
      this.documentStats.vocabulary.add(word);
      const currentDF = this.documentStats.documentFrequency.get(word) || 0;
      this.documentStats.documentFrequency.set(word, currentDF + 1);
    }

    // 计算新文档的词频
    const termFreq = new Map<string, number>();
    for (const word of filteredWords) {
      termFreq.set(word, (termFreq.get(word) || 0) + 1);
    }
    this.documentStats.termFrequency.set(document.id, termFreq);

    // 计算新文档的TF-IDF向量
    const vector = new Map<string, number>();
    for (const [term, tf] of termFreq.entries()) {
      const tfValue = this.calculateTF(tf, filteredWords.length);
      const idfValue = this.calculateIDF(term);
      const tfidfValue = tfValue * idfValue;
      
      if (tfidfValue > 0) {
        vector.set(term, tfidfValue);
      }
    }

    const magnitude = this.calculateMagnitude(vector);
    const keywords = Array.from(vector.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([term]) => term);

    const tfidfVector: TFIDFVector = {
      documentId: document.id,
      vector,
      magnitude,
      keywords
    };

    this.documentVectors.set(document.id, tfidfVector);
    return tfidfVector;
  }

  /**
   * 移除文档
   */
  removeDocument(documentId: string): boolean {
    const vector = this.documentVectors.get(documentId);
    if (!vector) return false;

    // 更新统计信息
    this.documentStats.totalDocuments -= 1;
    
    const termFreq = this.documentStats.termFrequency.get(documentId);
    if (termFreq) {
      // 减少总词数
      for (const freq of termFreq.values()) {
        this.documentStats.totalTerms -= freq;
      }

      // 更新文档频率
      for (const term of termFreq.keys()) {
        const currentDF = this.documentStats.documentFrequency.get(term) || 0;
        if (currentDF > 1) {
          this.documentStats.documentFrequency.set(term, currentDF - 1);
        } else {
          this.documentStats.documentFrequency.delete(term);
          this.documentStats.vocabulary.delete(term);
        }
      }

      this.documentStats.termFrequency.delete(documentId);
    }

    this.documentVectors.delete(documentId);
    return true;
  }

  /**
   * 查找最相似的文档
   */
  findMostSimilar(
    documentId: string, 
    topK: number = 5, 
    method: 'cosine' | 'jaccard' = 'cosine'
  ): SimilarityResult[] {
    const results: SimilarityResult[] = [];
    
    for (const [otherDocId] of this.documentVectors) {
      if (otherDocId === documentId) continue;

      let similarity: number;
      if (method === 'cosine') {
        similarity = this.calculateCosineSimilarity(documentId, otherDocId);
      } else {
        similarity = this.calculateJaccardSimilarity(documentId, otherDocId);
      }

      const vector1 = this.documentVectors.get(documentId)!;
      const vector2 = this.documentVectors.get(otherDocId)!;
      const commonTerms = Array.from(vector1.vector.keys())
        .filter(term => vector2.vector.has(term));

      results.push({
        documentId1: documentId,
        documentId2: otherDocId,
        similarity,
        commonTerms,
        method
      });
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * 获取文档的关键词
   */
  getDocumentKeywords(documentId: string, topK: number = 10): Array<{ term: string; tfidf: number }> {
    const vector = this.documentVectors.get(documentId);
    if (!vector) return [];

    return Array.from(vector.vector.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([term, tfidf]) => ({ term, tfidf }));
  }

  /**
   * 获取全局关键词
   */
  getGlobalKeywords(topK: number = 20): Array<{ term: string; df: number; idf: number }> {
    const results: Array<{ term: string; df: number; idf: number }> = [];

    for (const [term, df] of this.documentStats.documentFrequency.entries()) {
      const idf = this.calculateIDF(term);
      results.push({ term, df, idf });
    }

    return results
      .sort((a, b) => b.idf - a.idf)
      .slice(0, topK);
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.textProcessor.clearCache();
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalDocuments: number;
    vocabularySize: number;
    totalTerms: number;
    averageDocumentLength: number;
    cacheSize: number;
  } {
    return {
      totalDocuments: this.documentStats.totalDocuments,
      vocabularySize: this.documentStats.vocabulary.size,
      totalTerms: this.documentStats.totalTerms,
      averageDocumentLength: this.documentStats.totalDocuments > 0 
        ? this.documentStats.totalTerms / this.documentStats.totalDocuments 
        : 0,
      cacheSize: this.cache.size
    };
  }

  /**
   * 简单的字符串哈希函数
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString();
  }
} 