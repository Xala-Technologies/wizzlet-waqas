import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

test.use({trace:'off',screenshot:'off',actionTimeout:15000});
const fixturePath=process.env.E2E_FORM_FIXTURES;
const fixture=fixturePath ? JSON.parse(readFileSync(fixturePath,'utf8')) as {
 devUrl:string; actors:Record<'creator'|'member',{email:string;password:string}>;
} : null;
test.skip(!fixture,'Dedicated development actors required');
async function login(page:Page,role:'creator'|'member') {
 expect(new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8080').hostname).toMatch(/^(localhost|127\.0\.0\.1)$/);
 expect(fixture!.devUrl).toBe('https://combative-mongoose-559.convex.cloud');
 await page.goto('/login');
 await page.getByLabel('Email',{exact:true}).fill(fixture!.actors[role].email);
 await page.getByLabel('Password',{exact:true}).fill(fixture!.actors[role].password);
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page).toHaveURL(role==='creator'?/\/creator$/:/\/dashboard$/,{timeout:30000});
}
async function discard(page:Page) {
 await page.getByRole('button',{name:'Discard draft',exact:true}).click();
 await page.getByRole('button',{name:'Discard changes',exact:true}).click();
}
async function evidence(page:Page,name:string) {
 if (!process.env.E2E_RECOVERY_EVIDENCE) return;
 mkdirSync(process.env.E2E_RECOVERY_EVIDENCE,{recursive:true});
 await page.getByRole('complementary',{name:'Unsaved changes'}).scrollIntoViewIfNeeded();
 await page.screenshot({path:resolve(process.env.E2E_RECOVERY_EVIDENCE,name),fullPage:false});
}
test.afterEach(async({page})=>{
 await page.keyboard.press('Escape');
 // Leave the narrow onboarding shell for the normal account menu.
 await page.goto('/dashboard');
 await expect(page.getByRole('button',{name:/^(Account menu|Open navigation menu)$/}).filter({visible:true}).first()).toBeVisible({timeout:30000});
 const menu=page.getByRole('button',{name:'Account menu'});
 if(await menu.isVisible()) {
  await menu.click();await page.getByRole('menuitem',{name:'Log out',exact:true}).click();
 } else {
  await page.getByRole('button',{name:'Open navigation menu'}).click();
  await page.getByRole('button',{name:/^(Sign out|Log out)$/}).click();
 }
 await expect(page).toHaveURL(/\/$/);
});
for(const width of [1440,390]) test.describe(`${width}px recovery`,()=>{
 test.use({viewport:{width,height:width===390?844:1000}});
 for(const role of ['creator','member'] as const) test(`${role} unsent replies stay with their conversation across switching, refresh, and discard`,async({page},info)=>{
  await login(page,role);
  const url=role==='creator'?'/creator/messages?demo=1&subscriberId=demo-msg-1':'/dashboard/messages?demo=1&creatorId=demo-member-msg-shark';
  const personA=role==='creator'?'Jordan Blake':'Shark Picks';
  const personB=role==='creator'?'Sam Rivera':'The Profit Club';
  await page.goto(url);
  const composer=page.getByRole('textbox',{name:'Message',exact:true});
  const switchTo=async(name:string)=>{
   if(width===390) await page.getByRole('button',{name:'Back to conversations',exact:true}).click();
   await page.getByRole('button',{name:new RegExp(name)}).click();
  };
  await composer.fill('Keep reply A unsent');
  await switchTo(personB);
  await expect(composer).toHaveValue('');
  await composer.fill('Keep reply B unsent');
  await page.reload();
  await expect(composer).toHaveValue('Keep reply B unsent');
  await expect(page.getByText('Unsaved changes recovered',{exact:true})).toBeVisible();
  await evidence(page,`${info.project.name}-${width}-${role}-reply-recovered.png`);
  await switchTo(personA);await expect(composer).toHaveValue('Keep reply A unsent');
  await discard(page);await expect(composer).toHaveValue('');
  await page.reload();await expect(composer).toHaveValue('');
  await switchTo(personB);await expect(composer).toHaveValue('Keep reply B unsent');
  await discard(page);await expect(composer).toHaveValue('');
 });
 test('onboarding text and step recover without publishing',async({page},info)=>{
  await login(page,'creator');await page.goto('/creator/onboarding');
  const bio=page.getByRole('textbox',{name:'Page description'});
  await expect(bio).toBeVisible();const original=await bio.inputValue();
  await bio.fill('Recovered onboarding biography, still unpublished.');
  await page.reload();await expect(bio).toHaveValue('Recovered onboarding biography, still unpublished.');
  await evidence(page,`${info.project.name}-${width}-onboarding-recovered.png`);
  await page.getByRole('button',{name:'Go back',exact:true}).click();
  await page.getByRole('button',{name:'Go back',exact:true}).click();
  const name=page.getByLabel('Creator name');await expect(name).toBeVisible();
  await name.fill('Recovered onboarding name');
  await page.reload();await expect(name).toHaveValue('Recovered onboarding name');
  await discard(page);await expect(bio).toHaveValue(original);
  await page.reload();await expect(bio).toHaveValue(original);
  await expect(page.getByRole('button',{name:'Discard draft',exact:true})).toHaveCount(0);
 });
});
