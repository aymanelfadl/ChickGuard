export default function DashboardLayout({ header, children }) {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
        {header}
        {children}
      </div>
    </main>
  );
}
