// This file is a Server Component
import { Inter } from "next/font/google";
import ClientLayout from "./ClientLayout"; // moved to a separate file
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CostLens - AWS Cost Management",
  description: "Track and manage your AWS costs efficiently",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      {/* Use consistent body class across SSR and CSR */}
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
