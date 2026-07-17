import TabBar from "@/components/TabBar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md min-h-dvh bg-[var(--bg)] safe-top">
      <main className="px-5 pt-6 pb-32">{children}</main>
      <TabBar />
    </div>
  );
}
