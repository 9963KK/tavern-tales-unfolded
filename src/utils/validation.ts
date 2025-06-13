import { ValidationError, ValidationResult, ErrorType, ErrorSeverity } from '../types/error';
import { ErrorHandler } from '../lib/errorHandler';

// 验证规则接口
interface ValidationRule {
  name: string;
  validator: (value: any) => boolean;
  message: string;
}

// 预定义的验证规则
export const ValidationRules = {
  // 必填验证
  required: (message = '此字段为必填项'): ValidationRule => ({
    name: 'required',
    validator: (value: any) => {
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      return value !== null && value !== undefined && value !== '';
    },
    message
  }),

  // 最小长度验证
  minLength: (min: number, message?: string): ValidationRule => ({
    name: 'minLength',
    validator: (value: string) => {
      if (typeof value !== 'string') return false;
      return value.length >= min;
    },
    message: message || `最少需要${min}个字符`
  }),

  // 最大长度验证
  maxLength: (max: number, message?: string): ValidationRule => ({
    name: 'maxLength',
    validator: (value: string) => {
      if (typeof value !== 'string') return false;
      return value.length <= max;
    },
    message: message || `最多允许${max}个字符`
  }),

  // 字符范围验证
  lengthRange: (min: number, max: number, message?: string): ValidationRule => ({
    name: 'lengthRange',
    validator: (value: string) => {
      if (typeof value !== 'string') return false;
      return value.length >= min && value.length <= max;
    },
    message: message || `字符长度应在${min}-${max}之间`
  }),

  // 正则表达式验证
  pattern: (regex: RegExp, message: string): ValidationRule => ({
    name: 'pattern',
    validator: (value: string) => {
      if (typeof value !== 'string') return false;
      return regex.test(value);
    },
    message
  }),

  // 邮箱验证
  email: (message = '请输入有效的邮箱地址'): ValidationRule => ({
    name: 'email',
    validator: (value: string) => {
      if (typeof value !== 'string') return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message
  }),

  // 数字验证
  numeric: (message = '请输入有效的数字'): ValidationRule => ({
    name: 'numeric',
    validator: (value: any) => {
      return !isNaN(Number(value)) && isFinite(Number(value));
    },
    message
  }),

  // 整数验证
  integer: (message = '请输入整数'): ValidationRule => ({
    name: 'integer',
    validator: (value: any) => {
      const num = Number(value);
      return Number.isInteger(num);
    },
    message
  }),

  // 范围验证
  range: (min: number, max: number, message?: string): ValidationRule => ({
    name: 'range',
    validator: (value: any) => {
      const num = Number(value);
      if (isNaN(num)) return false;
      return num >= min && num <= max;
    },
    message: message || `数值应在${min}-${max}之间`
  }),

  // 禁止特殊字符
  noSpecialChars: (message = '不允许包含特殊字符'): ValidationRule => ({
    name: 'noSpecialChars',
    validator: (value: string) => {
      if (typeof value !== 'string') return false;
      const specialCharsRegex = /[<>\"'&]/;
      return !specialCharsRegex.test(value);
    },
    message
  }),

  // 中文字符验证
  chinese: (message = '只允许输入中文字符'): ValidationRule => ({
    name: 'chinese',
    validator: (value: string) => {
      if (typeof value !== 'string') return false;
      const chineseRegex = /^[\u4e00-\u9fa5]+$/;
      return chineseRegex.test(value);
    },
    message
  }),

  // 英文字符验证
  english: (message = '只允许输入英文字符'): ValidationRule => ({
    name: 'english',
    validator: (value: string) => {
      if (typeof value !== 'string') return false;
      const englishRegex = /^[a-zA-Z]+$/;
      return englishRegex.test(value);
    },
    message
  }),

  // 字母数字验证
  alphanumeric: (message = '只允许输入字母和数字'): ValidationRule => ({
    name: 'alphanumeric',
    validator: (value: string) => {
      if (typeof value !== 'string') return false;
      const alphanumericRegex = /^[a-zA-Z0-9]+$/;
      return alphanumericRegex.test(value);
    },
    message
  })
};

// 验证工具类
export class ValidationUtils {
  // 验证单个值
  static validateValue(
    value: any,
    rules: ValidationRule[],
    fieldName?: string
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    for (const rule of rules) {
      if (!rule.validator(value)) {
        const error = ErrorHandler.createError(
          ErrorType.VALIDATION_ERROR,
          ErrorSeverity.LOW,
          rule.message,
          undefined,
          'ValidationUtils'
        ) as ValidationError;

        error.field = fieldName;
        error.value = value;
        error.rules = [rule.name];

        errors.push(error);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // 验证消息内容
  static validateMessage(message: string): ValidationResult {
    const rules = [
      ValidationRules.required('消息不能为空'),
      ValidationRules.minLength(1, '消息至少需要1个字符'),
      ValidationRules.maxLength(2000, '消息不能超过2000个字符'),
      ValidationRules.noSpecialChars('消息不能包含特殊字符')
    ];

    const result = this.validateValue(message, rules, 'message');

    // 添加额外的警告
    if (message.length > 1000) {
      result.warnings = result.warnings || [];
      result.warnings.push('消息较长，可能影响AI响应速度');
    }

    if (message.split('\n').length > 10) {
      result.warnings = result.warnings || [];
      result.warnings.push('消息行数较多，建议分段发送');
    }

    return result;
  }

  // 验证角色名称
  static validateCharacterName(name: string): ValidationResult {
    const rules = [
      ValidationRules.required('角色名称不能为空'),
      ValidationRules.lengthRange(1, 20, '角色名称长度应在1-20个字符之间'),
      ValidationRules.noSpecialChars('角色名称不能包含特殊字符')
    ];

    return this.validateValue(name, rules, 'characterName');
  }

  // 验证API密钥
  static validateApiKey(apiKey: string): ValidationResult {
    const rules = [
      ValidationRules.required('API密钥不能为空'),
      ValidationRules.minLength(10, 'API密钥长度不足'),
      ValidationRules.pattern(/^[a-zA-Z0-9\-_]+$/, 'API密钥格式不正确')
    ];

    return this.validateValue(apiKey, rules, 'apiKey');
  }

  // 验证URL
  static validateUrl(url: string): ValidationResult {
    const rules = [
      ValidationRules.required('URL不能为空'),
      ValidationRules.pattern(
        /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
        '请输入有效的URL地址'
      )
    ];

    return this.validateValue(url, rules, 'url');
  }

  // 清理和净化输入
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .trim() // 去除首尾空格
      .replace(/\s+/g, ' ') // 合并多个空格
      .replace(/[<>\"'&]/g, '') // 移除特殊字符
      .substring(0, 2000); // 限制长度
  }

  // 检查消息长度
  static checkMessageLength(message: string): boolean {
    return typeof message === 'string' && 
           message.trim().length > 0 && 
           message.length <= 2000;
  }

  // 检查是否包含敏感内容
  static checkSensitiveContent(content: string): ValidationResult {
    const sensitivePatterns = [
      /密码|password/i,
      /身份证|id\s*card/i,
      /银行卡|bank\s*card/i,
      /手机号|phone\s*number/i,
      /邮箱|email/i
    ];

    const warnings: string[] = [];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(content)) {
        warnings.push('检测到可能的敏感信息，请注意保护隐私');
        break;
      }
    }

    return {
      isValid: true,
      errors: [],
      warnings
    };
  }

  // 批量验证
  static validateMultiple(
    data: Record<string, any>,
    rules: Record<string, ValidationRule[]>
  ): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {};

    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = data[field];
      results[field] = this.validateValue(value, fieldRules, field);
    }

    return results;
  }

  // 检查验证结果是否全部通过
  static isAllValid(results: Record<string, ValidationResult>): boolean {
    return Object.values(results).every(result => result.isValid);
  }

  // 获取所有错误信息
  static getAllErrors(results: Record<string, ValidationResult>): ValidationError[] {
    const allErrors: ValidationError[] = [];
    
    for (const result of Object.values(results)) {
      allErrors.push(...result.errors);
    }

    return allErrors;
  }

  // 获取所有警告信息
  static getAllWarnings(results: Record<string, ValidationResult>): string[] {
    const allWarnings: string[] = [];
    
    for (const result of Object.values(results)) {
      if (result.warnings) {
        allWarnings.push(...result.warnings);
      }
    }

    return allWarnings;
  }

  // 格式化错误信息
  static formatErrors(errors: ValidationError[]): string {
    if (errors.length === 0) {
      return '';
    }

    if (errors.length === 1) {
      return errors[0].userMessage || errors[0].message;
    }

    return errors
      .map((error, index) => `${index + 1}. ${error.userMessage || error.message}`)
      .join('\n');
  }

  // 创建自定义验证规则
  static createCustomRule(
    name: string,
    validator: (value: any) => boolean,
    message: string
  ): ValidationRule {
    return {
      name,
      validator,
      message
    };
  }
} 