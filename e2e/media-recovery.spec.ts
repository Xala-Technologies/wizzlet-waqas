import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
// Opt-in, disposable development creator only. Do not record authentication inputs.
const fixturePath=process.env.E2E_FORM_FIXTURES;
const fixture=fixturePath?JSON.parse(readFileSync(fixturePath,'utf8')):undefined;
test.skip(!fixture,'Requires disposable development audit accounts');
test.use({trace:'off',screenshot:'off'});
const png=readFileSync(new URL('../public/brand/sweeph-symbol-dark.png',import.meta.url));
async function login(page:Page){
  expect(['127.0.0.1','localhost']).toContain(new URL(process.env.PLAYWRIGHT_BASE_URL??'http://localhost:8080').hostname);
  expect(fixture.devUrl).toBe('https://combative-mongoose-559.convex.cloud');
  await page.goto('/login');await page.getByLabel('Email',{exact:true}).fill(fixture.actors.creator.email);
  await page.getByLabel('Password',{exact:true}).fill(fixture.actors.creator.password);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/\/creator$/,{timeout:30_000});
}
async function editProduct(page:Page){
  await page.goto('/creator/products?demo=0');
  const row=page.getByRole('row').filter({hasText:'Media audit disposable draft'});
  await row.getByRole('button',{name:'Actions',exact:true}).click();
  await page.getByRole('menuitem',{name:'Edit',exact:true}).click();
  await expect(page.getByLabel('Product Name',{exact:true})).toHaveValue('Media audit disposable draft');
  await expect(page.getByLabel('Full Description',{exact:true})).toHaveValue('');
}
test.afterEach(async({page})=>{
  const menu=page.getByRole('button',{name:'Account menu'});
  if(await menu.isVisible()){await menu.click();await page.getByRole('menuitem',{name:'Log out',exact:true}).click();}
  else {const nav=page.getByRole('button',{name:'Open navigation menu'});if(await nav.isVisible()){await nav.click();await page.getByRole('button',{name:/^(Sign out|Log out)$/}).click();}}
});
for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  test.describe(`${viewport.width}px media`,()=>{
    test.use({viewport});
    test('profile invalid file, interrupted upload, retry, save and removal survive refresh',async({page})=>{
      await login(page);await page.goto('/creator/settings?demo=0');
      const input=page.locator('#avatar-upload');
      await input.setInputFiles({name:'not-image.txt',mimeType:'text/plain',buffer:Buffer.from('invalid fixture')});
      await expect(page.getByText('Use a JPG, PNG, WebP or GIF image',{exact:true})).toBeVisible();
      let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve});
      await page.route('**/api/storage/upload*',async route=>{await pending;await route.abort('failed');},{times:1});
      await input.setInputFiles({name:'test.png',mimeType:'image/png',buffer:png});
      await expect(page.getByRole('button',{name:'Upload new photo',exact:true})).toBeDisabled();
      await expect(page.getByRole('button',{name:'Save Changes',exact:true})).toBeDisabled();
      await expect(page.getByRole('button',{name:'Remove photo',exact:true})).toBeDisabled();
      release();
      await expect(page.getByRole('button',{name:'Upload new photo',exact:true})).toBeEnabled();
      await input.setInputFiles({name:'test.png',mimeType:'image/png',buffer:png});
      await expect(page.getByText('Avatar uploaded — save to publish',{exact:true})).toBeVisible();
      await page.getByRole('button',{name:'Save Changes',exact:true}).click();
      await expect(page.getByText('Settings saved',{exact:true})).toBeVisible();
      await page.reload();await expect(page.getByRole('button',{name:'Remove photo',exact:true})).toBeEnabled();
      await page.getByRole('button',{name:'Remove photo',exact:true}).click();await page.getByRole('button',{name:'Save Changes',exact:true}).click();
      await expect(page.getByText('Settings saved',{exact:true})).toBeVisible();
      await page.reload();await expect(page.getByRole('button',{name:'Remove photo',exact:true})).toBeDisabled();
      await page.getByRole('link',{name:'Branding',exact:true}).click();
      await expect(page.getByRole('button',{name:'Remove logo',exact:true})).toBeDisabled();
    });
    test('product upload, replacement failure, retry and removal persist without stale preview',async({page})=>{
      await login(page);await editProduct(page);
      const input=page.locator('input[type="file"]');
      await input.setInputFiles({name:'test.png',mimeType:'image/png',buffer:png});await expect(page.getByText('Image uploaded',{exact:true})).toBeVisible();
      let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve});
      await page.route('**/api/storage/upload*',async route=>{await pending;await route.abort('failed');},{times:1});
      await input.setInputFiles({name:'replacement.png',mimeType:'image/png',buffer:png});
      await expect(page.getByRole('button',{name:'Remove image',exact:true})).toBeDisabled();
      await expect(page.getByRole('button',{name:'Save as Draft',exact:true})).toBeDisabled();release();
      await expect(page.getByRole('button',{name:'Edit Image',exact:true})).toBeEnabled();
      await expect(page.getByLabel('Product Name',{exact:true})).toHaveValue('Media audit disposable draft');
      await input.setInputFiles({name:'replacement.png',mimeType:'image/png',buffer:png});await expect(page.getByText('Image uploaded',{exact:true})).toBeVisible();
      await expect(page.getByRole('button',{name:'Save as Draft',exact:true})).toBeEnabled();
      await page.getByRole('button',{name:'Save as Draft',exact:true}).click();
      await expect(page.getByRole('button',{name:'Create Product',exact:true})).toBeVisible();
      await editProduct(page);await page.getByRole('button',{name:'Remove image',exact:true}).click();
      await expect(page.getByText('No image yet',{exact:true})).toBeVisible();
      await expect(page.getByRole('button',{name:'Remove image',exact:true})).toHaveCount(0);
      await page.getByRole('button',{name:'Save as Draft',exact:true}).click();
      await expect(page.getByRole('button',{name:'Create Product',exact:true})).toBeVisible();
      await editProduct(page);await expect(page.getByText('No image yet',{exact:true})).toBeVisible();
      await expect(page.getByRole('button',{name:'Remove image',exact:true})).toHaveCount(0);
    });
  });
}
