import * as React from 'react';
import NextLink from 'next/link';
import { cn } from '@/lib/utils';

interface LinkProps extends React.ComponentPropsWithoutRef<typeof NextLink> {
  children: React.ReactNode;
  className?: string;
  href: string;
}

export function Link({ children, className, ...props }: LinkProps) {
  return (
    <NextLink
      className={cn(
        'font-medium underline underline-offset-4 hover:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </NextLink>
  );
}
