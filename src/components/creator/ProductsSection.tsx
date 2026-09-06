import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

const ProductsSection = ({ creatorId }: ProductsSectionProps) => {
  const products = useQuery(api.products.mutations.listByCreator, { creatorId });
  const upsertProduct = useMutation(api.products.mutations.upsert);
  const removeProduct = useMutation(api.products.mutations.remove);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<'products'> | null>(null);
  const [saving, setSaving] = useState(false);

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
    setBillingPeriod('monthly');
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

  const handleDelete = async (id: Id<'products'>) => {
    try {
      await removeProduct({ productId: id });
      toast.success('Product deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete product');
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
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const rows = products ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Products & Pricing
        </h2>
        <Button variant="hero" size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Product
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Package className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No products yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-5">
            Create pricing plans so subscribers can choose how to support you.
          </p>
          <Button variant="hero" size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Create First Product
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
                <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-medium text-primary-foreground uppercase tracking-wide">
                  <Star className="h-2.5 w-2.5" /> Featured
                </span>
              )}
              <div className="mb-3 mt-1">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide rounded-full bg-secondary px-2 py-0.5">
                  {PERIOD_LABELS[product.billingPeriod]}
                </span>
              </div>
              <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
              {product.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {product.description}
                </p>
              )}
              <p className="text-xl font-bold mb-4">
                ${(product.priceCents / 100).toFixed(2)}
                {product.billingPeriod !== 'one-time' && (
                  <span className="text-xs font-normal text-muted-foreground">
                    /{product.billingPeriod === 'daily' ? 'day' : product.billingPeriod === 'weekly' ? 'wk' : product.billingPeriod === 'monthly' ? 'mo' : 'yr'}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1.5">
                {!product.isFeatured && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => handleSetFeatured(product._id)}
                    title="Set as featured"
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => openEdit(product)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 px-2 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(product._id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Product' : 'New Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Product Name
              </label>
              <Input
                placeholder="e.g. Monthly Pro Access"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Description (optional)
              </label>
              <Textarea
                placeholder="What's included in this plan?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Price ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.50"
                  placeholder="9.99"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Billing Period
                </label>
                <Select value={billingPeriod} onValueChange={setBillingPeriod} disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Launch supports monthly recurring only.
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm">Mark as featured / default plan</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="hero" size="sm" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {editingId ? 'Save Changes' : 'Create Product'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsSection;
