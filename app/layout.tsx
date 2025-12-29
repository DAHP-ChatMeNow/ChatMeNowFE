import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin', 'vietnamese'], 
  variable: '--font-inter',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans text-slate-900 antialiased bg-white`}>
       
        <div className="h-screen w-full overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}