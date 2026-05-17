'use client'

import { useEffect, useState, useRef } from 'react'
import type { AnimationVariant } from '@/lib/animation'

/**
 * 检测系统是否设置了 prefers-reduced-motion
 *
 * @returns true 如果用户偏好减少动画
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return prefersReduced
}

/**
 * buildAnimationClassName 参数
 */
interface BuildAnimationClassNameOptions {
  variant: AnimationVariant
  isVisible: boolean
  delay?: number
  reducedMotion?: boolean
  disabled?: boolean
}

/**
 * 构建动画类名字符串
 *
 * 纯函数，根据状态生成对应的 CSS 类名组合。
 * 当 reducedMotion 或 disabled 为 true 时返回空字符串。
 */
export function buildAnimationClassName(options: BuildAnimationClassNameOptions): string {
  const { variant, isVisible, delay, reducedMotion, disabled } = options

  if (reducedMotion || disabled) {
    return ''
  }

  const classes = ['scroll-animate', `scroll-animate-${variant}`]

  if (isVisible) {
    classes.push('visible')
  }

  if (delay && delay > 0) {
    classes.push(`delay-${delay}`)
  }

  return classes.join(' ')
}

/**
 * useScrollAnimation Hook 参数
 */
interface UseScrollAnimationOptions {
  variant?: AnimationVariant
  delay?: number
  threshold?: number
  disabled?: boolean
}

/**
 * useScrollAnimation Hook 返回值
 */
interface UseScrollAnimationResult {
  ref: React.RefObject<HTMLElement | null>
  isVisible: boolean
  animationClassName: string
}

/**
 * 滚动动画 Hook
 *
 * 使用 IntersectionObserver 检测元素是否进入视口，
 * 结合 CSS transition 实现 fade-in 效果。
 *
 * - 动画只触发一次（进入后 unobserve）
 * - 支持 prefers-reduced-motion
 * - 支持 disabled 状态
 *
 * @param options 配置选项
 * @returns { ref, isVisible, animationClassName }
 */
export function useScrollAnimation(
  options: UseScrollAnimationOptions = {}
): UseScrollAnimationResult {
  const {
    variant = 'fade-up',
    delay,
    threshold = 0.1,
    disabled = false,
  } = options

  const ref = useRef<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()

  const shouldAnimate = !disabled && !prefersReducedMotion

  useEffect(() => {
    if (!shouldAnimate) {
      setIsVisible(true)
      return
    }

    const element = ref.current
    if (!element) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.unobserve(entry.target)
          }
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px',
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [shouldAnimate, threshold])

  const animationClassName = buildAnimationClassName({
    variant,
    isVisible,
    delay,
    reducedMotion: prefersReducedMotion,
    disabled,
  })

  return { ref, isVisible, animationClassName }
}
