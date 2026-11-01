'use strict';
// Real Android-width Chromium verification of reported 550-match, 3-frog issue.
// This is a real production catalogue (1878), not a fabricated species list.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.ANIMAGIA_URL||'https://animagia-calculator.onrender.com/';
const artifacts=path.join(__dirname,'..','qa-artifacts','illustrated-1878');
fs.mkdirSync(artifacts,{recursive:true});

(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const errors=[];
 try{
  const context=await browser.newContext({
   viewport:{width:390,height:844},locale:'ru-RU',
   acceptDownloads:true,reducedMotion:'reduce'
  });
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://api.inaturalist.org/**',r=>r.fulfill({
   status:200,contentType:'application/json',body:'{"results":[]}'
  }));
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.AnimagiaAnimalAtlas?.representativeLevels?.length===3
    &&typeof taxonGreek==='function',null,{timeout:30000});
  await page.locator('#name').fill('Fraser Harold Brown');
  const greek=await page.evaluate(()=>taxonGreek('Cornufer opisthodon'));
  assert.equal(await page.evaluate(x=>taxonGreekScore(x),greek).then(x=>x),1878);
  await page.locator('#greek').fill(greek);
  await page.locator('#run').click();
  await page.waitForFunction(()=>!document.getElementById('resultPanel').hidden||
   !!document.getElementById('error').textContent.trim(),null,{timeout:75000});
  assert.equal((await page.locator('#error').textContent()).trim(),'');
  const outcome=await page.evaluate(()=>{
   const counts={exact:0,genus:0,family:0,order:0,generic:0,missing:0};
   for(const row of results){
    const p=window.AnimagiaAnimalAtlas.resolve(row);
    const level=p?(p.exact===true?'exact':p.representativeLevel||'generic'):'missing';
    counts[level]++;
    if(p&&!p.exact&&!/НЕ изображение вида|обобщённый образ/i.test(p.note))
     throw Error('Missing taxon provenance warning for '+row[1]);
   }
   return {score:sum,count:results.length,counts,
    scrollWidth:document.documentElement.scrollWidth,
    clientWidth:document.documentElement.clientWidth};
  });
  assert.equal(outcome.score,1878);
  assert.equal(outcome.count,550);
  assert.deepEqual(outcome.counts,{
   exact:0,genus:3,family:210,order:312,generic:0,missing:25
  });
  assert.ok(outcome.scrollWidth<=outcome.clientWidth+2,'Horizontal mobile overflow');
  await page.locator('#animalChooserOpen').click();
  await page.locator('#animalChooser').waitFor({state:'visible'});
  assert.match(await page.locator('#animalChooserCount').textContent(),/Найдено 550/);
  const first=page.locator('#animalChooserList .animal-chooser-item').first();
  assert.match(await first.textContent(),/Образ отряда/);
  await page.screenshot({path:path.join(artifacts,'mobile-550-chooser.png')});
  await page.locator('#chooserFilterIllustrated').click();
  assert.match(await page.locator('#animalChooserCount').textContent(),/Найдено 525/);
  const target=page.locator('#animalChooserList .animal-chooser-item')
   .filter({hasText:'Bowie sagittatus'}).first();
  await target.click();
  await page.waitForFunction(()=>{
   const i=document.querySelector('#relicSilhouetteFrame img');
   return !!i && i.complete && i.naturalWidth>0 &&
    document.getElementById('relicSilhouetteStatus').textContent.includes('НЕ изображение вида Bowie sagittatus');
  },null,{timeout:45000});
  const note=await page.locator('#relicSilhouetteStatus').textContent();
  assert.match(note,/Neon valentulus/);
  await page.waitForFunction(()=>
   document.getElementById('relicCardBackdrop').dataset.posterReady==='1',null,{timeout:45000});
  const [download]=await Promise.all([
   page.waitForEvent('download',{timeout:45000}),
   page.locator('#downloadRelic').click()
  ]);
  const png=fs.readFileSync(await download.path());
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16),1200);
  assert.equal(png.readUInt32BE(20),2000);
  fs.writeFileSync(path.join(artifacts,'Bowie-group-portrait-not-species.png'),png);
  assert.deepEqual(errors,[]);
  const summary={outcome,note,downloadBytes:png.length,jsErrors:errors.length};
  fs.writeFileSync(path.join(artifacts,'result.json'),JSON.stringify(summary,null,2));
  console.log('ANIMAGIA_1878_LIVE_MOBILE_QA_PASS',JSON.stringify(summary));
  await context.close();
 }finally{await browser.close()}
})().catch(error=>{
 console.error('ANIMAGIA_1878_LIVE_MOBILE_QA_FAIL',error.stack||String(error));
 process.exitCode=1;
});
