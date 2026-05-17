'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { NAVBAR_HEIGHT, SCROLL_THRESHOLD, SECTION_IDS } from '@/lib/navigation'

/**
 * Hook to track if page has scrolled past a threshold
 *
 * @param threshold - Scroll distance in pixels to trigger state change (default: SCROLL_THRESHOLD)
 * @returns true if scrollY > threshold, false otherwise
 */
export function useScrollState(threshold: number = SCROLL_THRESHOLD): boolean {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > threshold
      setIsScrolled(scrolled)
    }

    // Check initial state
    handleScroll()

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  return isScrolled
}

/**
 * Hook to track which section is currently visible
 *
 * Uses IntersectionObserver to detect when sections enter the viewport
 *
 * @param sectionIds - Array of section IDs to observe (default: SECTION_IDS)
 * @returns The ID of the currently active section
 */
export function useActiveSection(sectionIds: readonly string[] = SECTION_IDS): string {
  const [activeSection, setActiveSection] = useState(sectionIds[0] || 'banner')

  useEffect(() => {
    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0,
    }

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    sectionIds.forEach((id) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [sectionIds])

  return activeSection
}

/**
 * Hook that returns a smooth scroll handler function
 *
 * @param navbarHeight - Height of navbar for offset calculation (default: NAVBAR_HEIGHT)
 * @returns Click handler function for navigation links
 */
export function useSmoothScroll(
  navbarHeight: number = NAVBAR_HEIGHT
): (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void {
  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault()
      const targetId = href.replace('#', '')
      const targetElement = document.getElementById(targetId)

      if (targetElement) {
        const targetPosition = targetElement.offsetTop - navbarHeight

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        })
      }
    },
    [navbarHeight]
  )

  return handleNavClick
}

/**
 * Mobile menu state and behavior hook
 *
 * Provides:
 * - isOpen state
 * - toggle/close functions
 * - ESC key to close
 * - Body scroll lock when open
 * - menuRef for focus trap implementation
 */
export interface UseMobileMenuReturn {
  isOpen: boolean
  toggle: () => void
  close: () => void
  menuRef: React.RefObject<HTMLDivElement | null>
}

export function useMobileMenu(): UseMobileMenuReturn {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return { isOpen, toggle, close, menuRef }
}
