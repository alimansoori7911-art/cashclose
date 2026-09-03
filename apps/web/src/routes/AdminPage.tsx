import { useState } from 'react';

import { AuditLogTab } from '../features/admin/components/AuditLogTab';
import { BranchesTab } from '../features/admin/components/BranchesTab';
import { TerminalsTab } from '../features/admin/components/TerminalsTab';
import { UsersTab } from '../features/admin/components/UsersTab';
import { AppLayout } from '../components/layout/AppLayout';

const TABS = [
  { id: 'branches', label: 'شعبه‌ها', render: () => <BranchesTab /> },
  { id: 'users', label: 'کاربران', render: () => <UsersTab /> },
  { id: 'terminals', label: 'کارتخوان‌ها', render: () => <TerminalsTab /> },
  { id: 'logs', label: 'لاگ عملیات', render: () => <AuditLogTab /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

/** پنل مدیریت فروشگاه — مخصوص مدیر فروشگاه و مالک. */
export function AdminPage() {
  const [active, setActive] = useState<TabId>('branches');
  const current = TABS.find((tab) => tab.id === active) ?? TABS[0];

  return (
    <AppLayout>
      <h1 className="mb-1 text-xl font-bold text-text">مدیریت فروشگاه</h1>
      <p className="mb-5 text-sm text-text-muted">
        تعریف شعبه، کاربران و کارتخوان‌ها و مشاهدهٔ سوابق عملیات.
      </p>

      <div
        role="tablist"
        aria-label="بخش‌های مدیریت"
        className="mb-5 flex gap-1 border-b border-border"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={tab.id === active}
            onClick={() => setActive(tab.id)}
            className={
              tab.id === active
                ? 'border-b-2 border-primary px-4 py-2.5 text-sm font-medium text-primary'
                : 'border-b-2 border-transparent px-4 py-2.5 text-sm text-text-muted transition-colors hover:text-text'
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">{current.render()}</div>
    </AppLayout>
  );
}
