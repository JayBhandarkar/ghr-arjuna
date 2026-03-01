import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import { StatementProvider } from '@/lib/StatementContext';

export const metadata = {
  title: 'BankAI - Financial Intelligence Platform',
  description: 'AI-powered bank statement analysis and financial health tracking',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <StatementProvider>
            {children}
          </StatementProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
