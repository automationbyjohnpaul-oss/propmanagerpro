interface ErrorStateProps {
  message: string;
}

export default function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <p className="text-red-500 text-lg font-semibold">Error</p>
        <p className="text-gray-600 mt-2">{message}</p>
      </div>
    </div>
  );
}
