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
        <span className={cn('flex items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(250,80%,60%)] to-[hsl(220,90%,55%)] text-white shadow-sm', s.icon)}>
          <span className={cn('font-bold', s.iconText)}>P</span>
        </span>
      )}
      <span className={cn('font-bold tracking-tight bg-gradient-to-r from-[hsl(250,70%,55%)] to-[hsl(220,80%,50%)] dark:from-[hsl(250,80%,70%)] dark:to-[hsl(220,90%,65%)] bg-clip-text text-transparent', s.text)}>
        Prizelet
      </span>
    </span>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }

  return content;
}
