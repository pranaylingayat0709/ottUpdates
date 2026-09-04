import { cookies } from "next/headers";
import { isValidSessionToken, getSessionCookieName, isAdminConfigured } from "@/lib/admin-auth";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { AdminDashboard } from "@/components/AdminDashboard";

export const dynamic = "force-dynamic"; // never cache — auth state must be checked fresh every request
export const metadata = { robots: { index: false, follow: false } };

export default function AdminPage() {
  if (!isAdminConfigured()) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="text-sm text-muted-foreground">
          Admin panel isn't configured — set <code className="chip !inline">ADMIN_PASSWORD</code> in your environment variables to enable it.
        </p>
      </div>
    );
  }

  const authenticated = isValidSessionToken(cookies().get(getSessionCookieName())?.value);
  return authenticated ? <AdminDashboard /> : <AdminLoginForm />;
}
