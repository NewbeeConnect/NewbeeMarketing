import { AppSidebar } from "@/components/layout/AppSidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-app flex">
      <AppSidebar />
      {/*
       * Top padding on mobile reserves ~56px for the floating "Menu"
       * trigger the sidebar renders at `fixed top-3 left-3`. Desktop has
       * the sidebar in-flow so no padding is needed.
       */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0">{children}</main>
    </div>
  );
}
