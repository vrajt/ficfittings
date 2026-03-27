
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, LogOut } from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { navConfig } from '@/lib/nav-config';
import type { NavItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { useTabs } from './tabs/tab-provider';
import { useAuth } from '@/contexts/auth-context';

export default function AppSidebar() {
  const pathname = usePathname();
  const { addTab } = useTabs();
  const { logout } = useAuth();
  const [activeItem, setActiveItem] = React.useState(pathname);
  const [defaultAccordionValue, setDefaultAccordionValue] = React.useState<string | undefined>();

  React.useEffect(() => {
    setActiveItem(pathname);
    for (const item of navConfig) {
      if (item.children) {
        const isChildActive = item.children.some(child => child.href && pathname.startsWith(child.href));
        if (isChildActive) {
          setDefaultAccordionValue(item.title);
          return;
        }
      }
    }
  }, [pathname]);


  const renderNavItem = (item: NavItem) => {
    const isActive = item.href ? activeItem === item.href || (item.href !== '/dashboard' && activeItem.startsWith(`${item.href}`)) : false;

    if (item.children) {
      return (
        <Accordion key={item.title} type="single" collapsible defaultValue={defaultAccordionValue} className="w-full">
          <AccordionItem value={item.title} className="border-none">
             <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                <AccordionTrigger className={cn(
                  "justify-between rounded-md px-2 py-2 text-sm [&>svg:last-child]:data-[state=open]:rotate-180"
                )}>
                  <div className='flex items-center gap-2'>
                    <item.icon />
                    <span>{item.title}</span>
                  </div>
                </AccordionTrigger>
             </SidebarMenuButton>
            <AccordionContent className="p-0 pl-4">
              <SidebarMenu>
                {item.children.map(renderNavItem)}
              </SidebarMenu>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    if (!item.href) {
      return null;
    }

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      addTab({ id: item.href as string, title: item.title, path: item.href as string });
    };

    return (
      <SidebarMenuItem key={item.title}>
        <a href={item.href} onClick={handleLinkClick} className="w-full block">
          <SidebarMenuButton as="div" isActive={isActive} tooltip={item.title}>
            <item.icon />
            <span>{item.title}</span>
          </SidebarMenuButton>
        </a>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border/80 px-3 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-lg font-bold text-primary transition-colors hover:bg-sidebar-accent/70">
          <FileText className="h-6 w-6" />
          <span className="tracking-tight">CertifyZen</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 py-2.5">
          {navConfig.map(renderNavItem)}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/70 px-2 pb-3 pt-2">
         <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={logout} tooltip="Logout" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <LogOut />
                    <span>Logout</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
