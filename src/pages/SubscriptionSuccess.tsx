import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const creatorUsername = searchParams.get('creator');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Subscription Confirmed!</h1>
        <p className="text-muted-foreground text-sm mb-8">
          You're now subscribed{creatorUsername ? ` to @${creatorUsername}` : ''}. You have full access to all premium content.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {creatorUsername && (
            <Link to={`/${creatorUsername}`}>
              <Button variant="hero" size="lg">View Creator</Button>
            </Link>
          )}
          <Link to="/dashboard">
            <Button variant="outline" size="lg">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
