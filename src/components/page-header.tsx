
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
}

export function PageHeader({ title, description, actionButtonText, actionButtonLink, onActionClick }: PageHeaderProps) {
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

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="grid gap-1">
        <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {actionButtonText && (
        <a href={actionButtonLink || '#'} onClick={handleActionClick} className="w-full sm:w-auto">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button className="w-full sm:w-auto">
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
