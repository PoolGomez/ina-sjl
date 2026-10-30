'use client';

import React from 'react';
import {
  iglesiaNavItems,
  eventosNavItems,
  adminSubItems,
  NavItemDef,
  TabType,
  AdminSubTab,
} from '../lib/navItems';
import { AppSidebar } from './layout/AppSidebar';
import { AppHeader, AppHeaderProps } from './layout/AppHeader';
import { Backdrop } from './layout/Backdrop';

export {
  iglesiaNavItems,
  eventosNavItems,
  adminSubItems,
  AppSidebar,
  AppHeader,
  Backdrop,
};
export type { NavItemDef, TabType, AdminSubTab };

export const Navbar: React.FC<AppHeaderProps> = (props) => {
  return <AppHeader {...props} />;
};

export default Navbar;
