interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({
  message = "No data found.",
}: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <p className="text-gray-400 text-lg">{message}</p>
      </div>
    </div>
  );
}
