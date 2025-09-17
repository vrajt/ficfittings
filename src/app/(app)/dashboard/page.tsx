
'use client';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Settings, Users, CheckCircle, BarChart3, List, Link as LinkIcon, Building, Star } from "lucide-react";
import { useTabs } from "@/components/tabs/tab-provider";
import * as React from 'react';
import axios from 'axios';
import type { TcMain, Customer } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, DonutChart } from "recharts";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalCertificates: number;
  monthlyCertificates: number;
  activeCustomers: number;
  mastersConfigured: { name: string, count: number }[];
}

interface MonthlyCertificatesChartData {
  name: string;
  count: number;
}

interface BranchData {
    name: string;
    value: number;
    fill: string;
}

interface TopCustomerData {
    name: string;
    count: number;
}


export default function DashboardPage() {
  const { addTab } = useTabs();
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [chartData, setChartData] = React.useState<MonthlyCertificatesChartData[]>([]);
  const [branchData, setBranchData] = React.useState<BranchData[]>([]);
  const [recentCerts, setRecentCerts] = React.useState<TcMain[]>([]);
  const [topCustomers, setTopCustomers] = React.useState<TopCustomerData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [certsRes, customersRes, mastersRes] = await Promise.all([
            axios.get<TcMain[]>('/api/tcmain'),
            axios.get<Customer[]>('/api/customers'),
             Promise.all([
                axios.get('/api/unitmaster'),
                axios.get('/api/productgrades'),
                axios.get('/api/tcremarksfix'),
                axios.get('/api/dimension-standards'),
                axios.get('/api/mtcstandards'),
                axios.get('/api/start-materials'),
                axios.get('/api/laboratories'),
                axios.get('/api/heattestmaster'),
                axios.get('/api/othertests'),
             ])
        ]);

        const allCerts = certsRes.data;
        const allCustomers = customersRes.data;
        const mastersCounts = [
            { name: 'Units', count: mastersRes[0].data.length },
            { name: 'Product Grades', count: mastersRes[1].data.length },
            { name: 'Remarks', count: mastersRes[2].data.length },
            { name: 'Dim. Standards', count: mastersRes[3].data.length },
            { name: 'TC Standards', count: mastersRes[4].data.length },
            { name: 'Start Materials', count: mastersRes[5].data.length },
            { name: 'Labs', count: mastersRes[6].data.length },
            { name: 'Heat Tests', count: mastersRes[7].data.length },
            { name: 'Other Tests', count: mastersRes[8].data.length },
        ];
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyCertificates = allCerts.filter(c => {
          const certDate = new Date(c.DocDate);
          return certDate.getMonth() === currentMonth && certDate.getFullYear() === currentYear;
        }).length;
        
        setStats({
          totalCertificates: allCerts.length,
          monthlyCertificates: monthlyCertificates,
          activeCustomers: allCustomers.filter(c => !c.isBlocked).length,
          mastersConfigured: mastersCounts,
        });
        
        // --- Process Chart Data (Last 12 Months) ---
        const monthCounts: { [key: string]: number } = {};
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = format(d, 'MMM yy');
            monthCounts[monthKey] = 0;
        }

        allCerts.forEach(cert => {
            const certDate = new Date(cert.DocDate);
            if (certDate >= new Date(now.getFullYear(), now.getMonth() - 11, 1)) {
              const monthKey = format(certDate, 'MMM yy');
              if (monthCounts[monthKey] !== undefined) {
                  monthCounts[monthKey]++;
              }
            }
        });

        const formattedChartData = Object.keys(monthCounts).map(key => ({ name: key, count: monthCounts[key] }));
        setChartData(formattedChartData);
        
        // --- Process Recent Certs ---
        const sortedCerts = [...allCerts].sort((a, b) => new Date(b.DocDate).getTime() - new Date(a.DocDate).getTime());
        setRecentCerts(sortedCerts.slice(0, 5));

        // --- Process Branch Data for Donut Chart ---
        const nimcCount = allCerts.filter(c => c.BranchId === 1).length;
        const ficCount = allCerts.filter(c => c.BranchId === 2).length;
        setBranchData([
            { name: 'NIMC', value: nimcCount, fill: 'hsl(var(--chart-1))' },
            { name: 'FIC', value: ficCount, fill: 'hsl(var(--chart-2))' },
        ]);
        
        // --- Process Top Customers ---
        const customerCounts = allCerts.reduce((acc, cert) => {
            acc[cert.AccName] = (acc[cert.AccName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const sortedCustomers = Object.entries(customerCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
        setTopCustomers(sortedCustomers);


      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, title: string) => {
    e.preventDefault();
    addTab({ id: href, title, path: href });
  };
  
  const handleCertClick = (cert: TcMain) => {
    const path = `/certificates/${cert.Id}`;
    addTab({ id: path, title: `Edit: ${cert.ApsFullDoc}`, path });
  };

  const kpiData = [
    { title: "Total Certificates", value: stats?.totalCertificates, icon: FileText, color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/50" },
    { title: "Active Customers", value: stats?.activeCustomers, icon: Users, color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-900/50" },
    { title: "Issued This Month", value: stats?.monthlyCertificates, icon: CheckCircle, color: "text-orange-500", bgColor: "bg-orange-100 dark:bg-orange-900/50" },
  ];

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Welcome, Admin!"
        description="Here's a snapshot of your certification activities."
        actionButtonText="New Certificate"
        actionButtonLink="/certificates/new"
      />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiData.map((kpi) => (
            <Card key={kpi.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${kpi.bgColor}`}>
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                </CardHeader>
                <CardContent>
                {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                    <div className="text-2xl font-bold">{kpi.value ?? 0}</div>
                )}
                </CardContent>
            </Card>
            ))}
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Masters Configured</CardTitle>
                     <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
                        <Settings className="h-4 w-4 text-purple-500" />
                    </div>
                </CardHeader>
                <CardContent>
                {isLoading ? (
                    <Skeleton className="h-8 w-full mt-1" />
                ) : (
                    <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs pt-2">
                       {stats?.mastersConfigured.map(m => (
                           <div key={m.name} className="flex justify-between items-center">
                               <span>{m.name}</span>
                               <span className="font-bold">{m.count}</span>
                           </div>
                       ))}
                    </div>
                )}
                </CardContent>
            </Card>
        </div>


        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Certificates Issued (Last 12 Months)</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] w-full">
                {isLoading ? (
                <Skeleton className="h-full w-full" />
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            borderColor: 'hsl(var(--border))', 
                            borderRadius: 'var(--radius)' 
                        }}
                    />
                    <Legend wrapperStyle={{fontSize: "14px"}}/>
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Certificates" />
                    </BarChart>
                </ResponsiveContainer>
                )}
            </CardContent>
            </Card>
            
            <div className="lg:col-span-2 grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> Branch Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[150px] w-full">
                        {isLoading ? (
                            <Skeleton className="h-full w-full" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={branchData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5}>
                                        {branchData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5" /> Top 5 Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-3">
                                {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                            </div>
                        ) : topCustomers.length > 0 ? (
                            <div className="space-y-2">
                                {topCustomers.map((customer) => (
                                    <div key={customer.name} className="flex justify-between items-center text-sm p-1 rounded-md hover:bg-muted">
                                        <p className="font-medium truncate pr-2">{customer.name}</p>
                                        <span className="font-bold text-primary">{customer.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <p className="text-sm text-muted-foreground text-center py-4">No customer data available.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><List className="h-5 w-5" /> Recent Certificates</CardTitle>
            </CardHeader>
            <CardContent>
                    {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                ) : recentCerts.length > 0 ? (
                        <div className="space-y-2">
                        {recentCerts.map(cert => (
                            <Button
                                key={cert.Id}
                                variant="ghost"
                                className="flex justify-between items-center w-full h-auto p-2"
                                onClick={() => handleCertClick(cert)}
                            >
                                <div className="text-left">
                                    <p className="font-semibold text-primary">{cert.ApsFullDoc}</p>
                                    <p className="text-sm text-muted-foreground">{cert.AccName}</p>
                                </div>
                                <span className="text-xs text-muted-foreground">{format(new Date(cert.DocDate), "dd-MMM-yyyy")}</span>
                            </Button>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent certificates found.</p>
                )}
            </CardContent>
            </Card>
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5" /> Quick Links</CardTitle>
                 <CardDescription>Navigate to key areas of the application.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline">
                    <a href="/masters/customers" onClick={(e) => handleLinkClick(e, '/masters/customers', 'Manage Customers')}>Customers</a>
                </Button>
                 <Button asChild variant="outline">
                    <a href="/masters/product-grades" onClick={(e) => handleLinkClick(e, '/masters/product-grades', 'Manage Product Grades')}>Grades</a>
                </Button>
                 <Button asChild variant="outline">
                    <a href="/certificates" onClick={(e) => handleLinkClick(e, '/certificates', 'View All Certificates')}>Certificates</a>
                </Button>
                 <Button asChild variant="outline">
                    <a href="/masters/lot-test-values" onClick={(e) => handleLinkClick(e, '/masters/lot-test-values', 'Lot Test Values')}>Test Values</a>
                </Button>
            </CardContent>
            </Card>
        </div>
    </div>
  );
}
