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
      {/* pt-14 on mobile = space for fixed top bar; md:ml-[260px] = sidebar width on desktop */}
      <main className="flex-1 pt-14 md:pt-0 md:ml-[260px] p-4 md:p-6 overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
