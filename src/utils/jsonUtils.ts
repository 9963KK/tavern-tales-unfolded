/**
 * JSON处理工具函数
 */

/**
 * 清理AI返回的文本，移除Markdown代码块标记等格式
 * @param text 原始文本
 * @returns 清理后的文本
 */
export function cleanAIResponseText(text: string): string {
  let cleaned = text.trim();
  
  // 移除Markdown代码块标记
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '');
  }
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\s*```$/, '');
  }
  
  // 移除可能的其他格式标记
  cleaned = cleaned.replace(/^[\s\n]*/, ''); // 开头的空白
  cleaned = cleaned.replace(/[\s\n]*$/, ''); // 结尾的空白
  
  return cleaned;
}

/**
 * 安全地解析AI返回的JSON字符串
 * @param text 原始AI响应文本
 * @param fallbackValue 解析失败时的回退值
 * @returns 解析后的对象或回退值
 */
export function safeParseAIJSON<T>(text: string, fallbackValue: T): T {
  try {
    const cleaned = cleanAIResponseText(text);
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.warn('JSON解析失败，使用回退值:', error);
    console.warn('原始文本:', text);
    return fallbackValue;
  }
}

/**
 * 验证JSON对象是否包含必需的字段
 * @param obj 要验证的对象
 * @param requiredFields 必需字段列表
 * @returns 是否通过验证
 */
export function validateJSONStructure(obj: any, requiredFields: string[]): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  return requiredFields.every(field => field in obj);
}

/**
 * 带验证的安全JSON解析
 * @param text 原始AI响应文本
 * @param requiredFields 必需字段列表
 * @param fallbackValue 解析失败时的回退值
 * @returns 解析后的对象或回退值
 */
export function safeParseValidatedJSON<T>(
  text: string, 
  requiredFields: string[], 
  fallbackValue: T
): T {
  try {
    const cleaned = cleanAIResponseText(text);
    const parsed = JSON.parse(cleaned);
    
    if (validateJSONStructure(parsed, requiredFields)) {
      return parsed as T;
    } else {
      console.warn('JSON结构验证失败，缺少必需字段:', requiredFields);
      return fallbackValue;
    }
  } catch (error) {
    console.warn('JSON解析失败，使用回退值:', error);
    console.warn('原始文本:', text);
    return fallbackValue;
  }
} 