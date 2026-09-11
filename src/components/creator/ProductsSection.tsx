import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Star, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProductsSectionProps {
  creatorId: Id<'creators'>;
}

const PERIOD_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  'one-time': 'One-Time',
};

function periodSuffix(period: string): string {
  if (period === 'one-time') return '';
  if (period === 'daily') return '/day';
  if (period === 'weekly') return '/wk';
  if (period === 'monthly') return '/mo';
  if (period === 'yearly') return '/yr';
  return '';
}

const ProductsSection = ({ creatorId }: ProductsSectionProps) => {
  const products = useQuery(api.products.mutations.listByCreator, { creatorId });
  const upsertProduct = useMutation(api.products.mutations.upsert);
  const removeProduct = useMutation(api.products.mutations.remove);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<'products'> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<Id<'products'> | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('9.99');
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [isFeatured, setIsFeatured] = useState(false);

  const loading = products === undefined;

  useEffect(() => {
    if (!dialogOpen) resetForm();
  }, [dialogOpen]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('9.99');
    setBillingPeriod('monthly');
    setIsFeatured(false);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (product: NonNullable<typeof products>[number]) => {
    setEditingId(product._id);
    setName(product.name);
    setDescription(product.description ?? '');
    setPrice((product.priceCents / 100).toFixed(2));
    setBillingPeriod(product.billingPeriod);
    setIsFeatured(product.isFeatured);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      toast.error('Enter a valid price');
      return;
    }

    setSaving(true);
    try {
      if (isFeatured && products) {
        for (const p of products) {
          if (p.isFeatured && p._id !== editingId) {
            await upsertProduct({
              productId: p._id,
              creatorId,
              name: p.name,
              description: p.description,
              priceCents: p.priceCents,
              billingPeriod: p.billingPeriod,
              isFeatured: false,
              isActive: p.isActive,
              maxSpots: p.maxSpots,
              isLimited: p.isLimited,
              isClosed: p.isClosed,
            });
          }
        }
      }

      await upsertProduct({
        productId: editingId ?? undefined,
        creatorId,
        name: name.trim(),
        description: description.trim() || undefined,
        priceCents: Math.round(numPrice * 100),
        billingPeriod,
        isFeatured,
        isActive: true,
        isLimited: editingId
          ? (products?.find((p) => p._id === editingId)?.isLimited ?? false)
          : false,
        isClosed: editingId
          ? (products?.find((p) => p._id === editingId)?.isClosed ?? false)
          : false,
        maxSpots: editingId ? products?.find((p) => p._id === editingId)?.maxSpots : undefined,
      });

      toast.success(editingId ? 'Product updated' : 'Product created');
      setDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await removeProduct({ productId: deleteId });
      toast.success('Product deleted');
      setDeleteId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const handleSetFeatured = async (id: Id<'products'>) => {
    const product = products?.find((p) => p._id === id);
    if (!product || !products) return;
    try {
      for (const p of products) {
        if (p.isFeatured) {
          await upsertProduct({
            productId: p._id,
            creatorId,
            name: p.name,
            description: p.description,
            priceCents: p.priceCents,
            billingPeriod: p.billingPeriod,
            isFeatured: false,
            isActive: p.isActive,
            maxSpots: p.maxSpots,
            isLimited: p.isLimited,
            isClosed: p.isClosed,
          });
        }
      }
      await upsertProduct({
        productId: id,
        creatorId,
        name: product.name,
        description: product.description,
        priceCents: product.priceCents,
        billingPeriod: product.billingPeriod,
        isFeatured: true,
        isActive: product.isActive,
        maxSpots: product.maxSpots,
        isLimited: product.isLimited,
        isClosed: product.isClosed,
      });
      toast.success('Featured product updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update featured product');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const rows = products ?? [];
  const deleteTarget = rows.find((p) => p._id === deleteId);
  const primaryCta = editingId ? 'Save changes' : 'Create Product';
  const reviewName = name.trim() || 'Untitled product';
  const numPrice = parseFloat(price);
  const reviewPrice =
    !isNaN(numPrice) && numPrice > 0
      ? `$${numPrice.toFixed(2)}${periodSuffix(billingPeriod || 'monthly')}`
      : null;
  const reviewBits = [reviewPrice, isFeatured ? 'Featured' : 'Standard'].filter(Boolean);

  return (
    <div>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div className="min-w-0">
          <h1 className="text-heading font-bold text-foreground">Products</h1>
          <p className="text-support text-muted-foreground mt-0.5">
            Manage monthly pricing plans (monthly only)
          </p>
        </div>
        <Button type="button" onClick={openCreate} className="min-h-11 shrink-0 w-full sm:w-auto">
          <Plus className="mr-1.5 h-4 w-4" /> Add Product
        </Button>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Package className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-ui font-semibold text-foreground mb-2">No products yet</h3>
          <p className="text-support text-muted-foreground max-w-xs mx-auto mb-5">
            Create pricing plans so subscribers can choose how to support you.
          </p>
          <Button type="button" onClick={openCreate} className="min-h-11">
            <Plus className="mr-1.5 h-4 w-4" /> Create First Product
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((product) => (
            <div
              key={product._id}
              className={`rounded-xl border bg-card p-5 relative transition-colors ${
                product.isFeatured
                  ? 'border-primary/40 ring-1 ring-primary/20'
                  : 'border-border'
              }`}
            >
              {product.isFeatured && (
                <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-caption font-medium text-primary-foreground uppercase tracking-wide">
                  <Star className="h-2.5 w-2.5" /> Featured
                </span>
              )}
              <div className="mb-3 mt-1">
                <span className="text-caption font-medium text-muted-foreground uppercase tracking-wide rounded-full bg-secondary px-2 py-0.5">
                  {PERIOD_LABELS[product.billingPeriod] ?? product.billingPeriod}
                </span>
              </div>
              <h3 className="text-ui font-semibold text-foreground mb-1">{product.name}</h3>
              {product.description && (
                <p className="text-caption text-muted-foreground mb-3 line-clamp-2">
                  {product.description}
                </p>
              )}
              <p className="text-title-lg font-bold text-foreground mb-4">
                ${(product.priceCents / 100).toFixed(2)}
                {product.billingPeriod !== 'one-time' && (
                  <span className="text-caption font-normal text-muted-foreground">
                    {periodSuffix(product.billingPeriod)}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {!product.isFeatured && (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 px-3"
                    onClick={() => void handleSetFeatured(product._id)}
                  >
                    <Star className="mr-1.5 h-3.5 w-3.5" /> Feature
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 px-3"
                  onClick={() => openEdit(product)}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 px-3 text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(product._id)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-title-lg">
              {editingId ? 'Edit Product' : 'New Product'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label htmlFor="product-name" className="text-support text-muted-foreground">
                Product name *
              </Label>
              <Input
                id="product-name"
                placeholder="e.g. Monthly Pro Access"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 text-ui"
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description" className="text-support text-muted-foreground">
                Description (optional)
              </Label>
              <Textarea
                id="product-description"
                placeholder="What's included in this plan?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none text-ui min-h-[5rem]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="product-price" className="text-support text-muted-foreground">
                  Price ($)
                </Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0.50"
                  placeholder="9.99"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-11 text-ui"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-support text-muted-foreground">Billing period</Label>
                <Select value={billingPeriod || 'monthly'} onValueChange={setBillingPeriod} disabled>
                  <SelectTrigger className="h-11 text-ui">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-caption text-muted-foreground">
                  Creators can only sell monthly subscriptions for now.
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-ui font-medium text-foreground">Featured / default plan</p>
                  <p className="text-caption text-muted-foreground">
                    Highlighted as the primary offer on your profile
                  </p>
                </div>
                <Switch
                  aria-label="Featured product"
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-caption text-muted-foreground uppercase tracking-wider mb-1">
                Ready to {editingId ? 'save' : 'create'}
              </p>
              <p className="text-ui text-foreground truncate">{reviewName}</p>
              {reviewBits.length > 0 && (
                <p className="text-support text-muted-foreground mt-0.5 truncate">
                  {reviewBits.join(' · ')}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="min-h-11"
                onClick={() => void handleSave()}
                disabled={saving || !name.trim()}
              >
                {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {primaryCta}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `“${deleteTarget.name}” will be removed from your catalogue. Existing purchases stay intact.`
                : 'This product will be removed from your catalogue. Existing purchases stay intact.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductsSection;
