interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message = "Loading...",
}: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-gray-500 text-lg">{message}</p>
    </div>
  );
}
