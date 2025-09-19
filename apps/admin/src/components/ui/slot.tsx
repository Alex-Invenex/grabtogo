'use client'

import * as React from 'react'

interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
}

const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, ref) => {
    if (React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        ...(children.props as any),
        ref,
      })
    }

    if (React.Children.count(children) > 1) {
      return React.Children.only(children)
    }

    return children as React.ReactElement
  }
)

Slot.displayName = 'Slot'

export { Slot }