import { useState } from 'react';

import { Button } from '../components/ui/Button/index';
import { CreateTenantForm } from '../features/platform/components/CreateTenantForm';
import { CredentialsCard } from '../features/platform/components/CredentialsCard';
import { PlatformLogin } from '../features/platform/components/PlatformLogin';
import { TenantTable } from '../features/platform/components/TenantTable';
import {
  useTenantList,
  type CreateTenantResult,
} from '../features/platform/hooks/usePlatformApi';
import { platformSession } from '../features/platform/platform-client';

/**
 * پنل مدیر سامانه.
 *
 * عمداً بیرون از `AppLayout` است: آن چیدمان منوی کاربرِ مشتری را دارد و
 * مدیر سامانه کاربر هیچ مجموعه‌ای نیست.
 */
export function PlatformPage() {
  const [signedIn, setSignedIn] = useState(() =>
    Boolean(platformSession.get()),
  );
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{
    result: CreateTenantResult;
    password: string;
  } | null>(null);

  const tenants = useTenantList(signedIn);

  if (!signedIn) {
    return <PlatformLogin onSuccess={() => setSignedIn(true)} />;
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text">کسب‌وکارها</h1>
          <p className="mt-1 text-sm text-text-muted">
            هر کسب‌وکار دادهٔ کاملاً جدا دارد؛ هیچ‌کدام دادهٔ دیگری را
            نمی‌بیند.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              platformSession.clear();
              setSignedIn(false);
            }}
          >
            خروج
          </Button>
          <Button onClick={() => setCreating(true)}>کسب‌وکار تازه</Button>
        </div>
      </div>

      <TenantTable query={tenants} />

      {creating && (
        <CreateTenantForm
          onClose={() => setCreating(false)}
          onCreated={(result, password) => {
            setCreating(false);
            setCreated({ result, password });
          }}
        />
      )}

      {created && (
        <CredentialsCard
          result={created.result}
          ownerPassword={created.password}
          onClose={() => setCreated(null)}
        />
      )}
    </div>
  );
}
