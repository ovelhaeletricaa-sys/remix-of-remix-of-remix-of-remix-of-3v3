import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-[260px]">
        <Header title={title} subtitle={subtitle} />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
