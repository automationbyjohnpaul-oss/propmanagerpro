type LoadingStateProps = {
  message?: string;
};

export default function LoadingState({
  message = "Loading...",
}: LoadingStateProps) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
