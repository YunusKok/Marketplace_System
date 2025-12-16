import { useState, useEffect, useRef, RefObject } from 'react'

interface UseScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  staggerDelay?: number
  index?: number
}

interface UseScrollAnimationReturn {
  ref: RefObject<HTMLTableRowElement | null>
  isVisible: boolean
  animationStyle: React.CSSProperties
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}): UseScrollAnimationReturn => {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -30px 0px',
    staggerDelay = 50,
    index = 0
  } = options

  const ref = useRef<HTMLTableRowElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Animate in when entering, animate out when leaving
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true)
          }, index * staggerDelay)
        } else {
          setIsVisible(false)
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [index, staggerDelay, threshold, rootMargin])

  const animationStyle: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible 
      ? 'translateY(0) scale(1)' 
      : 'translateY(20px) scale(0.95)',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  }

  return { ref, isVisible, animationStyle }
}

export default useScrollAnimation
