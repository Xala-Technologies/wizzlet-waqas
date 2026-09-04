import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-background px-4">
      <Seo title="Page not found — Wizzlet" description="The page you were looking for doesn't exist on Wizzlet." noindex />
      <div className="text-center">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="mt-2 mb-3 text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          We couldn't find <span className="font-mono">{location.pathname}</span>.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/creators"><Button variant="outline" size="sm">Browse creators</Button></Link>
          <Link to="/"><Button size="sm">Back home</Button></Link>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
