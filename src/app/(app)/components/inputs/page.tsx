import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function InputsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Input Components"
        description="A showcase of different input fields."
      />
      <Card>
        <CardHeader>
          <CardTitle>Input Fields</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="text-input">Text Input</Label>
            <Input id="text-input" placeholder="Enter some text" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-input">Email Input</Label>
            <Input id="email-input" type="email" placeholder="m@example.com" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="textarea-input">Text Area</Label>
            <Textarea id="textarea-input" placeholder="Enter a longer message" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
