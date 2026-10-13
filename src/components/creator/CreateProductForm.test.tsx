import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateProductForm } from './CreateProductForm';
import type { Id } from '../../../convex/_generated/dataModel';

const state = vi.hoisted(() => ({ save: vi.fn(), upload: vi.fn() }));
vi.mock('convex/react', () => ({
  useConvex: () => ({}), useMutation: () => state.save,
  useQuery: (_ref: unknown, args: unknown) => args === 'skip' ? undefined : (args as {storageId?:string})?.storageId ? 'https://image.example/old' : [],
}));
vi.mock('@/lib/upload', () => ({ uploadImageToConvex: state.upload }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() } }));
beforeEach(() => { state.save.mockReset().mockResolvedValue('product1'); });
afterEach(cleanup);

describe('product trial promises match supported checkout', () => {
  it.each([false, true])('does not advertise or silently add an unsupported trial (editing=%s)', async (editing) => {
    render(<CreateProductForm creatorId={'creator1' as Id<'creators'>} creatorName="Audit Creator"
      initial={editing ? { id: 'product1', name: 'Existing draft', description: 'Draft body', priceCents: 500,
        billingPeriod: 'monthly', isFeatured: false, isActive: false, isLimited: false, isClosed: false } : undefined}
      onCancel={() => {}} onSaved={() => {}} />);
    expect(screen.queryByText(/-day free trial/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save as Draft' }));
    await waitFor(() => expect(state.save).toHaveBeenCalledOnce());
    expect(state.save.mock.calls[0][0].description).not.toContain('Free trial:');
  });
});

function mediaForm() {
  return render(<CreateProductForm creatorId={'creator1' as Id<'creators'>} creatorName="Test Creator"
    initial={{id:'product1',name:'Saved draft',description:'',priceCents:500,billingPeriod:'monthly',isFeatured:false,isActive:false,isLimited:false,isClosed:false,imageStorageId:'asset1' as Id<'_storage'>}}
    onCancel={()=>{}} onSaved={()=>{}}/>);
}
it('removing an existing image clears the preview and saves its removal',async()=>{
  mediaForm();fireEvent.click(await screen.findByRole('button',{name:'Remove image'}));
  expect(screen.queryByRole('button',{name:'Remove image'})).not.toBeInTheDocument();
  expect(screen.getByText('No image yet')).toBeVisible();
  fireEvent.click(screen.getByRole('button',{name:'Save as Draft'}));
  await waitFor(()=>expect(state.save).toHaveBeenCalled());expect(state.save.mock.calls[0][0].imageStorageId).toBeNull();
});
it('cannot remove or save while an image is uploading, and failure preserves the image and draft',async()=>{
  let fail!:(error:Error)=>void;state.upload.mockImplementationOnce(()=>new Promise((_,reject)=>{fail=reject}));
  const view=mediaForm();await screen.findByRole('button',{name:'Remove image'});
  fireEvent.change(view.container.querySelector('input[type="file"]')!,{target:{files:[new File(['fixture'],'image.png',{type:'image/png'})]}});
  expect(screen.getByRole('button',{name:'Remove image'})).toBeDisabled();
  expect(screen.getByRole('button',{name:'Save as Draft'})).toBeDisabled();
  await act(async()=>fail(new Error('Offline')));
  expect(screen.getByRole('button',{name:'Remove image'})).toBeEnabled();
  fireEvent.click(screen.getByRole('button',{name:'Save as Draft'}));await waitFor(()=>expect(state.save).toHaveBeenCalled());
  expect(state.save.mock.calls[0][0]).toMatchObject({name:'Saved draft',imageStorageId:'asset1'});
});

it('repeated saves of an empty description do not duplicate generated access details', async()=>{
  let description = '';
  for(let i=0;i<3;i++) {
    const view=render(<CreateProductForm creatorId={'creator1' as Id<'creators'>} creatorName="Test Creator"
      initial={{name:'No description',description,priceCents:500,billingPeriod:'monthly',isFeatured:false,isActive:false,isLimited:false,isClosed:false}}
      onCancel={()=>{}} onSaved={()=>{}}/>);
    expect(screen.getByLabelText('Full Description')).toHaveValue('');
    fireEvent.click(screen.getByRole('button',{name:'Save as Draft'}));
    await waitFor(()=>expect(state.save).toHaveBeenCalledTimes(i+1));
    description=state.save.mock.calls[i][0].description;
    expect(description.match(/What's included:/g)).toHaveLength(1);
    view.unmount();
  }
});

it('restores failed edits to the same product and clears recovery only after a successful save', async () => {
  const { draftKey, readDraft, removeDraft, productDraftSchema } = await import('@/lib/formDrafts');
  const key = draftKey('creator1', 'product'); removeDraft(key);
  state.save.mockRejectedValueOnce(new Error('Offline'));
  let view = mediaForm();
  fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'Recovered product edit' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save as Draft' }));
  await waitFor(() => expect(state.save).toHaveBeenCalledOnce());
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save as Draft' })).toBeEnabled());
  view.unmount(); view = mediaForm();
  expect(screen.getByLabelText('Product Name')).toHaveValue('Recovered product edit');
  expect(readDraft(key, productDraftSchema)?.data.recordId).toBe('product1');
  fireEvent.click(screen.getByRole('button', { name: 'Save as Draft' }));
  await waitFor(() => expect(readDraft(key, productDraftSchema)).toBeNull());
  expect(state.save.mock.calls[1][0]).toMatchObject({ productId: 'product1', name: 'Recovered product edit' });
  view.unmount();
});

it('retains a newly created product ID when later edits outlive the save request', async () => {
  const { draftKey, readDraft, removeDraft, productDraftSchema } = await import('@/lib/formDrafts');
  const key = draftKey('creator-late-save', 'product'); removeDraft(key);
  let finish!: (id: string) => void;
  state.save.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const view = render(<CreateProductForm creatorId={'creator-late-save' as Id<'creators'>} creatorName="Test Creator" onCancel={() => {}} onSaved={() => {}} />);
  fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'Submitted product' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save as Draft' }));
  fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'Later product edit' } });
  await act(async () => finish('new-product-id'));
  view.unmount();
  const recovered = readDraft(key, productDraftSchema);
  expect(recovered?.data).toMatchObject({ recordId: 'new-product-id', name: 'Later product edit' });
  expect(recovered?.baseline).toMatchObject({ recordId: 'new-product-id', name: 'Submitted product' });
  removeDraft(key);
});
