
'use client';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Settings, Users, CheckCircle } from "lucide-react";
import Link from 'next/link';
import { useTabs } from "@/components/tabs/tab-provider";

const kpiData = [
  { title: "Total Certificates", value: "1,254", icon: FileText, change: "+12.5%", color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/50" },
  { title: "Masters Configured", value: "10", icon: Settings, change: "+2", color: "text-purple-500", bgColor: "bg-purple-100 dark:bg-purple-900/50" },
  { title: "Active Customers", value: "87", icon: Users, change: "-2.1%", color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-900/50" },
  { title: "Certificates Issued (Month)", value: "112", icon: CheckCircle, change: "+5.8%", color: "text-orange-500", bgColor: "bg-orange-100 dark:bg-orange-900/50" },
];

export default function DashboardPage() {
  const { addTab } = useTabs();
  
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, title: string) => {
    e.preventDefault();
    addTab({ id: href, title, path: href });
  };

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Welcome, Admin!"
        description="Here's a snapshot of your certification activities."
        actionButtonText="New Certificate"
        actionButtonLink="/certificates/new"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">List of recently generated certificates will be shown here.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
             <a href="/masters/customers" onClick={(e) => handleLinkClick(e, '/masters/customers', 'Manage Customers')} className="text-primary hover:underline">Manage Customers</a>
             <a href="/masters/grades" onClick={(e) => handleLinkClick(e, '/masters/grades', 'Manage Grades')} className="text-primary hover:underline">Manage Grades</a>
             <a href="/certificates" onClick={(e) => handleLinkClick(e, '/certificates', 'View All Certificates')} className="text-primary hover:underline">View All Certificates</a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
