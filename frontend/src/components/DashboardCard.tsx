interface DashboardCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export default function DashboardCard({
  label,
  value,
  color = "text-gray-900",
}: DashboardCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}
