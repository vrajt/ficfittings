
import AppHeader from "@/components/app-header";
import AppSidebar from "@/components/app-sidebar";
import { TabProvider, TabBar, TabContent } from "@/components/tabs/tab-provider";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
