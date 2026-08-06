import './globals.css';

export const metadata = {
  title: 'SOFO Sync | One QR. Instant Connection. Real-Time Collaboration.',
  description: 'Pair web, mobile, and desktop devices instantly with a single QR code. Real-time whiteboard, collaborative document editor, media streaming, and AI copilot.',
  keywords: ['SOFO Sync', 'QR Code Sync', 'Real-Time Collaboration', 'Whiteboard', 'WebRTC P2P', 'Document Sharing'],
  authors: [{ name: 'SOFO Sync Team' }],
  manifest: '/manifest.json',
  themeColor: '#07090E',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SOFO Sync'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#07090E" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SOFO Sync" />
        <link rel="apple-touch-icon" href="/logo/SOFO_syc.png" />
      </head>
      <body className="bg-[#07090E] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
