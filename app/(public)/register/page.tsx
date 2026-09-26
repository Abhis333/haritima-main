import { getDictionary } from "@/lib/i18n/server";
import { RegisterForm } from "@/components/AuthForms";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  const { t } = await getDictionary();
  return (
    <div className="container-h flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-xl border border-parch bg-card p-8">
        <Logo size="md" />
        <h1 className="mt-6 text-3xl">{t.auth.registerTitle}</h1>
        <div className="mt-6"><RegisterForm /></div>
      </div>
    </div>
  );
}
