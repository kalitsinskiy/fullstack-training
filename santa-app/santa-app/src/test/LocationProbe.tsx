import { useLocation } from 'react-router';

/** Renders the current router pathname so tests can assert on navigation. */
export function LocationProbe() {
  const location = useLocation();
  return <div data-testid="pathname">{location.pathname}</div>;
}
