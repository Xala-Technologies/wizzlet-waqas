import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PrizeletLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  linkTo?: string;
  showIcon?: boolean;
}

export function PrizeletLogo({ size = 'md', className, linkTo = '/', showIcon = true }: PrizeletLogoProps) {
  const sizeClasses = {
    sm: { icon: 'h-6 w-6', iconText: 'text-caption', text: 'text-ui' },
    md: { icon: 'h-7 w-7', iconText: 'text-caption', text: 'text-ui' },
    lg: { icon: 'h-8 w-8', iconText: 'text-caption', text: 'text-title' },
  };

  const s = sizeClasses[size];

  const content = (
    <span className={cn('flex items-center gap-2 shrink-0', className)}>
      {showIcon && (
        <span
          className={cn(
            'flex items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm',
            s.icon,
          )}
        >
          <span className={cn('font-bold', s.iconText)}>P</span>
        </span>
      )}
      <span className={cn('font-bold tracking-tight text-foreground', s.text)}>
        Prizelet
      </span>
    </span>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }

  return content;
}
