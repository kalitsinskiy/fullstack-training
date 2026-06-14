import type ValidationError from "../utils/ValidationError";

interface ValidationListProps {
  errors: ValidationError[];
}

export default function ValidationList({ errors }: ValidationListProps) {
  return (
    errors.length > 0 && (
      <ul className="text-sm text-red-500">
        {errors.map((error) => (
          <li key={error.id}>{error.message}</li>
        ))}
      </ul>
    )
  );
}
