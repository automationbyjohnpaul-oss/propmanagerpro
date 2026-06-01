interface FormErrorProps {
  message: string;
}

export default function FormError({ message }: FormErrorProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-700 text-sm font-medium">{message}</p>
    </div>
  );
}
