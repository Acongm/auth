import { AccountProfileForm } from '@/components/account-profile-form';

export default function AccountPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Acongm Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">账号与应用资料</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          身份与会话由 Supabase Auth 管理；应用资料由 public.profiles 与 /api/user/* 管理。
        </p>
      </div>
      <AccountProfileForm />
    </main>
  );
}
