import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getUrl, registerOwnedFile } from '../../convex/files/storage';
vi.mock('../../convex/lib/auth',()=>({requireAppUser:async()=>({_id:'owner'})}));
type Handler={_handler:(ctx:unknown,args:unknown)=>Promise<unknown>};
const register=(ctx:unknown,purpose='product-image')=>(registerOwnedFile as unknown as Handler)._handler(ctx,{storageId:'asset1',purpose});
function context(existing:object|null=null,metadata:object|null={size:10,contentType:'image/png'}){
  return {db:{query:vi.fn(()=>({withIndex:()=>({unique:async()=>existing})})),system:{get:vi.fn(async()=>metadata)},insert:vi.fn(async()=>'file1')},storage:{getUrl:vi.fn(async()=>'https://image.example')}};
}
beforeEach(()=>vi.clearAllMocks());
describe('storage registration validation and ownership',()=>{
  it.each([null,{size:1,contentType:'text/plain'},{size:0,contentType:'image/png'},{size:5*1024*1024+1,contentType:'image/png'},{size:1}])('rejects missing/invalid storage metadata %j',async metadata=>{
    const ctx=context(null,metadata);await expect(register(ctx)).rejects.toThrow();expect(ctx.db.insert).not.toHaveBeenCalled();
  });
  it.each([['creator-logo',2],['creator-favicon',1]])('enforces the advertised %s size limit',async(purpose,max)=>{
    await expect(register(context(null,{size:(Number(max)*1024*1024)+1,contentType:'image/png'}),String(purpose))).rejects.toThrow(`${max}MB`);
  });
  it('registers valid metadata and is idempotent for the owner',async()=>{
    const ctx=context();await expect(register(ctx)).resolves.toBe('file1');expect(ctx.db.insert).toHaveBeenCalledOnce();
    const existing=context({_id:'file1',ownerUserId:'owner'});await expect(register(existing)).resolves.toBe('file1');expect(existing.db.insert).not.toHaveBeenCalled();
  });
  it('cannot claim another user’s asset',async()=>{
    const ctx=context({_id:'file1',ownerUserId:'outsider'});await expect(register(ctx)).rejects.toThrow('FORBIDDEN');expect(ctx.db.insert).not.toHaveBeenCalled();
  });
  it.each([null,{ownerUserId:'outsider'}])('cannot resolve an unregistered or other user’s file',async asset=>{
    const ctx=context(asset);await expect((getUrl as unknown as Handler)._handler(ctx,{storageId:'asset1'})).rejects.toThrow('FORBIDDEN');expect(ctx.storage.getUrl).not.toHaveBeenCalled();
  });
});
