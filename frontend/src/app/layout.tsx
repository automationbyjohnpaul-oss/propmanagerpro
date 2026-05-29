import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";

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
        <div className="min-h-screen pb-16">{children}</div>

        <BottomNav />
      </body>
    </html>
  );
}
