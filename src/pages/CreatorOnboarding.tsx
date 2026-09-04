import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, ArrowRight, Loader2, Camera, ImageIcon, User } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const STEPS = ['Profile', 'Images', 'Pricing'];

const CreatorOnboarding = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [price, setPrice] = useState('9.99');

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (s: string | null) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }
    setFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File, bucket: string): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return null;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const canAdvance = () => {
    if (step === 0) return displayName.trim() && username.trim();
    return true;
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);

    // Upload images in parallel
    const [avatarUrl, bannerUrl] = await Promise.all([
      avatarFile ? uploadImage(avatarFile, 'avatars') : Promise.resolve(null),
      bannerFile ? uploadImage(bannerFile, 'banners') : Promise.resolve(null),
    ]);

    // Get the user record
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (!userData) {
      toast.error('User record not found. Please try again.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('creators').insert({
      user_id: userData.id,
      username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      display_name: displayName.trim(),
      bio: bio.trim() || null,
      avatar_url: avatarUrl,
      banner_url: bannerUrl,
      monthly_price: parseFloat(price) || 9.99,
      is_published: true,
    });

    setLoading(false);
    if (error) {
      if (error.message.includes('unique')) {
        toast.error('That username is already taken');
      } else {
        toast.error(error.message);
      }
    } else {
      await queryClient.invalidateQueries({ queryKey: ['creator-profile-exists'] });
      toast.success('Your creator profile is live!');
      navigate('/creator');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-lg mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            Wizzlet
          </Link>
          <h1 className="text-2xl font-bold mt-4">Set up your creator profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Profile info */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-surface border-border"
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input
                  id="username"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="bg-surface border-border pl-8"
                  maxLength={30}
                />
              </div>
              <p className="text-xs text-muted-foreground">wizzlet.com/@{username || 'you'}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell subscribers about yourself and what you cover..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-surface border-border resize-none"
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
            </div>
          </div>
        )}

        {/* Step 2: Images */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Avatar */}
            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => avatarRef.current?.click()}
                  className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border bg-surface hover:border-primary/50 transition-colors overflow-hidden"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="h-4 w-4 text-foreground" />
                  </div>
                </button>
                <div>
                  <p className="text-sm font-medium">{avatarPreview ? 'Change photo' : 'Upload a photo'}</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG. Max 5MB.</p>
                </div>
              </div>
              <input
                ref={avatarRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFileSelect(e, setAvatarFile, setAvatarPreview)}
              />
            </div>

            {/* Banner */}
            <div className="space-y-2">
              <Label>Banner Image</Label>
              <button
                type="button"
                onClick={() => bannerRef.current?.click()}
                className="relative w-full h-32 rounded-xl border-2 border-dashed border-border bg-surface hover:border-primary/50 transition-colors overflow-hidden flex items-center justify-center"
              >
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Upload banner (1200×400 recommended)</p>
                  </div>
                )}
                {bannerPreview && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="h-5 w-5 text-foreground" />
                  </div>
                )}
              </button>
              <input
                ref={bannerRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFileSelect(e, setBannerFile, setBannerPreview)}
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Images are optional — you can add them later too.
            </p>
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="price">Monthly Subscription Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  max="999"
                  step="0.01"
                  placeholder="9.99"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-surface border-border pl-7 text-lg font-semibold"
                />
              </div>
              <p className="text-xs text-muted-foreground">You can change this anytime from your dashboard.</p>
            </div>

            {/* Fee info */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold">Platform fee</p>
              <p className="text-xs text-muted-foreground mt-1">
                5% fee for your first 30 days, then 10%. You keep the rest.
              </p>
            </div>

            {/* Preview card */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {bannerPreview && (
                <div className="h-20 w-full overflow-hidden">
                  <img src={bannerPreview} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className={`p-5 ${bannerPreview ? '-mt-6' : ''}`}>
                <div className="flex items-end gap-3 mb-3">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="h-12 w-12 rounded-full border-2 border-card object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-card">
                      <span className="text-sm font-bold text-primary">
                        {displayName?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{displayName || 'Your Name'}</p>
                    <p className="text-xs text-muted-foreground">@{username || 'username'}</p>
                  </div>
                </div>
                {bio && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{bio}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Monthly</span>
                  <span className="font-bold text-primary">${parseFloat(price || '0').toFixed(2)}/mo</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : (
            <div />
          )}
          {step < STEPS.length - 1 ? (
            <Button variant="hero" onClick={() => setStep(step + 1)} disabled={!canAdvance()}>
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button variant="hero" onClick={handleFinish} disabled={loading || !canAdvance()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Launch Profile <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorOnboarding;
