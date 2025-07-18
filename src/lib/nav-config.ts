import {
  LayoutDashboard,
  FileText,
  Settings,
  Users,
  FlaskConical,
  Ruler,
  Thermometer,
  Scale,
  Award,
  Medal,
  MessageSquareText,
  Component,
  Beaker,
  ChevronDown,
  Shapes,
  MousePointerClick,
  Type,
  ToyBrick,
  AlertCircle,
} from 'lucide-react';
import type { NavItem } from './types';

export const navConfig: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Certificates',
    href: '/certificates',
    icon: FileText,
  },
  {
    title: 'Masters',
    href: '#',
    icon: Settings,
    children: [
      { title: 'Generic Master', href: '/masters/generic', icon: Shapes, masterType: 'generic' },
      { title: 'Units', href: '/masters/units', icon: Scale, masterType: 'units' },
      { title: 'Grades', href: '/masters/grades', icon: Award, masterType: 'grades' },
      { title: 'Product Grades', href: '/masters/product-grades', icon: Medal, masterType: 'product-grades' },
      { title: 'TC Remarks', href: '/masters/tc-remarks', icon: MessageSquareText, masterType: 'tc-remarks' },
      { title: 'Customers', href: '/masters/customers', icon: Users, masterType: 'customers' },
      { title: 'Dimension Standards', href: '/masters/dimension-standards', icon: Ruler, masterType: 'dimension-standards' },
      { title: 'Start Materials', href: '/masters/start-materials', icon: Component, masterType: 'start-materials' },
      { title: 'Laboratories', href: '/masters/laboratories', icon: FlaskConical, masterType: 'laboratories' },
      { title: 'Heat Tests', href: '/masters/heat-tests', icon: Thermometer, masterType: 'heat-tests' },
      { title: 'Other Tests', href: '/masters/other-tests', icon: Beaker, masterType: 'other-tests' },
    ],
  },
  {
    title: 'UI Kit',
    href: '#',
    icon: ToyBrick,
    children: [
        { title: 'Icons', href: '/icons', icon: Shapes },
        { title: 'Alerts', href: '/components/alerts', icon: AlertCircle, pageType: 'alerts' },
        { title: 'Buttons', href: '/components/buttons', icon: MousePointerClick },
        { title: 'Inputs', href: '/components/inputs', icon: Type },
    ]
  }
];
