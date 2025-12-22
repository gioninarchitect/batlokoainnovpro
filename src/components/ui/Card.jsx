import { forwardRef } from 'react'

const Card = forwardRef(({
  children,
  className = '',
  hover = true,
  padding = 'md',
  ...props
}, ref) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <div
      ref={ref}
      className={`
        bg-white rounded-2xl shadow-card
        transition-all duration-300
        ${hover ? 'hover:shadow-card-hover hover:-translate-y-2' : ''}
        ${paddings[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'

export default Card
