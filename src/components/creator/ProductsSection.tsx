import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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

interface Product {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  price: number;
  billing_period: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

interface ProductsSectionProps {
  creatorId: string;
}

const PERIOD_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  'one-time': 'One-Time',
};

const ProductsSection = ({ creatorId }: ProductsSectionProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('9.99');
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [isFeatured, setIsFeatured] = useState(false);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: true });
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (creatorId) fetchProducts();
  }, [creatorId]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('9.99');
    setBillingPeriod('monthly');
    setIsFeatured(false);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setName(product.name);
    setDescription(product.description ?? '');
    setPrice(product.price.toString());
    setBillingPeriod(product.billing_period);
    setIsFeatured(product.is_featured);
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

    // If marking as featured, unfeatured others first
    if (isFeatured) {
      await supabase
        .from('products')
        .update({ is_featured: false } as any)
        .eq('creator_id', creatorId);
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      price: numPrice,
      billing_period: billingPeriod,
      is_featured: isFeatured,
      is_active: true,
    };

    if (editing) {
      const { error } = await supabase
        .from('products')
        .update(payload as any)
        .eq('id', editing.id);
      if (error) toast.error('Failed to update product');
      else toast.success('Product updated');
    } else {
      const { error } = await supabase
        .from('products')
        .insert({ ...payload, creator_id: creatorId } as any);
      if (error) toast.error('Failed to create product');
      else toast.success('Product created');
    }

    setSaving(false);
    setDialogOpen(false);
    resetForm();
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast.error('Failed to delete product');
    else {
      toast.success('Product deleted');
      fetchProducts();
    }
  };

  const handleSetFeatured = async (id: string) => {
    await supabase
      .from('products')
      .update({ is_featured: false } as any)
      .eq('creator_id', creatorId);
    await supabase
      .from('products')
      .update({ is_featured: true } as any)
      .eq('id', id);
    toast.success('Featured product updated');
    fetchProducts();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

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

      {products.length === 0 ? (
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
          {products.map((product) => (
            <div
              key={product.id}
              className={`rounded-xl border bg-card p-5 relative transition-colors ${
                product.is_featured
                  ? 'border-primary/40 ring-1 ring-primary/20'
                  : 'border-border'
              }`}
            >
              {product.is_featured && (
                <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-medium text-primary-foreground uppercase tracking-wide">
                  <Star className="h-2.5 w-2.5" /> Featured
                </span>
              )}
              <div className="mb-3 mt-1">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide rounded-full bg-secondary px-2 py-0.5">
                  {PERIOD_LABELS[product.billing_period]}
                </span>
              </div>
              <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
              {product.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {product.description}
                </p>
              )}
              <p className="text-xl font-bold mb-4">
                ${product.price.toFixed(2)}
                {product.billing_period !== 'one-time' && (
                  <span className="text-xs font-normal text-muted-foreground">
                    /{product.billing_period === 'daily' ? 'day' : product.billing_period === 'weekly' ? 'wk' : product.billing_period === 'monthly' ? 'mo' : 'yr'}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1.5">
                {!product.is_featured && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => handleSetFeatured(product.id)}
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
                  onClick={() => handleDelete(product.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Product' : 'New Product'}</DialogTitle>
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
                <Select value={billingPeriod} onValueChange={setBillingPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="one-time">One-Time Purchase</SelectItem>
                  </SelectContent>
                </Select>
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
                {editing ? 'Save Changes' : 'Create Product'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsSection;
