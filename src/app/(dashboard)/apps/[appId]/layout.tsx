import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ appId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { appId } = await params;
  const app = await prisma.app.findUnique({ where: { id: appId }, select: { id: true, name: true, userId: true } });
  if (!app || app.userId !== session.id) notFound();

  return (
    <div className="flex -m-6 min-h-[calc(100vh-3.5rem)]">
      <AppSidebar appId={app.id} appName={app.name} />
      <div className="flex-1 p-6 overflow-auto">{children}</div>
    </div>
  );
}
