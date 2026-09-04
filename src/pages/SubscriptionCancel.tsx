import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

const SubscriptionCancel = () => {
  const [searchParams] = useSearchParams();
  const creatorUsername = searchParams.get('creator');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Subscription Cancelled</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Your subscription was not completed. No charges were made.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {creatorUsername && (
            <Link to={`/${creatorUsername}`}>
              <Button variant="hero" size="lg">Back to Creator</Button>
            </Link>
          )}
          <Link to="/">
            <Button variant="outline" size="lg">Go Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCancel;
