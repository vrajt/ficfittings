
'use client';
import AppHeader from "@/components/app-header";
import AppSidebar from "@/components/app-sidebar";
import { TabProvider, TabBar, TabContent } from "@/components/tabs/tab-provider";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
       <div className="flex h-screen w-full items-center justify-center">
         <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
         </div>
       </div>
    );
  }

  return (
    <TabProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar collapsible="icon">
            <AppSidebar />
          </Sidebar>
          <div className="flex flex-1 flex-col">
            <AppHeader />
            <SidebarInset>
              <TabBar />
              <main className="flex-1 overflow-y-auto bg-muted/20">
                <TabContent initialChildren={children} />
              </main>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </TabProvider>
  );
}
