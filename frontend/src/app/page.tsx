import AppCard from "@/components/ui/cards/AppCard";

export default function Home() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="mt-4 grid gap-3">
        <AppCard title="Total Properties" value="12" />

        <AppCard title="Monthly Income" value="$8,450" />

        <AppCard title="Pending Expenses" value="$1,240" />
      </div>
    </main>
  );
}
