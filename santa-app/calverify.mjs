import { chromium } from 'playwright';
const TOKEN='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YTM5N2NkYTc0YmZkOGFmMjZmZDFiZTMiLCJlbWFpbCI6ImFsMTc4MjE1MjQwOUBkLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzgyMTUyNDExLCJleHAiOjE3ODI3NTcyMTF9.LgNTsGSXOuHWmEv5Xz444vJ2OjFsp2vkubCmsq3xLeI', PID='6a397cdb74bfd8af26fd1bf0', BASE='http://localhost:5173';
const b=await chromium.launch();
const c=await b.newContext({viewport:{width:760,height:820},deviceScaleFactor:2});
await c.addInitScript(t=>localStorage.setItem('santa.accessToken',t),TOKEN);
const p=await c.newPage();
await p.goto(BASE+'/rooms/'+PID,{waitUntil:'networkidle'});
await p.addStyleTag({content:'[class*="tsqd"]{display:none!important}'});
await p.waitForTimeout(700);
await p.getByRole('button',{name:/Draw names/}).first().click();
await p.waitForTimeout(400);
const calVisible1 = await p.locator('.rdp-month_grid, .rdp-table, table').first().isVisible().catch(()=>false);
console.log('calendar visible after open:', calVisible1);
// click next-month arrow
const next = p.locator('.rdp-button_next, button[aria-label*="next" i]').first();
const monthBefore = await p.locator('.rdp-caption_label, .rdp-month_caption').first().innerText().catch(()=>'');
await next.click();
await p.waitForTimeout(300);
const monthAfter = await p.locator('.rdp-caption_label, .rdp-month_caption').first().innerText().catch(()=>'');
const calVisible2 = await p.locator('.rdp-month_grid, .rdp-table, table').first().isVisible().catch(()=>false);
console.log('after next-arrow: still visible =', calVisible2, '| month', JSON.stringify(monthBefore), '->', JSON.stringify(monthAfter));
// click a day (15) in the now-future month
await p.getByRole('button',{name:'15',exact:true}).first().click().catch(async()=>{ await p.locator('.rdp-day_button:not([disabled])').nth(14).click(); });
await p.waitForTimeout(300);
const drawBtn = p.getByrole('button',{name:/Draw names/}).last();
const enabled = await drawBtn.isEnabled();
console.log('day selected -> Draw button enabled:', enabled);
await p.screenshot({path:'/tmp/cal-fixed.png'});
await b.close();
