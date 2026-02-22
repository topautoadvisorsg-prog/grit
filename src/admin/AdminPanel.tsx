import React from 'react';
import { FighterManager } from '@/admin/components/FighterManager';
import { CreateEvent } from '@/admin/components/CreateEvent';
import { CreateNews } from '@/admin/components/CreateNews';
import { AdminTagManager } from '@/admin/components/AdminTagManager';
import { AdminBadgeManager } from '@/admin/components/AdminBadgeManager';
import { AdminRaffleManager } from '@/admin/components/AdminRaffleManager';
import { AdminUserVerification } from '@/admin/components/AdminUserVerification';
import { AdminOddsEditor } from '@/admin/components/AdminOddsEditor';
import { AdminEventEditor } from '@/admin/components/AdminEventEditor';
import { AdminUserManager } from '@/admin/components/AdminUserManager';
import { AdminAuditLog } from '@/admin/components/AdminAuditLog';
import { AdminSystemSettings } from '@/admin/components/AdminSystemSettings';
import ImportPage from '@/admin/components/import/ImportPage';

export const ADMIN_TAB_COMPONENTS: Record<string, React.ReactNode> = {
  'create-event': <CreateEvent />,
  'event-editor': <AdminEventEditor />,
  'import': <ImportPage />,
  'fighter-manager': <FighterManager />,
  'create-news': <CreateNews />,
  'admin-tags': <AdminTagManager />,
  'admin-badges': <AdminBadgeManager />,
  'admin-raffle': <AdminRaffleManager />,
  'admin-verification': <AdminUserVerification />,
  'admin-odds': <AdminOddsEditor />,
  'admin-users': <AdminUserManager />,
  'admin-audit': <AdminAuditLog />,
  'admin-settings': <AdminSystemSettings />,
};

export const ADMIN_TAB_IDS = Object.keys(ADMIN_TAB_COMPONENTS);

export function isAdminTab(tabId: string): boolean {
  return ADMIN_TAB_IDS.includes(tabId);
}
