import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface AnimatedContainerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  animation?: 'fade-in' | 'slide-up' | 'scale-in';
}

export function AnimatedContainer({ 
  children, 
  className,
  delay = 0,
  animation = 'fade-in'
}: AnimatedContainerProps) {
  const animationClass = {
    'fade-in': 'animate-fade-in',
    'slide-up': 'animate-slide-up',
    'scale-in': 'animate-scale-in',
  }[animation];

  return (
    <div 
      className={cn(animationClass, className)}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  );
}

interface StaggeredListProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
  animation?: 'fade-in' | 'slide-up' | 'scale-in';
}

export function StaggeredList({ 
  children, 
  className,
  staggerDelay = 50,
  animation = 'fade-in'
}: StaggeredListProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <AnimatedContainer 
          key={index} 
          delay={index * staggerDelay}
          animation={animation}
        >
          {child}
        </AnimatedContainer>
      ))}
    </div>
  );
}
