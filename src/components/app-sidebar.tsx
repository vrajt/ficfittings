'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText } from 'lucide-react';
import { cva } from 'class-variance-authority';
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
import { navConfig } from '@/lib/nav-config';
import type { NavItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import * as React from 'react';

export default function AppSidebar() {
  const pathname = usePathname();

  const getDefaultAccordionValue = () => {
    for (const item of navConfig) {
      if (item.children) {
        const isChildActive = item.children.some(child => child.href && pathname.startsWith(child.href));
        if (isChildActive) {
          return item.title;
        }
      }
    }
    return undefined;
  }

  const renderNavItem = (item: NavItem) => {
    const isActive = item.href ? pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}`)) : false;

    if (item.children) {
      return (
        <Accordion key={item.title} type="single" collapsible defaultValue={getDefaultAccordionValue()} className="w-full">
          <AccordionItem value={item.title} className="border-none">
            <AccordionTrigger className={cn(
              sidebarMenuButtonVariants(),
              "justify-between [&>svg:last-child]:data-[state=open]:rotate-180"
              )}>
                    <div className='flex items-center gap-2'>
                        <item.icon />
                        <span>{item.title}</span>
                    </div>
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

    if (!item.href) {
        return null;
    }

    return (
      <SidebarMenuItem key={item.title}>
        <Link href={item.href} passHref>
          <SidebarMenuButton as="a" isActive={isActive}>
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

const sidebarMenuButtonVariants = cva(
  "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0"
);