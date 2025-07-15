import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionButtonText?: string;
  actionButtonLink?: string;
}

export function PageHeader({ title, description, actionButtonText, actionButtonLink }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="grid gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {actionButtonText && actionButtonLink && (
        <Link href={actionButtonLink} passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            {actionButtonText}
          </Button>
        </Link>
      )}
    </div>
  );
}
