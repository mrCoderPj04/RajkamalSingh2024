import './globals.css';

export const metadata = {
  title: 'SOFO Sync | One QR. Instant Connection. Real-Time Collaboration.',
  description: 'Pair web, mobile, and desktop devices instantly with a single QR code. Real-time whiteboard, collaborative document editor, media streaming, and AI copilot.',
  keywords: ['SOFO Sync', 'QR Code Sync', 'Real-Time Collaboration', 'Whiteboard', 'WebRTC P2P', 'Document Sharing'],
  authors: [{ name: 'SOFO Sync Team' }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#07090E] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
