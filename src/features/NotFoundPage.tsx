import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <h1 className="mt-3 text-xl font-semibold text-slate-700">Page not found</h1>
      <Link to="/" className="mt-5">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}
