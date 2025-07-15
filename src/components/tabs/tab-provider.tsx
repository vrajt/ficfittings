
'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';

type Tab = {
  id: string;
  title: string;
  path: string;
  content?: React.ReactNode;
};

type TabContextType = {
  tabs: Tab[];
  activeTab: string | null;
  addTab: (tab: Omit<Tab, 'content'>) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
};

const TabContext = React.createContext<TabContextType | undefined>(undefined);

export function TabProvider({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = React.useState<Tab[]>([]);
  const [activeTab, setActiveTab] = React.useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // When the route changes, check if there is a tab for the new route
    const tabForPath = tabs.find(t => t.path === pathname);
    if (tabForPath) {
      if (activeTab !== tabForPath.id) {
         setActiveTab(tabForPath.id);
      }
    }
  }, [pathname, tabs, activeTab]);

  const addTab = (tab: Omit<Tab, 'content'>) => {
    const existingTab = tabs.find(t => t.id === tab.id);
    if (!existingTab) {
      setTabs(prevTabs => [...prevTabs, { ...tab, content: null }]);
    }
    setActiveTab(tab.id);
    router.push(tab.path);
  };

  const removeTab = (id: string) => {
    const tabIndex = tabs.findIndex(t => t.id === id);
    if (tabIndex === -1) return;

    let newActiveTabId: string | null = null;
    if (activeTab === id) {
      if (tabs.length > 1) {
        const newActiveTabIndex = tabIndex > 0 ? tabIndex - 1 : 0;
        newActiveTabId = tabs[newActiveTabIndex === tabIndex ? tabIndex + 1 : newActiveTabIndex].id;
      }
    }

    setTabs(tabs.filter(t => t.id !== id));
    
    if (newActiveTabId) {
      setActiveTab(newActiveTabId);
      const newActiveTab = tabs.find(t => t.id === newActiveTabId);
      if (newActiveTab) {
        router.push(newActiveTab.path);
      }
    } else if (tabs.length === 1) {
        // If last tab is closed, we should decide where to navigate.
        // For now, let's do nothing, user will have an empty content area.
        setActiveTab(null);
        // Or navigate to a default page like dashboard
        // router.push('/dashboard');
    }
  };

  const setTabsWithContent = (id: string, content: React.ReactNode) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === id ? { ...tab, content } : tab
      )
    );
  };

  const value = {
    tabs,
    activeTab,
    addTab,
    removeTab,
    setActiveTab,
    setTabsWithContent,
  };

  return <TabContext.Provider value={value as any}>{children}</TabContext.Provider>;
}

export function useTabs() {
  const context = React.useContext(TabContext);
  if (!context) {
    throw new Error('useTabs must be used within a TabProvider');
  }
  return context;
}

export function TabBar() {
  const { tabs, activeTab, setActiveTab, removeTab } = useTabs();
  const router = useRouter();

  if (tabs.length === 0) return null;

  const handleSetActiveTab = (id: string) => {
      const tab = tabs.find(t => t.id === id);
      if(tab){
        setActiveTab(id);
        router.push(tab.path);
      }
  }

  return (
    <div className="flex border-b bg-muted/30">
      {tabs.map(tab => (
        <div
          key={tab.id}
          onClick={() => handleSetActiveTab(tab.id)}
          className={cn(
            'flex items-center gap-2 py-2 px-4 border-r cursor-pointer text-sm group',
            activeTab === tab.id 
              ? 'bg-background text-primary font-semibold shadow-inner' 
              : 'text-muted-foreground hover:bg-muted/80'
          )}
        >
          <span>{tab.title}</span>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
                'h-5 w-5 rounded-full',
                activeTab === tab.id 
                  ? 'hover:bg-primary/20'
                  : 'text-muted-foreground/50 hover:bg-muted-foreground/20'
              )}
            onClick={(e) => {
              e.stopPropagation();
              removeTab(tab.id);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export function TabContent({ initialChildren }: { initialChildren: React.ReactNode }) {
    const { tabs, activeTab, setTabsWithContent } = useTabs() as any;
    const pathname = usePathname();

    React.useEffect(() => {
        const activeTabForPath = tabs.find(t => t.path === pathname);
        if (activeTabForPath && !activeTabForPath.content) {
            setTabsWithContent(activeTabForPath.id, initialChildren);
        }
    }, [pathname, tabs, initialChildren, setTabsWithContent]);

    return (
        <>
            {tabs.map(tab => (
                <div key={tab.id} style={{ display: tab.id === activeTab ? 'block' : 'none' }} className="h-full">
                    {tab.content}
                </div>
            ))}
        </>
    );
}
