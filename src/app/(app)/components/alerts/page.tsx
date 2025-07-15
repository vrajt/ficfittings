
'use client';

import * as React from 'react';
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal, Waves, AlertCircle, CheckCircle, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const alertSnippets = {
  default: {
    title: "Default Alert",
    component: (
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          This is a default informational alert. You can use it for general messages.
        </AlertDescription>
      </Alert>
    ),
    code: `
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

<Alert>
  <Terminal className="h-4 w-4" />
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    This is a default informational alert.
  </AlertDescription>
</Alert>
    `.trim(),
  },
  destructive: {
    title: "Destructive Alert",
    component: (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          This is a destructive alert. Use it for critical errors and warnings.
        </AlertDescription>
      </Alert>
    ),
    code: `
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    This is a destructive alert.
  </AlertDescription>
</Alert>
    `.trim(),
  },
  success: {
    title: "Success Alert",
    component: (
      <Alert variant="success">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>
          This is a success alert. Use it to indicate a successful operation.
        </AlertDescription>
      </Alert>
    ),
    code: `
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";

<Alert variant="success">
  <CheckCircle className="h-4 w-4" />
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>
    This is a success alert.
  </AlertDescription>
</Alert>
    `.trim(),
  },
  warning: {
    title: "Warning Alert",
    component: (
       <Alert variant="warning">
        <Waves className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
            This is a warning alert. Use it for non-critical warnings or potential issues.
        </AlertDescription>
      </Alert>
    ),
    code: `
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Waves } from "lucide-react";

<Alert variant="warning">
  <Waves className="h-4 w-4" />
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>
    This is a warning alert.
  </AlertDescription>
</Alert>
    `.trim(),
  }
};


export default function AlertsPage() {
  const { toast } = useToast();
  const [selectedAlert, setSelectedAlert] = React.useState<{ title: string; code: string } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleAlertClick = (key: keyof typeof alertSnippets) => {
    const alert = alertSnippets[key];
    setSelectedAlert({ title: alert.title, code: alert.code });
    setIsDialogOpen(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      description: `The code snippet has been copied successfully.`,
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Alert Components"
        description="A showcase of different alert styles. Click an alert to get the code."
      />
      <Card>
        <CardHeader>
          <CardTitle>Alert Variants</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {Object.entries(alertSnippets).map(([key, value]) => (
            <div 
              key={key} 
              onClick={() => handleAlertClick(key as keyof typeof alertSnippets)} 
              className="cursor-pointer transition-transform hover:scale-[1.01]"
              aria-label={`Get code for ${value.title}`}
              role="button"
            >
              {value.component}
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAlert?.title}</DialogTitle>
            <DialogDescription>
              Use the following code snippet to include this alert in your project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <pre className="block bg-muted text-muted-foreground p-3 rounded-md text-xs overflow-x-auto">
                <code>{selectedAlert?.code}</code>
              </pre>
              {selectedAlert && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => handleCopy(selectedAlert.code)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
