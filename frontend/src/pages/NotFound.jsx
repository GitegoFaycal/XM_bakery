import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="font-display text-7xl font-bold text-brand-200">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-stone-900">This shelf is empty</h1>
      <p className="mt-2 text-sm text-stone-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="mt-6 inline-block">
        <Button>Back home</Button>
      </Link>
    </div>
  );
}
