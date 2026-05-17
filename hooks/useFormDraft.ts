'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 草稿存储数据结构
 */
interface DraftStorage<T> {
  data: Partial<T>;
  timestamp: number;
}

/**
 * useFormDraft 配置选项
 */
export interface UseFormDraftOptions<T> {
  /** sessionStorage 中的存储键名 */
  key: string;
  /** 防抖延迟时间（毫秒），默认 500ms */
  debounceMs?: number;
  /** 需要排除的敏感字段 */
  excludeFields?: (keyof T)[];
  /** 草稿过期时间（毫秒），默认 24 小时 */
  expiresIn?: number;
}

/**
 * useFormDraft 返回值接口
 */
export interface UseFormDraftReturn<T> {
  /** 恢复保存的草稿 */
  restoreDraft: () => Partial<T> | null;
  /** 保存草稿 */
  saveDraft: (data: Partial<T>) => void;
  /** 清除草稿 */
  clearDraft: () => void;
  /** 是否存在有效草稿 */
  hasDraft: boolean;
}

const DEFAULT_DEBOUNCE_MS = 500;
const DEFAULT_EXPIRES_IN = 24 * 60 * 60 * 1000; // 24 hours

/**
 * 表单草稿持久化 Hook
 *
 * 将表单数据自动保存到 sessionStorage，支持：
 * - 防抖保存避免频繁写入
 * - 敏感字段排除
 * - 草稿过期处理
 * - 自动恢复
 *
 * @example
 * ```tsx
 * const { restoreDraft, saveDraft, clearDraft, hasDraft } = useFormDraft({
 *   key: 'contact-form',
 *   excludeFields: ['password'],
 * });
 *
 * useEffect(() => {
 *   const draft = restoreDraft();
 *   if (draft) {
 *     // Restore form values
 *   }
 * }, []);
 *
 * // Save on form change
 * saveDraft(formValues);
 *
 * // Clear on successful submit
 * clearDraft();
 * ```
 */
export function useFormDraft<T extends Record<string, unknown>>({
  key,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  excludeFields = [],
  expiresIn = DEFAULT_EXPIRES_IN,
}: UseFormDraftOptions<T>): UseFormDraftReturn<T> {
  const [hasDraft, setHasDraft] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return checkDraftExists(key, expiresIn);
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDataRef = useRef<Partial<T> | null>(null);

  /**
   * 检查是否存在有效草稿
   */
  function checkDraftExists(storageKey: string, expiry: number): boolean {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (!stored) return false;

      const parsed: DraftStorage<T> = JSON.parse(stored);
      const isExpired = Date.now() - parsed.timestamp > expiry;

      return !isExpired;
    } catch {
      return false;
    }
  }

  /**
   * 恢复保存的草稿
   */
  const restoreDraft = useCallback((): Partial<T> | null => {
    if (typeof window === 'undefined') return null;

    try {
      const stored = sessionStorage.getItem(key);
      if (!stored) return null;

      const parsed: DraftStorage<T> = JSON.parse(stored);

      // 检查是否过期
      const isExpired = Date.now() - parsed.timestamp > expiresIn;
      if (isExpired) {
        sessionStorage.removeItem(key);
        setHasDraft(false);
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  }, [key, expiresIn]);

  /**
   * 执行实际的保存操作
   */
  const performSave = useCallback(
    (data: Partial<T>) => {
      if (typeof window === 'undefined') return;

      try {
        // 过滤敏感字段
        const filteredData = { ...data };
        excludeFields.forEach((field) => {
          delete filteredData[field];
        });

        const storage: DraftStorage<T> = {
          data: filteredData,
          timestamp: Date.now(),
        };

        sessionStorage.setItem(key, JSON.stringify(storage));
        setHasDraft(true);
      } catch (error) {
        // sessionStorage 可能已满或被禁用
      }
    },
    [key, excludeFields]
  );

  /**
   * 保存草稿（带防抖）
   */
  const saveDraft = useCallback(
    (data: Partial<T>) => {
      pendingDataRef.current = data;

      // 清除之前的定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 设置新的定时器
      timeoutRef.current = setTimeout(() => {
        if (pendingDataRef.current) {
          performSave(pendingDataRef.current);
          pendingDataRef.current = null;
        }
      }, debounceMs);
    },
    [debounceMs, performSave]
  );

  /**
   * 清除草稿
   */
  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;

    // 清除待保存的数据
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingDataRef.current = null;

    sessionStorage.removeItem(key);
    setHasDraft(false);
  }, [key]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    restoreDraft,
    saveDraft,
    clearDraft,
    hasDraft,
  };
}
