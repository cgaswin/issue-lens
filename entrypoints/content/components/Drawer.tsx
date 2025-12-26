import * as React from 'react';
import { XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Drawer({ open, onClose, children, className }: DrawerProps) {
  const [shouldRender, setShouldRender] = React.useState(open);

  React.useEffect(() => {
    if (open) setShouldRender(true);
  }, [open]);

  const onAnimationEnd = () => {
    if (!open) setShouldRender(false);
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[9998] bg-black/25 cursor-pointer", // Added cursor-pointer
          open ? "animate-fade-in" : "animate-fade-out"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed inset-y-0 right-0 z-[9999] flex flex-col",
          "w-[360px] sm:w-[400px] max-w-[90vw]",
          "bg-card border-l border-border",
          "shadow-xl",
          open ? "animate-slide-in" : "animate-slide-out",
          className
        )}
        onAnimationEnd={onAnimationEnd}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer" // Added cursor-pointer
          aria-label="Close"
        >
          <XIcon className="h-4 w-4" />
        </button>

        {children}
      </div>
    </>
  );
}

// ... rest remains same but make sure no changes lost
interface DrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> { }

export function DrawerHeader({ className, ...props }: DrawerHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 px-4 py-3 border-b border-border bg-secondary/50",
        className
      )}
      {...props}
    />
  );
}

interface DrawerTitleProps extends React.HTMLAttributes<HTMLHeadingElement> { }

export function DrawerTitle({ className, ...props }: DrawerTitleProps) {
  return (
    <h2
      className={cn("text-sm font-semibold text-foreground", className)}
      {...props}
    />
  );
}

interface DrawerDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> { }

export function DrawerDescription({ className, ...props }: DrawerDescriptionProps) {
  return (
    <p
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

interface DrawerContentProps extends React.HTMLAttributes<HTMLDivElement> { }

export function DrawerContent({ className, ...props }: DrawerContentProps) {
  return (
    <div
      className={cn("flex-1 overflow-auto", className)}
      {...props}
    />
  );
}

interface DrawerFooterProps extends React.HTMLAttributes<HTMLDivElement> { }

export function DrawerFooter({ className, ...props }: DrawerFooterProps) {
  return (
    <div
      className={cn("px-4 py-3 border-t border-border bg-secondary/30", className)}
      {...props}
    />
  );
}
