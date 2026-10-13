"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  /** Rendered beside the title, e.g. a cover. */
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** A centered Dialog on wider screens, a bottom Sheet on phones. */
export function ResponsiveDialog({ open, onOpenChange, title, description, aside, children, className }: ResponsiveDialogProps) {
  const desktop = useMediaQuery("(min-width: 640px)", true);

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "max-h-[calc(100dvh-3rem)] gap-6 overflow-y-auto p-6 sm:max-w-xl data-open:zoom-in-100 data-closed:zoom-out-100",
            className,
          )}
        >
          <DialogHeader className="flex-row items-end gap-5 text-left">
            {aside}
            <div className="flex min-w-0 flex-col gap-1.5">
              <DialogTitle className="font-serif text-2xl leading-tight font-normal text-balance">{title}</DialogTitle>
              <DialogDescription className="text-base">{description}</DialogDescription>
            </div>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={cn("max-h-[92dvh] gap-5 overflow-y-auto rounded-t-xl px-4 pb-6", className)}>
        <SheetHeader className="flex-row items-end gap-4 px-0 pt-6 pb-0 text-left">
          {aside}
          <div className="flex min-w-0 flex-col gap-1 pr-8">
            <SheetTitle className="font-serif text-xl leading-tight font-normal text-balance">{title}</SheetTitle>
            <SheetDescription className="text-sm">{description}</SheetDescription>
          </div>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
