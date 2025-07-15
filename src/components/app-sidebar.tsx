'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, ChevronDown } from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { navConfig } from '@/lib/nav-config';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/lib/types';

export default function AppSidebar() {
  const pathname = usePathname();

  const renderNavItem = (item: NavItem) => {
    const isActive = item.href ? pathname === item.href || pathname.startsWith(`${item.href}/`) : false;

    if (item.children) {
      const isChildActive = item.children.some(child => pathname.startsWith(child.href));
      return (
        <Accordion key={item.title} type="single" collapsible defaultValue={isChildActive ? item.title : undefined} className="w-full">
          <AccordionItem value={item.title} className="border-none">
            <AccordionTrigger className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:no-underline [&[data-state=open]>svg:last-child]:rotate-180">
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 ml-auto" />
            </AccordionTrigger>
            <AccordionContent className="p-0 pl-4">
              <SidebarMenu>
                {item.children.map(renderNavItem)}
              </SidebarMenu>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    return (
      <SidebarMenuItem key={item.title}>
        <Link href={item.href} passHref>
          <SidebarMenuButton asChild isActive={isActive}>
            <item.icon />
            <span>{item.title}</span>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <SidebarHeader className="border-b">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-primary text-lg">
          <FileText className="h-6 w-6" />
          <span>CertifyZen</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navConfig.map(renderNavItem)}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
