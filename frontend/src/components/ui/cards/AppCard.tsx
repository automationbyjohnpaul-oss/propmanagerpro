type AppCardProps = {
  title: string;
  value: string;
};

export default function AppCard({ title, value }: AppCardProps) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <p className="text-sm text-gray-500">{title}</p>

      <h2 className="mt-2 text-2xl font-bold">{value}</h2>
    </div>
  );
}
