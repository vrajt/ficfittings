
'use client';

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PlusCircle } from "lucide-react";
import { useTabs } from "./tabs/tab-provider";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionButtonText?: string;
  actionButtonLink?: string;
  onActionClick?: (e: React.MouseEvent) => void;
  tone?: 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'sky';
}

export function PageHeader({ title, description, actionButtonText, actionButtonLink, onActionClick, tone }: PageHeaderProps) {
  const { addTab } = useTabs();

  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onActionClick) {
        onActionClick(e);
        return;
    }
    if (actionButtonLink && actionButtonText) {
      addTab({ id: actionButtonLink, title: actionButtonText, path: actionButtonLink });
    }
  };

  const normalizedTitle = title.toLowerCase();
  const resolvedTone: NonNullable<PageHeaderProps['tone']> =
    tone ??
    (normalizedTitle.includes('customer')
      ? 'emerald'
      : normalizedTitle.includes('laborator')
      ? 'cyan'
      : normalizedTitle.includes('heat')
      ? 'rose'
      : normalizedTitle.includes('start material')
      ? 'amber'
      : normalizedTitle.includes('remark')
      ? 'sky'
      : 'violet');

  const toneClasses: Record<NonNullable<PageHeaderProps['tone']>, { bg: string; glow: string }> = {
    violet: { bg: 'to-primary/10', glow: 'bg-primary/15' },
    cyan: { bg: 'to-accent/12', glow: 'bg-accent/15' },
    emerald: { bg: 'to-emerald-500/10 dark:to-emerald-400/15', glow: 'bg-emerald-500/15 dark:bg-emerald-400/20' },
    amber: { bg: 'to-amber-500/10 dark:to-amber-400/15', glow: 'bg-amber-500/15 dark:bg-amber-400/20' },
    rose: { bg: 'to-rose-500/10 dark:to-rose-400/15', glow: 'bg-rose-500/15 dark:bg-rose-400/20' },
    sky: { bg: 'to-sky-500/10 dark:to-sky-400/15', glow: 'bg-sky-500/15 dark:bg-sky-400/20' },
  };

  return (
    <div className={`relative flex flex-col items-start justify-between gap-4 overflow-hidden rounded-xl border border-border/80 bg-gradient-to-r from-card via-card ${toneClasses[resolvedTone].bg} p-4 shadow-sm sm:flex-row sm:items-center md:p-5`}>
      <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl ${toneClasses[resolvedTone].glow}`} />
      <div className="grid gap-1.5">
        <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actionButtonText && (
        <a href={actionButtonLink || '#'} onClick={handleActionClick} className="w-full sm:w-auto">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button className="w-full shadow-sm sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {actionButtonText}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{actionButtonText}</p>
                </TooltipContent>
            </Tooltip>
        </a>
      )}
    </div>
  );
}
