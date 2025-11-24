import Link from 'next/link';

interface DemoLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function DemoLayout({ title, description, children }: DemoLayoutProps) {
  return (
    <div className="flex flex-col h-screen w-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 text-gray-900 shadow-sm z-10">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <Link
            href="/demos"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors text-sm font-medium mb-2 sm:mb-0 sm:mr-4"
          >
            <span>←</span>
            <span>Back to Demos</span>
          </Link>
          <div className="inline-block sm:ml-4">
            <h1 className="text-xl sm:text-2xl font-bold text-black">{title}</h1>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden bg-white">
        {children}
      </main>
    </div>
  );
}
