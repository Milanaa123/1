'use strict';
// Stage 8: real production-site smoke tests, not synthetic search fixtures.
// Browser requests go to the deployed catalogue and its audited SHA-256 shards.
// No real visitor name is used, and no test names are stored by the website.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const artifacts=path.join(root,'qa-artifacts','stage8-live');
fs.mkdirSync(artifacts,{recursive:true});
const base=process.env.ANIMAGIA_URL||'https://animagia-calculator.onrender.com/';
const prefix=path.join(artifacts,'acceptance');
const errors=[];
const findings=[];
function check(condition,message){assert.ok(condition,message);}
function output(name,data){findings.push({test:name,...data});console.log('STAGE8_CHECK',name,JSON.stringify(data))}
async function pageReady(page){
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>typeof nameGreekFromLatin==='function'&&
    !!window.AnimagiaAnimalAtlas?.resolve&&
    !!document.getElementById('ritualToGreek'),null,{timeout:30000});
}
async function makeReady(page){
  await page.locator('#name').fill('Fraser Harold Brown');
  await page.waitForFunction(()=>document.getElementById('latin').value==='Fraser Harold Brown');
  const greek=await page.locator('#greek').inputValue();
  assert.equal(greek,'Φρασερ Ἁρολδ Βροϝν','English-to-Ancient-Greek direct transliteration');
  await page.locator('#ritualToGreek').click();
  check(await page.locator('#ritualStep3').isVisible(),'Step 3 must be visible');
  const sum=await page.evaluate(()=>score(document.getElementById('greek').value));
  assert.equal(sum,1339);
  return greek;
}
async function submitAndRead(page,expectedScore){
  await page.locator('#run').click();
  await page.waitForFunction(()=>!document.getElementById('resultPanel').hidden||
    !!document.getElementById('error').textContent.trim(),null,{timeout:60000});
  const err=await page.locator('#error').textContent();
  assert.equal(err?.trim(),'','Production search error');
  const data=await page.evaluate(()=>({
    score:Number(document.getElementById('score').textContent.replace(/\s/g,'')),
    total:Number(document.getElementById('total').textContent.replace(/\s/g,'')),
    rows:results.length,matching:results.every(r=>r[0]===sum&&taxonGreekScore(r[1])===sum),
    catalogue:meta?.quality_audit?.status,
    qualityCount:meta?.quality_audit?.checked_records,
    selected:document.getElementById('relicAnimal').value,
    chooserDisabled:document.getElementById('animalChooserOpen').disabled
  }));
  assert.equal(data.score,expectedScore);
  assert.equal(data.catalogue,'passed');
  assert.equal(data.total,data.rows);
  check(data.rows>0,'This known numeric score must have real catalogue results');
  check(data.matching,'Every result must equal the Greek score');
  check(!data.chooserDisabled,'Animal chooser must be enabled');
  return data;
}
async function downloadList(page,kind){
  const [item]=await Promise.all([
    page.waitForEvent('download',{timeout:20000}),
    page.locator(kind==='csv'?'#exportCsv':'#exportTxt').click()
  ]);
  const data=fs.readFileSync(await item.path());
  check(data.length>100,'Export was empty: '+kind);
  assert.match(item.suggestedFilename(),new RegExp('\\.'+kind+'$'));
  if(kind==='txt')check(data.includes(Buffer.from('Fraser Harold Brown','utf8')),'TXT should include example input');
  else check(data.includes(Buffer.from('Русское название','utf8')),'CSV must contain column headers');
  return {filename:item.suggestedFilename(),bytes:data.length};
}
async function inspectViewport(page,where){
  const sizes=await page.evaluate(()=>({
    scroll:document.documentElement.scrollWidth,
    client:document.documentElement.clientWidth,
    windowWidth:innerWidth,
    pictureWidth:document.getElementById('relicCardBackdrop')?.width,
    pictureHeight:document.getElementById('relicCardBackdrop')?.height
  }));
  check(sizes.scroll<=sizes.client+2,where+' horizontal overflow: '+JSON.stringify(sizes));
  assert.equal(sizes.pictureWidth,1200);
  assert.equal(sizes.pictureHeight,2000);
  return sizes;
}
(async()=>{
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  try{
    for(const [device,viewport] of [
      ['desktop',{width:1280,height:900}],
      ['mobile',{width:390,height:844}]
    ]){
      const context=await browser.newContext({viewport,acceptDownloads:true,locale:'ru-RU',reducedMotion:'reduce'});
      const page=await context.newPage();
      page.on('pageerror',error=>errors.push(device+': '+error.message));
      // Photo service is incidental to the calculation and can rate-limit;
      // the real catalogue, JavaScript, PNG and CSS are NOT mocked.
      await page.route('https://api.inaturalist.org/**',route=>route.fulfill({
        status:200,contentType:'application/json',body:'{"results":[]}'
      }));
      await pageReady(page);
      const metadata=await page.request.get(new URL('meta.json',base).href,{timeout:45000});
      assert.equal(metadata.status(),200);
      const json=await metadata.json();
      assert.equal(json.quality_audit?.status,'passed');
      check(json.unique_records>1000000,'Full catalogue was not published');
      const greek=await makeReady(page);
      const result=await submitAndRead(page,1339);
      const layout=await inspectViewport(page,device);
      output(device+' full-name calculation',{greek,score:result.score,count:result.total,layout});
      await page.locator('#animalChooserOpen').click();
      check(await page.locator('#animalChooser').isVisible(),'Chooser should open on '+device);
      await page.locator('#chooserFilterIllustrated').click();
      const chooser=await page.locator('#animalChooserCount').textContent();
      await page.locator('#animalChooserClose').click();
      check(!(await page.locator('#animalChooser').isVisible()),'Chooser should close');
      output(device+' chooser',{caption:chooser});
      if(device==='desktop'){
        const csv=await downloadList(page,'csv');
        const txt=await downloadList(page,'txt');
        output('catalogue exports',{csv,txt});
        // User-editable Greek orthography: run a genuine 1531 catalogue
        // lookup, then select the real approved Canis lupus species.
        const wolfGreek=await page.evaluate(()=>taxonGreek('Canis lupus'));
        await page.locator('#greek').fill(wolfGreek);
        const wolf=await submitAndRead(page,1531);
        const choose=await page.evaluate(()=>{
          const el=document.getElementById('relicAnimal');
          const available=[...el.options].some(x=>x.value==='Canis lupus|species');
          if(available){el.value='Canis lupus|species';el.dispatchEvent(new Event('change',{bubbles:true}));}
          return available;
        });
        check(choose,'Approved wolf missing from production search results');
        await page.waitForFunction(()=>
          document.getElementById('relicPreviewScientific').textContent==='Canis lupus'&&
          document.getElementById('relicCardBackdrop').dataset.posterReady==='1',null,{timeout:45000});
        await page.waitForFunction(()=>{
          const img=document.querySelector('#relicSilhouetteFrame img');
          return !!img && img.complete && img.naturalWidth>0;
        },null,{timeout:30000});
        await page.locator('#relicCard').screenshot({path:prefix+'-desktop-card.png'});
        const [image]=await Promise.all([
          page.waitForEvent('download',{timeout:45000}),
          page.locator('#downloadRelic').click()
        ]);
        const png=fs.readFileSync(await image.path());
        assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
        assert.equal(png.readUInt32BE(16),1200);
        assert.equal(png.readUInt32BE(20),2000);
        assert.match(image.suggestedFilename(),/Canis_lupus\.png$/);
        fs.writeFileSync(prefix+'-export.png',png);
        await page.evaluate(()=>{window.__printed=0;window.print=()=>{window.__printed++};});
        await page.locator('#printRelic').click();
        await page.waitForFunction(()=>window.__printed>0,null,{timeout:30000});
        const cards=await page.locator('#printRelicList .print-relic-animal').count();
        check(cards>=1,'Print view has no cards');
        const pdf=await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true});
        assert.equal(pdf.subarray(0,5).toString(),'%PDF-');
        check(pdf.length>10000,'Generated PDF unexpectedly small');
        fs.writeFileSync(prefix+'-bestiary.pdf',pdf);
        output('live wolf PNG and print PDF',{score:wolf.score,matching:wolf.matching,
          pngBytes:png.length,pdfBytes:pdf.length,printCards:cards,download:image.suggestedFilename()});
        await page.locator('#name').fill('Fraser5 Brown');
        check(await page.locator('#resultPanel').isHidden(),'Editing the name should clear stale results');
        output('invalid input reset',{reset:true});
      }else{
        // Mobile responsive layout, real search results and screenshot
        // without a synthetic catalogue fixture.
        await page.screenshot({path:prefix+'-mobile-page.png',fullPage:true,timeout:45000});
        const before=await page.evaluate(()=>document.activeElement?.id||'');
        await page.locator('#name').fill('Fraser5 Brown');
        check(await page.locator('#resultPanel').isHidden(),'Mobile edits must clear stale results');
        output('mobile invalid input and focus',{before,reset:true});
      }
      await context.close();
    }
    assert.equal(errors.length,0,'Browser runtime errors: '+errors.join(' | '));
    output('uncaught browser errors',{count:errors.length});
    fs.writeFileSync(path.join(artifacts,'result.json'),JSON.stringify({
      target:base,finished:new Date().toISOString(),checks:findings,errors
    },null,2));
    console.log('STAGE8_LIVE_ACCEPTANCE_PASS');
  }finally{await browser.close()}
})().catch(error=>{
  console.error('STAGE8_LIVE_ACCEPTANCE_FAIL',error.stack||String(error));
  process.exitCode=1;
});
