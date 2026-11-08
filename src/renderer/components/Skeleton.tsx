import { JSX } from 'preact'

export interface SkeletonProps {
  width?: string
  height?: string
  borderRadius?: string
}

export function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius = 'var(--radius-sm)'
}: SkeletonProps): JSX.Element {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--border-subtle)',
        animation: 'pulse 1.5s ease-in-out infinite'
      }}
    />
  )
}
