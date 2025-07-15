import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as Icons from "lucide-react";

export default function IconsPage() {
  const iconNames = Object.keys(Icons).filter(
    (key) =>
      typeof (Icons as any)[key] === "object" &&
      (Icons as any)[key].displayName
  );

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Icon Library"
        description="Available icons from the Lucide icon set."
      />
      <Card>
        <CardHeader>
          <CardTitle>Icons ({iconNames.length})</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
          {iconNames.map((iconName) => {
            const IconComponent = (Icons as any)[iconName];
            return (
              <div
                key={iconName}
                className="flex flex-col items-center justify-center gap-2 p-2 rounded-md border aspect-square"
              >
                <IconComponent className="h-6 w-6" />
                <span className="text-xs text-center truncate w-full">
                  {iconName}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
