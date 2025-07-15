
'use client';

import * as React from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search } from "lucide-react";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import { navConfig } from '@/lib/nav-config';
import type { NavItem } from '@/lib/types';
import { useTabs } from './tabs/tab-provider';
import { Command } from "cmdk";
import { useAuth } from '@/contexts/auth-context';


export default function AppHeader() {
  const router = useRouter();
  const { addTab } = useTabs();
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  const flattenNavItems = (items: NavItem[]): NavItem[] => {
    const flatList: NavItem[] = [];
    items.forEach(item => {
      if (item.href && item.href !== '#') {
        flatList.push(item);
      }
      if (item.children) {
        flatList.push(...flattenNavItems(item.children));
      }
    });
    return flatList;
  };

  const allNavItems = React.useMemo(() => flattenNavItems(navConfig), []);

  const filteredNavItems = React.useMemo(() => {
    if (!searchQuery) return [];
    return allNavItems.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allNavItems]);


  const handleSearchItemClick = (item: NavItem) => {
    if (item.href) {
      addTab({ id: item.href, title: item.title, path: item.href });
    }
    setSearchQuery('');
    setIsSearchOpen(false);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearchOpen(!!query);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="hidden md:block">
        <SidebarTrigger />
      </div>
      <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <PopoverAnchor asChild>
                <Input
                type="search"
                placeholder="Search menus..."
                className="w-full rounded-lg bg-card pl-8 md:w-[200px] lg:w-[320px]"
                value={searchQuery}
                onChange={handleSearchChange}
                />
            </PopoverAnchor>
          </div>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <div className="p-2">
            {filteredNavItems.length > 0 ? (
                filteredNavItems.map(item => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className="w-full justify-start font-normal text-xs"
                    onClick={() => handleSearchItemClick(item)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Button>
                ))
            ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                    No results found.
                </div>
            )}
            </div>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="ml-auto flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Toggle notifications</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src="https://placehold.co/100x100.png" alt="Admin" data-ai-hint="user avatar" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Admin</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
