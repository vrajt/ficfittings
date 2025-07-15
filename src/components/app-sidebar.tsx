
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
import { navConfig } from '@/lib/nav-config';
import type { NavItem } from '@/lib/types';

export default function AppSidebar() {
  const pathname = usePathname();

  const renderNavItem = (item: NavItem) => {
    const isActive = item.href ? pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}`)) : false;

    if (item.children) {
      const isChildActive = item.children.some(child => child.href && pathname.startsWith(child.href));
      return (
        <Accordion key={item.title} type="single" collapsible defaultValue={isChildActive ? item.title : undefined} className="w-full">
          <AccordionItem value={item.title} className="border-none">
            <AccordionTrigger asChild>
               <SidebarMenuButton className="justify-between [&>svg:last-child]:data-[state=open]:rotate-180">
                    <div className='flex items-center gap-2'>
                        <item.icon />
                        <span>{item.title}</span>
                    </div>
                    <ChevronDown className="transition-transform duration-200" />
                </SidebarMenuButton>
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
        <Link href={item.href} legacyBehavior passHref>
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
