import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import styles from './Button.module.css';

const baseClasses = 'inline-flex items-center justify-center gap-2 font-bold text-center rounded-md transition-all duration-200';

const variantsLookup = {
  solid: 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md',
  outline: 'border border-blue-500 text-blue-500 hover:bg-blue-50',
  subtle: 'text-blue-500 hover:bg-blue-50',
};

const sizesLookup = {
  base: 'px-4 py-2 text-sm',
  large: 'px-6 py-3 text-base',
};

type ButtonProps = {
  children: React.ReactNode;
  variant?: keyof typeof variantsLookup;
  size?: keyof typeof sizesLookup;
  href?: string;
  className?: string;
  glow?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement> & 
  React.AnchorHTMLAttributes<HTMLAnchorElement>;

const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ children, variant = 'solid', size = 'base', href, className, glow = false, ...props }, ref) => {
    const classes = cn(
      baseClasses,
      variantsLookup[variant],
      sizesLookup[size],
      glow && styles.glowOnHover,
      className
    );

    if (href) {
      return (
        <Link href={href} passHref legacyBehavior>
          <a className={classes} ref={ref as React.Ref<HTMLAnchorElement>} {...props}>
            {children}
          </a>
        </Link>
      );
    }

    return (
      <button className={classes} ref={ref as React.Ref<HTMLButtonElement>} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
