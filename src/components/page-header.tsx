
'use client';

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useTabs } from "./tabs/tab-provider";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionButtonText?: string;
  actionButtonLink?: string;
}

export function PageHeader({ title, description, actionButtonText, actionButtonLink }: PageHeaderProps) {
  const { addTab } = useTabs();

  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (actionButtonLink && actionButtonText) {
      addTab({ id: actionButtonLink, title: actionButtonText, path: actionButtonLink });
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="grid gap-1">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {actionButtonText && actionButtonLink && (
        <a href={actionButtonLink} onClick={handleActionClick}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            {actionButtonText}
          </Button>
        </a>
      )}
    </div>
  );
}
