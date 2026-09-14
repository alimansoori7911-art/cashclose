import { useState } from 'react';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { Modal } from '../../../components/ui/Modal/index';
import type { CreateTenantResult } from '../hooks/usePlatformApi';

interface Props {
  result: CreateTenantResult;
  ownerPassword: string;
  onClose: () => void;
}

/**
 * اطلاعات ورودی که به صاحب کسب‌وکار داده می‌شود.
 *
 * یک‌بار و همین‌جا نمایش داده می‌شود: رمز جایی ذخیره نشده و پس از بستن
 * این پنجره دیگر قابل بازیابی نیست — فقط می‌شود رمز تازه‌ای ساخت.
 */
export function CredentialsCard({ result, ownerPassword, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const text = [
    `کسب‌وکار: ${result.tenant.name}`,
    `کد کسب‌وکار: ${result.tenant.code}`,
    `نام کاربری: ${result.owner.username}`,
    `رمز اولیه: ${ownerPassword}`,
    '',
    'پس از اولین ورود، رمز خود را تغییر دهید.',
  ].join('\n');

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // اجازهٔ کلیپ‌بورد داده نشده؛ کاربر می‌تواند دستی انتخاب کند.
    }
  }

  return (
    <Modal open onClose={onClose} title="کسب‌وکار ساخته شد">
      <Alert tone="warning" className="mb-4">
        این اطلاعات فقط همین یک‌بار نمایش داده می‌شود. رمز جایی ذخیره نشده
        است.
      </Alert>

      <div className="rounded-lg border border-border bg-bg p-4">
        <Row label="کسب‌وکار" value={result.tenant.name} />
        <Row label="کد کسب‌وکار" value={result.tenant.code} mono />
        <Row label="آدرس اختصاصی" value={`${result.tenant.slug}.`} mono />
        <Row label="نام کاربری" value={result.owner.username} mono />
        <Row label="رمز اولیه" value={ownerPassword} mono />
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => void copy()}>
          {copied ? 'کپی شد ✓' : 'کپی متن'}
        </Button>
        <Button onClick={onClose}>بستن</Button>
      </div>
    </Modal>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border py-2 last:border-0">
      <span className="text-sm text-text-muted">{label}</span>
      <span
        className={[
          'text-sm text-text',
          mono ? 'financial-figure font-medium' : '',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}
