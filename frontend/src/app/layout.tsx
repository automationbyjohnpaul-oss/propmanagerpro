import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "PropManager Pro",
  description: "Simple property management for small landlords",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
