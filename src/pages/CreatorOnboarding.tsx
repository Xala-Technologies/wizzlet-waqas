import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { AuthShell } from '@/components/auth/AuthShell';
import { clampOnboardingStep, ONBOARDING_STEPS, shouldPublishOnSave } from '@/lib/onboardingStep';
import { uploadToConvexStorage } from '@/lib/upload';
import { Loader2, Camera, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const BIO_MAX = 200;

const CreatorOnboarding = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const convex = useConvex();
  const existing = useQuery(api.creators.queries.myCreator, user ? {} : 'skip');
  const me = useQuery(api.users.queries.me, user ? {} : 'skip');
  const upsertOnboarding = useMutation(api.creators.queries.upsertOnboarding);
  const setPublished = useMutation(api.creators.queries.setPublished);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | undefined>();
  const avatarRef = useRef<HTMLInputElement>(null);
  const saveInFlight = useRef(false);

  useEffect(() => {
    if (hydrated || existing === undefined || me === undefined) return;

    const socialName = (me.fullName ?? me.name ?? '').trim();
    const socialUser = (me.username ?? me.discordUsername ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
    const socialBio = (me.bio ?? '').trim().slice(0, BIO_MAX);
    const socialAvatar =
      typeof me.image === 'string' && me.image.length > 0
        ? me.image.replace('_normal.', '.').replace('_bigger.', '.')
        : undefined;

    if (existing) {
      setDisplayName(existing.displayName || socialName.slice(0, 50));
      setUsername(existing.username || socialUser.slice(0, 30));
      setBio((existing.bio || socialBio).slice(0, BIO_MAX));
      const avatar = existing.avatarUrl || socialAvatar;
      if (avatar) {
        setAvatarPreview(avatar);
        setSavedAvatarUrl(avatar);
      }
      if (typeof existing.onboardingStep === 'number') {
        setStep(clampOnboardingStep(existing.onboardingStep, ONBOARDING_STEPS.length));
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
  }, [existing, me, hydrated]);

  useEffect(() => {
    if (!me?.image) return;
    if (avatarPreview || savedAvatarUrl || avatarFile) return;
    const url = me.image.replace('_normal.', '.').replace('_bigger.', '.');
    setAvatarPreview(url);
    setSavedAvatarUrl(url);
  }, [me, avatarPreview, savedAvatarUrl, avatarFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const persistDraft = async (nextStep: number, opts?: { publish?: boolean }) => {
    if (!user || saveInFlight.current) return false;
    const cleanUsername = (username || displayName)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 30);
    if (cleanUsername.length < 3) {
      toast.error('Username must be 3–32 characters (a-z, 0-9, _)');
      return false;
    }
    if (!displayName.trim()) {
      toast.error('Add a creator name to continue');
      return false;
    }

    saveInFlight.current = true;
    setLoading(true);
    let avatarUrl: string | null | undefined = savedAvatarUrl ?? null;
    if (avatarFile) {
      try {
        avatarUrl = await uploadToConvexStorage(convex, avatarFile, 'creator-onboarding');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Upload failed');
        saveInFlight.current = false;
        setLoading(false);
        return false;
      }
      if (!avatarUrl) {
        toast.error('Profile photo upload failed — not saved');
        saveInFlight.current = false;
        setLoading(false);
        return false;
      }
    }

    try {
      const creatorId = await upsertOnboarding({
        username: cleanUsername,
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl ?? undefined,
        onboardingStep: nextStep,
      });
      if (avatarUrl) {
        setSavedAvatarUrl(avatarUrl);
        setAvatarFile(null);
      }

      if (shouldPublishOnSave(opts)) {
        await setPublished({ creatorId, isPublished: true });
        await queryClient.invalidateQueries({ queryKey: ['creator-profile-exists'] });
        toast.success('Your creator profile is live!');
        navigate('/creator');
        return true;
      }
      setStep(nextStep);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save';
      if (message.includes('USERNAME_TAKEN') || message.includes('unique') || message.includes('already')) {
        toast.error('That username is already taken');
      } else if (message.includes('INVALID_USERNAME')) {
        toast.error('Username must be 3–32 characters (a-z, 0-9, _)');
      } else {
        toast.error(message);
      }
      return false;
    } finally {
      saveInFlight.current = false;
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (step === 1 && !avatarPreview && !avatarFile) {
      avatarRef.current?.click();
      return;
    }
    const last = step >= ONBOARDING_STEPS.length - 1;
    void persistDraft(
      last ? step : Math.min(step + 1, ONBOARDING_STEPS.length - 1),
      last ? { publish: true } : undefined,
    );
  };

  const handleSkip = () => {
    void persistDraft(
      step >= ONBOARDING_STEPS.length - 1 ? step : step + 1,
      step >= ONBOARDING_STEPS.length - 1 ? { publish: true } : undefined,
    );
  };

  if (user && (existing === undefined || me === undefined || !hydrated)) {
    return (
      <main id="main-content" className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </main>
    );
  }

  const nameOk = displayName.trim().length > 0;
  const titles = [
    {
      title: 'What do you want to call your Sweeph page?',
      subtitle: 'This name will show on your profile and can be changed anytime.',
    },
    {
      title: 'Add a profile image',
      subtitle: 'This will show on your profile.',
    },
    {
      title: 'Give your page a short description',
      subtitle: 'Tell people what they can expect from your content.',
    },
  ] as const;
  const copy = titles[step] ?? titles[0];

  return (
    <AuthShell
      title={copy.title}
      subtitle={copy.subtitle}
      seoTitle="Set up your Sweeph page"
      seoDescription="Choose a name, photo, and short description for your creator page."
      logoLinkTo=""
      progressStep={3 + step}
    >
      {step === 0 ? (
        <div className="space-y-2">
          <Label htmlFor="displayName">Creator name</Label>
          <div className="relative">
            <Input
              id="displayName"
              placeholder="SharkPicks"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
              className="h-12 bg-background pr-11 text-ui"
              maxLength={50}
            />
            {nameOk ? (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400">
                <Check className="h-5 w-5" aria-hidden />
                <span className="sr-only">Creator name looks valid</span>
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="flex flex-col items-center gap-4 py-1">
          <button
            type="button"
            onClick={() => avatarRef.current?.click()}
            className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-muted/30 transition-colors hover:border-primary/60"
            aria-label="Upload profile image"
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt=""
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Camera className="h-8 w-8 text-muted-foreground" />
            )}
          </button>
          <p className="max-w-[16rem] text-center text-[13px] leading-relaxed text-muted-foreground">
            JPG, PNG, or WebP. Max 5MB. Optional — you can add this later in Settings.
          </p>
          <input
            ref={avatarRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-2">
          <Textarea
            id="bio"
            placeholder="Only the Sharpest Picks"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
            className="min-h-[140px] resize-none bg-background text-ui"
            maxLength={BIO_MAX}
          />
          <p className="text-right text-caption text-muted-foreground">
            {bio.length}/{BIO_MAX}
          </p>
        </div>
      ) : null}

      <Button
        type="button"
        variant="default"
        className="mt-8 h-12 w-full rounded-xl text-[15px] font-semibold"
        onClick={handleContinue}
        disabled={loading || (step === 0 && !nameOk)}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading
          ? 'Saving…'
          : step === 1 && !avatarPreview
            ? 'Upload image'
            : step === 2
              ? 'Finish setup'
              : 'Continue'}
      </Button>

      {step === 1 || step === 2 ? (
        <Button
          type="button"
          variant="ghost"
          className="mt-2 h-11 w-full rounded-xl text-[14px] font-medium text-muted-foreground"
          onClick={handleSkip}
          disabled={loading}
        >
          Skip for now
        </Button>
      ) : null}

      <p className="mt-5 text-center">
        {step > 0 ? (
          <button
            type="button"
            className="text-[14px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            onClick={() => setStep(step - 1)}
            disabled={loading}
          >
            Go back
          </button>
        ) : (
          <Link
            to="/"
            className="text-[14px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Go back
          </Link>
        )}
      </p>
    </AuthShell>
  );
};

export default CreatorOnboarding;
