'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Geo API 响应数据结构
 */
interface GeoApiResponse {
  success: boolean;
  data?: {
    countryCode: string;
    countryName: string;
  };
  error?: string;
}

/**
 * useGeoCountry 返回值接口
 */
export interface UseGeoCountryReturn {
  /** 检测到的国家代码（ISO 3166-1 alpha-2） */
  countryCode: string | null;
  /** 检测到的国家名称（英文） */
  countryName: string | null;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误消息 */
  error: string | null;
}

/**
 * 地理位置国家检测 Hook
 *
 * 调用 /api/geo 端点，根据请求头中的地理位置信息
 * 自动检测用户所在国家。
 *
 * @returns {UseGeoCountryReturn} 国家信息、加载状态和错误信息
 *
 * @example
 * ```tsx
 * const { countryCode, isLoading, error } = useGeoCountry();
 *
 * useEffect(() => {
 *   if (countryCode && !currentValue) {
 *     setValue('country', countryCode);
 *   }
 * }, [countryCode]);
 * ```
 */
export function useGeoCountry(): UseGeoCountryReturn {
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [countryName, setCountryName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // 防止重复请求
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const detectCountry = async () => {
      try {
        const response = await fetch('/api/geo');

        if (!response.ok) {
          const data: GeoApiResponse = await response.json();
          setError(data.error || 'Failed to detect country');
          setIsLoading(false);
          return;
        }

        const data: GeoApiResponse = await response.json();

        if (data.success && data.data) {
          setCountryCode(data.data.countryCode);
          setCountryName(data.data.countryName);
        } else {
          setError(data.error || 'Country not detected');
        }
      } catch (err) {
        setError('Failed to detect country');
      } finally {
        setIsLoading(false);
      }
    };

    detectCountry();
  }, []);

  return {
    countryCode,
    countryName,
    isLoading,
    error,
  };
}
