import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { PrizeletLogo } from '@/components/PrizeletLogo';
import { clampOnboardingStep, ONBOARDING_STEPS, shouldPublishOnSave } from '@/lib/onboardingStep';
import { uploadToConvexStorage } from '@/lib/upload';
import { ArrowRight, ArrowLeft, Loader2, Camera, ImageIcon, User, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { Id } from '../../convex/_generated/dataModel';

const CreatorOnboarding = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, roles, switchRole } = useAuth();
  const convex = useConvex();
  const existing = useQuery(api.creators.queries.myCreator, user ? {} : 'skip');
  const me = useQuery(api.users.queries.me, user ? {} : 'skip');
  const existingProducts = useQuery(
    api.products.mutations.listByCreator,
    existing?._id ? { creatorId: existing._id, activeOnly: true } : 'skip',
  );
  const upsertOnboarding = useMutation(api.creators.queries.upsertOnboarding);
  const setPublished = useMutation(api.creators.queries.setPublished);
  const upsertProduct = useMutation(api.products.mutations.upsert);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const saveInFlight = useRef(false);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('9.99');
  const [productId, setProductId] = useState<Id<'products'> | undefined>();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  /** Server URLs already saved (survive device switch; local File picks do not). */
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | undefined>();
  const [savedBannerUrl, setSavedBannerUrl] = useState<string | undefined>();

  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hydrated || existing === undefined || me === undefined) return;
    // Wait for products list when a creator draft already exists.
    if (existing && existingProducts === undefined) return;

    const socialName = (me.fullName ?? me.name ?? '').trim();
    const socialUser = (me.username ?? me.discordUsername ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
    const socialBio = (me.bio ?? '').trim().slice(0, 300);
    const socialAvatar =
      typeof me.image === 'string' && me.image.length > 0
        ? me.image.replace('_normal.', '.').replace('_bigger.', '.')
        : undefined;

    if (existing) {
      setDisplayName(existing.displayName || socialName.slice(0, 50));
      setUsername(existing.username || socialUser.slice(0, 30));
      setBio(existing.bio || socialBio);
      const avatar = existing.avatarUrl || socialAvatar;
      if (avatar) {
        setAvatarPreview(avatar);
        setSavedAvatarUrl(avatar);
      }
      if (existing.bannerUrl) {
        setBannerPreview(existing.bannerUrl);
        setSavedBannerUrl(existing.bannerUrl);
      }
      if (typeof existing.onboardingStep === 'number') {
        setStep(clampOnboardingStep(existing.onboardingStep, ONBOARDING_STEPS.length));
      }
      const firstProduct =
        existingProducts?.find((p) => p.isFeatured) ?? existingProducts?.[0];
      if (firstProduct) {
        setProductId(firstProduct._id);
        setProductName(firstProduct.name);
        setProductDescription(firstProduct.description ?? '');
        setProductPrice((firstProduct.priceCents / 100).toFixed(2));
      }
    } else {
      if (socialName) setDisplayName(socialName.slice(0, 50));
      if (socialUser) setUsername(socialUser.slice(0, 30));
      if (socialBio) setBio(socialBio);
      if (socialAvatar) {
        setAvatarPreview(socialAvatar);
        setSavedAvatarUrl(socialAvatar);
      }
    }
    setHydrated(true);
  }, [existing, me, existingProducts, hydrated]);

  // If draft had no avatar (or hydration already ran), still pull the social photo when available.
  useEffect(() => {
    if (!me?.image) return;
    if (avatarPreview || savedAvatarUrl || avatarFile) return;
    const url = me.image.replace('_normal.', '.').replace('_bigger.', '.');
    setAvatarPreview(url);
    setSavedAvatarUrl(url);
  }, [me, avatarPreview, savedAvatarUrl, avatarFile]);

  const exitSetup = () => {
    if (roles.includes('subscriber')) {
      switchRole('subscriber');
      navigate('/dashboard');
      return;
    }
    if (roles.includes('admin')) {
      switchRole('admin');
      navigate('/admin');
      return;
    }
    navigate('/');
  };

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

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      return await uploadToConvexStorage(convex, file);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
      return null;
    }
  };

  const canAdvance = () => {
    if (step === 0) return displayName.trim() && username.trim().length >= 3;
    if (step === 2) {
      const cents = Math.round((parseFloat(productPrice) || 0) * 100);
      return productName.trim().length >= 2 && cents > 0;
    }
    return true;
  };

  const persistDraft = async (nextStep: number, opts?: { publish?: boolean }) => {
    if (!user || saveInFlight.current) return;
    saveInFlight.current = true;
    setLoading(true);
    const [avatarUrl, bannerUrl] = await Promise.all([
      avatarFile ? uploadImage(avatarFile) : Promise.resolve(savedAvatarUrl ?? null),
      bannerFile ? uploadImage(bannerFile) : Promise.resolve(savedBannerUrl ?? null),
    ]);
    // Failed uploads must not silently drop existing saved URLs when a new file was chosen.
    if (avatarFile && !avatarUrl) {
      toast.error('Profile photo upload failed — draft not saved');
      saveInFlight.current = false;
      setLoading(false);
      return;
    }
    if (bannerFile && !bannerUrl) {
      toast.error('Banner upload failed — draft not saved');
      saveInFlight.current = false;
      setLoading(false);
      return;
    }
    try {
      const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
      const creatorId = await upsertOnboarding({
        username: cleanUsername,
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl ?? undefined,
        bannerUrl: bannerUrl ?? undefined,
        onboardingStep: nextStep,
      });
      if (avatarUrl) {
        setSavedAvatarUrl(avatarUrl);
        setAvatarFile(null);
      }
      if (bannerUrl) {
        setSavedBannerUrl(bannerUrl);
        setBannerFile(null);
      }

      // Final step: create/update the first product — buyers pay for products, not a platform fee.
      if (step === 2) {
        const priceCents = Math.round((parseFloat(productPrice) || 0) * 100);
        if (!productName.trim() || priceCents <= 0) {
          toast.error('Add a product name and price before continuing');
          return;
        }
        const savedProductId = await upsertProduct({
          productId,
          creatorId,
          name: productName.trim(),
          description: productDescription.trim() || undefined,
          priceCents,
          // Checkout currently supports recurring monthly access products.
          billingPeriod: 'monthly',
          isFeatured: true,
          isActive: true,
          isLimited: false,
          isClosed: false,
        });
        setProductId(savedProductId);
      }

      if (shouldPublishOnSave(opts)) {
        // Explicit publish only — draft saves never flip isPublished.
        await setPublished({ creatorId, isPublished: true });
        await queryClient.invalidateQueries({ queryKey: ['creator-profile-exists'] });
        toast.success('Your creator profile is live!');
        navigate('/creator');
        return;
      }
      toast.success('Draft saved');
      setStep(nextStep);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save';
      if (message.includes('USERNAME_TAKEN') || message.includes('unique') || message.includes('already')) {
        toast.error('That username is already taken');
      } else if (message.includes('INVALID_USERNAME')) {
        toast.error('Username must be 3–32 characters (a-z, 0-9, _)');
      } else {
        toast.error(message);
      }
    } finally {
      saveInFlight.current = false;
      setLoading(false);
    }
  };

  const handleContinue = () => {
    void persistDraft(Math.min(step + 1, ONBOARDING_STEPS.length - 1));
  };

  const handleSaveDraft = () => {
    void persistDraft(step);
  };

  const handlePublish = () => {
    void persistDraft(step, { publish: true });
  };

  if (
    user &&
    (existing === undefined ||
      me === undefined ||
      (existing && existingProducts === undefined) ||
      !hydrated)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const alreadyPublished = existing?.isPublished === true;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <PrizeletLogo size="md" linkTo="" />
          </div>
          <h1 className="text-heading font-bold text-foreground">
            {alreadyPublished ? 'Update your creator profile' : 'Set up your creator profile'}
          </h1>
          <p className="text-support text-muted-foreground mt-1">
            Step {step + 1} of {ONBOARDING_STEPS.length} · {ONBOARDING_STEPS[step]}
            {existing && !alreadyPublished
              ? ' · Draft resumes on this device and others after save'
              : !existing
                ? ' · Prefills from your X or Discord profile when available'
                : ''}
          </p>
        </div>

        <div className="flex gap-2 mb-8" aria-hidden>
          {ONBOARDING_STEPS.map((label, i) => (
            <div
              key={label}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-support">@</span>
                <Input
                  id="username"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="bg-surface border-border pl-8"
                  maxLength={30}
                />
              </div>
              <p className="text-caption text-muted-foreground">prizelet.com/@{username || 'you'}</p>
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
              <p className="text-caption text-muted-foreground text-right">{bio.length}/300</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => avatarRef.current?.click()}
                  className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border bg-surface hover:border-primary/50 transition-colors overflow-hidden"
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => {
                        // Fall back to social URL if a stale draft URL fails.
                        if (me?.image && avatarPreview !== me.image) {
                          const url = me.image.replace('_normal.', '.').replace('_bigger.', '.');
                          setAvatarPreview(url);
                          setSavedAvatarUrl(url);
                        }
                      }}
                    />
                  ) : (
                    <User className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="h-4 w-4 text-foreground" />
                  </div>
                </button>
                <div>
                  <p className="text-ui font-medium">
                    {avatarPreview
                      ? avatarFile
                        ? 'Change photo'
                        : 'Using your X / Discord photo'
                      : 'Upload a photo'}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {avatarPreview && !avatarFile
                      ? 'Saved with your profile when you continue. Click to replace.'
                      : 'JPG, PNG. Max 5MB. Local picks upload only when you save.'}
                  </p>
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
                    <p className="text-caption text-muted-foreground">Upload banner (1200×400 recommended)</p>
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

            <p className="text-caption text-muted-foreground text-center">
              Images are optional. A file chosen on this device is not available on another device until you save and it uploads.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <p className="text-support text-muted-foreground">
              Create your first product. Fans pay for products — you can add more later from your dashboard.
            </p>

            <div className="space-y-2">
              <Label htmlFor="productName">Product name</Label>
              <Input
                id="productName"
                placeholder="e.g. VIP Community Access"
                value={productName}
                onChange={(e) => setProductName(e.target.value.slice(0, 80))}
                className="bg-surface border-border"
                maxLength={80}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productDescription">Description (optional)</Label>
              <Textarea
                id="productDescription"
                placeholder="What do buyers get?"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value.slice(0, 500))}
                className="bg-surface border-border min-h-[80px]"
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productPrice">Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                <Input
                  id="productPrice"
                  type="number"
                  min="1"
                  max="999"
                  step="0.01"
                  placeholder="9.99"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="bg-surface border-border pl-7 text-lg font-semibold"
                />
              </div>
              <p className="text-caption text-muted-foreground">
                Billed monthly. You can change price and details anytime from your dashboard.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {bannerPreview && (
                <div className="h-20 w-full overflow-hidden">
                  <img src={bannerPreview} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className={`p-5 ${bannerPreview ? '-mt-6' : ''}`}>
                <div className="flex items-end gap-3 mb-3">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt=""
                      className="h-12 w-12 rounded-full border-2 border-card object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-card">
                      <span className="text-sm font-bold text-primary">
                        {displayName?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-ui truncate">{displayName || 'Your Name'}</p>
                    <p className="text-caption text-muted-foreground">@{username || 'username'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-surface/80 p-3 border border-border">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/15">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ui truncate">
                      {productName.trim() || 'Your first product'}
                    </p>
                    {productDescription.trim() ? (
                      <p className="text-caption text-muted-foreground line-clamp-2 mt-0.5">
                        {productDescription.trim()}
                      </p>
                    ) : null}
                    <p className="font-bold text-primary mt-1">
                      ${parseFloat(productPrice || '0').toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-between gap-2 mt-8">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={loading}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={exitSetup} disabled={loading}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              {roles.includes('subscriber') ? 'Back to dashboard' : 'Back to home'}
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={handleSaveDraft} disabled={loading || !canAdvance()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save draft
            </Button>
            {step < ONBOARDING_STEPS.length - 1 ? (
              <Button variant="default" onClick={handleContinue} disabled={loading || !canAdvance()}>
                Continue <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : alreadyPublished ? (
              <Button variant="default" onClick={handleSaveDraft} disabled={loading || !canAdvance()}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            ) : (
              <Button variant="default" onClick={handlePublish} disabled={loading || !canAdvance()}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publish profile <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorOnboarding;
