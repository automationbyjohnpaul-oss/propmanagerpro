type EmptyStateProps = {
  title: string;
  description: string;
};

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-xl bg-white p-6 text-center shadow">
      <h2 className="text-lg font-semibold">{title}</h2>

      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}
