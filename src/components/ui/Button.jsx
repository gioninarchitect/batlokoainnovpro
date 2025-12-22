import { forwardRef } from 'react'
import { Link } from 'react-router-dom'

const variants = {
  primary: 'bg-safety text-white hover:bg-safety-dark shadow-button',
  secondary: 'bg-industrial text-white hover:bg-industrial-light',
  outline: 'bg-transparent border-2 border-industrial text-industrial hover:bg-industrial hover:text-white',
  ghost: 'bg-transparent text-industrial hover:bg-gray-100'
}

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg'
}

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  href,
  to,
  className = '',
  disabled = false,
  ...props
}, ref) => {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-heading font-semibold
    rounded-lg
    transition-all duration-300 ease-out
    transform hover:-translate-y-0.5 active:translate-y-0
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safety focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
  `

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`

  // External link
  if (href) {
    return (
      <a
        ref={ref}
        href={href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    )
  }

  // Internal link
  if (to) {
    return (
      <Link
        ref={ref}
        to={to}
        className={classes}
        {...props}
      >
        {children}
      </Link>
    )
  }

  // Button
  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
