import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) redirect("/login");
  try {
    verifyAccessToken(token);
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)" }}>
      <AdminSidebar />
      <main className="flex-1 ml-[260px] p-6 overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
