import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { loading, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (!isAdmin) navigate({ to: "/" });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm tracking-wider uppercase">
        Verifierar...
      </div>
    );
  }

  return (
    <div className="admin-app min-h-screen bg-background text-foreground">
      <div className="admin-shell min-h-screen md:flex">
        <AdminSidebar />
        <main className="admin-main min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
