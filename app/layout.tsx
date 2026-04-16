import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Cup - Ryder Cup Golf Trip',
  description: 'Annual 16-player Ryder Cup golf trip at Sea Pines',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
