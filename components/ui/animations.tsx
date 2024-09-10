"use client"

import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { ReactNode } from "react"

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
}

export const FadeIn = ({
  children,
  className,
  delay = 0,
  duration = 0.5,
}: FadeInProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration, delay }}
    className={cn(className)}
  >
    {children}
  </motion.div>
)

export const SlideIn = ({
  children,
  className,
  delay = 0,
  duration = 0.5,
}: FadeInProps) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration, delay }}
    className={cn(className)}
  >
    {children}
  </motion.div>
)

export const ScaleIn = ({
  children,
  className,
  delay = 0,
  duration = 0.5,
}: FadeInProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration, delay }}
    className={cn(className)}
  >
    {children}
  </motion.div>
)

export const PopIn = ({
  children,
  className,
  delay = 0,
}: FadeInProps) => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{
      type: "spring",
      stiffness: 260,
      damping: 20,
      delay,
    }}
    className={cn(className)}
  >
    {children}
  </motion.div>
)
