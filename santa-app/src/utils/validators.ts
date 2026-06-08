export type ValidationType = 'name' | 'email' | 'password' | 'confirmPassword';

// Returns the error message, or '' if the value is valid.
// Empty string is falsy — callers can use the result directly as error state.
export function inputValidation(
  type: ValidationType,
  value: string,
  comparedValue?: string
): string {
  switch (type) {
    case 'name':
      return value.trim().length >= 2 ? '' : 'Name must be at least 2 characters';
    case 'email':
      return value.includes('@') && value.includes('.') ? '' : 'Enter a valid email address';
    case 'password':
      return value.length >= 8 ? '' : 'Password must be at least 8 characters';
    case 'confirmPassword':
      return value === comparedValue ? '' : "Passwords don't match";
  }
}
