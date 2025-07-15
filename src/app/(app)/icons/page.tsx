
'use client';

import * as React from 'react';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as Icons from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export default function IconsPage() {
  const { toast } = useToast();
  const [selectedIcon, setSelectedIcon] = React.useState<{ name: string; component: React.ComponentType } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const allIconNames = Object.keys(Icons).filter(
    (key) =>
      typeof (Icons as any)[key] === "object" &&
      (Icons as any)[key].displayName &&
      key !== 'createLucideIcon' &&
      key !== 'Icon'
  );

  const filteredIconNames = allIconNames.filter(name =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleIconClick = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    setSelectedIcon({ name: iconName, component: IconComponent });
    setIsDialogOpen(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      description: `The code snippet has been copied successfully.`,
    });
  };

  const codeSnippet = selectedIcon ? `<${selectedIcon.name} />` : '';
  const importStatement = selectedIcon ? `import { ${selectedIcon.name} } from 'lucide-react';` : '';

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Icon Library"
        description="Available icons from the Lucide icon set. Click on an icon to get its code."
      />
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Icons ({filteredIconNames.length} of {allIconNames.length})</CardTitle>
            <Input
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
          {filteredIconNames.map((iconName) => {
            const IconComponent = (Icons as any)[iconName];
            return (
              <button
                key={iconName}
                onClick={() => handleIconClick(iconName)}
                className="flex flex-col items-center justify-center gap-2 p-2 rounded-md border aspect-square transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label={`Open code for ${iconName} icon`}
              >
                <IconComponent className="h-6 w-6" />
                <span className="text-xs text-center truncate w-full">
                  {iconName}
                </span>
              </button>
            );
          })}
           {filteredIconNames.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-10">
              No icons found for &quot;{searchTerm}&quot;.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Icon: {selectedIcon?.name}</DialogTitle>
            <DialogDescription>
              Use the following code to include this icon in your project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Import</h4>
              <div className="relative">
                <code className="block bg-muted text-muted-foreground p-3 rounded-md text-xs overflow-x-auto">
                  {importStatement}
                </code>
                 <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-1/2 right-2 -translate-y-1/2 h-7 w-7"
                  onClick={() => handleCopy(importStatement)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Usage</h4>
              <div className="relative">
                <code className="block bg-muted text-muted-foreground p-3 rounded-md text-xs overflow-x-auto">
                  {codeSnippet}
                </code>
                 <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-1/2 right-2 -translate-y-1/2 h-7 w-7"
                  onClick={() => handleCopy(codeSnippet)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
