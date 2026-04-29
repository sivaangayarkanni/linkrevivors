import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LinkRevive - Dead Link Fixer',
  description: 'Instantly revive broken links with archives and modern alternatives powered by AI.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white antialiased">{children}</body>
    </html>
  );
}
