import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedListProps {
  children: ReactNode
  className?: string
}

export function AnimatedList({ children, className = '' }: AnimatedListProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function FadeIn({ children, className = '', delay = 0 }: FadeInProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {children}
    </motion.div>
  )
}