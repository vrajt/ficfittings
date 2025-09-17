
'use client';
import AppHeader from "@/components/app-header";
import AppSidebar from "@/components/app-sidebar";
import { TabProvider, TabBar, TabContent, useTabs } from "@/components/tabs/tab-provider";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import * as React from "react";
import { navConfig } from "@/lib/nav-config";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const { addTab, tabs, setActiveTab, activeTab } = useTabs();
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const findNavItem = (path: string) => {
        for (const item of navConfig) {
            if (item.href === path) return item;
            if (item.children) {
                const childItem = item.children.find(child => child.href === path);
                if (childItem) return childItem;
            }
        }
        // Handle dynamic paths like /certificates/[id]
        if (path.startsWith('/certificates/')) {
            return { id: path, title: 'Edit Certificate', path: path };
        }
        return null;
    };
    
    React.useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);
    
    React.useEffect(() => {
        if (isAuthenticated && pathname) {
            const tabExists = tabs.some(tab => tab.path === pathname);
            if (!tabExists) {
                const navItem = findNavItem(pathname);
                let title = 'Dashboard'; // Default title
                if (navItem) {
                    title = navItem.title;
                } else if (pathname.startsWith('/certificates/new')) {
                    title = 'New Certificate';
                } else if (pathname.startsWith('/certificates/')) {
                    // Title will be updated in the page component once data loads
                    title = 'Loading...';
                }
                
                const newTab = { id: pathname, title: title, path: pathname };
                addTab(newTab);
                setActiveTab(newTab.id);
            } else {
                 const tabForPath = tabs.find(t => t.path === pathname);
                 if (tabForPath && activeTab !== tabForPath.id) {
                    setActiveTab(tabForPath.id);
                 }
            }
        }
    }, [isAuthenticated, pathname, tabs, addTab, setActiveTab, activeTab]);
    
    
    if (isLoading || !isAuthenticated) {
        return (
           <div className="flex h-screen w-full items-center justify-center bg-background">
             <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
                <p className="text-muted-foreground">Authenticating...</p>
             </div>
           </div>
        );
    }
    
    return (
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
    )
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TabProvider>
        <AppLayoutContent>{children}</AppLayoutContent>
    </TabProvider>
  );
}
