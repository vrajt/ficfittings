
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal, Waves, AlertCircle, CheckCircle } from "lucide-react";

export default function AlertsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Alert Components"
        description="A showcase of different alert styles for providing contextual feedback."
      />
      <Card>
        <CardHeader>
          <CardTitle>Alert Variants</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              This is a default informational alert. You can use it for general messages.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              This is a destructive alert. Use it for critical errors and warnings.
            </AlertDescription>
          </Alert>
           <Alert className="border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-700">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              This is a success alert. Use it to indicate a successful operation.
            </AlertDescription>
          </Alert>
           <Alert className="border-yellow-500/50 text-yellow-700 dark:border-yellow-500 [&>svg]:text-yellow-700">
            <Waves className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
                This is a warning alert. Use it for non-critical warnings or potential issues.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
