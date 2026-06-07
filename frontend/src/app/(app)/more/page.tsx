import AuthGuard from "@/components/AuthGuard";

export default function MorePage() {
  return (
    <AuthGuard>
      <main className="p-4">
        <h1 className="text-2xl font-bold">More</h1>
        <p className="mt-2 text-gray-600">Additional tools and settings.</p>
      </main>
    </AuthGuard>
  );
}
