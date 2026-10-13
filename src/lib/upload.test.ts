import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadImageToConvex } from './upload';
import type { ConvexReactClient } from 'convex/react';
const client = { mutation: vi.fn(), query: vi.fn() };
const upload = (file: File, purpose = 'product-image') => uploadImageToConvex(client as unknown as ConvexReactClient, file, purpose);
beforeEach(() => {
  vi.resetAllMocks();
  client.mutation.mockResolvedValue('https://upload.example');
  client.query.mockResolvedValue('https://image.example');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok:true, json:async()=>({storageId:'asset1'}) }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe('image upload boundaries and recovery', () => {
  it.each(['image','creator-avatar','creator-onboarding','creator-banner','creator-logo','creator-favicon','product-image'])('rejects text before uploading for %s', async purpose => {
    await expect(upload(new File(['text'], 'bad.txt', {type:'text/plain'}), purpose)).rejects.toThrow(/image/i);
    expect(client.mutation).not.toHaveBeenCalled();
  });
  it.each([['empty.png','image/png',0],['unknown.png','',1],['large.png','image/png',5*1024*1024+1]])('rejects %s without creating an upload', async(name,type,size)=>{
    await expect(upload(new File([new Uint8Array(size as number)],name as string,{type:type as string}))).rejects.toThrow();
    expect(client.mutation).not.toHaveBeenCalled();
  });
  it.each([['image/png','product-image'],['image/gif','creator-avatar'],['image/svg+xml','creator-logo'],['image/x-icon','creator-favicon']])('accepts %s for %s',async(type,purpose)=>{
    await expect(upload(new File(['fixture'],'image',{type}),purpose)).resolves.toEqual({storageId:'asset1',url:'https://image.example'});
    expect(client.mutation).toHaveBeenCalledTimes(2);
  });
  it('never registers an HTTP failure and permits retry',async()=>{
    vi.mocked(fetch).mockResolvedValueOnce({ok:false,status:503,text:async()=>''} as Response);
    const file=new File(['fixture'],'image.png',{type:'image/png'});
    await expect(upload(file)).rejects.toThrow('503');
    expect(client.mutation).toHaveBeenCalledTimes(1);
    await expect(upload(file)).resolves.toHaveProperty('storageId','asset1');
  });
  it('does not resolve a file when registration fails because the session expired',async()=>{
    client.mutation.mockResolvedValueOnce('https://upload.example').mockRejectedValueOnce(new Error('UNAUTHENTICATED'));
    await expect(upload(new File(['fixture'],'image.png',{type:'image/png'}))).rejects.toThrow('UNAUTHENTICATED');
    expect(client.query).not.toHaveBeenCalled();
  });
});
