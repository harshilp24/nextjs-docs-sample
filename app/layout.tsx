import './globals.css';
import { Shell } from '@/components/Shell';

export const metadata = {
  title: 'Relay Docs',
  description: 'Documentation for Relay, a typed background-job library for Node.js and Postgres.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><Shell>{children}</Shell></body>
    </html>
  );
}
