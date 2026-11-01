'use strict';
// Deterministic browser smoke test for the existing calculator/card UI.
// It uses a synthetic result row; it never sends or stores visitor names.
const {chromium}=require('playwright');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'qa-artifacts','browser-export');
fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.json':'application/json','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 // Render publishes the approved original files at a new cache-safe public
 // directory. The GitHub source repository stores identical PNGs at this
 // path. Serve the alias locally, without any image re-encoding.
 const published='/art/animagia-original-400/';
 const serving=pathname.startsWith(published)
  ?'/art/animagia-selected-107/'+pathname.slice(published.length)
  :pathname;
 const filename=path.resolve(root,'.'+serving);
 if(!filename.startsWith(root+path.sep)) {res.writeHead(403);res.end();return;}
 fs.readFile(filename,(err,data)=>{
  if(err){res.writeHead(404);res.end('not found');return;}
  res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream'});res.end(data);
 });
});
const listen=()=>new Promise(ok=>server.listen(0,'127.0.0.1',ok));
(async()=>{
 await listen();
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900},acceptDownloads:true});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('https://api.inaturalist.org/**',route=>route.fulfill({status:200,contentType:'application/json',body:'{"results":[]}'}));
 await page.route('https://api.gbif.org/**',route=>route.fulfill({status:200,contentType:'application/json',body:'{}'}));
 await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof window.AnimagiaAnimalAtlas?.resolve==='function');
 const setup=await page.evaluate(()=>{
  const latin='Canis lupus',greek=taxonGreek(latin),n=taxonGreekScore(latin);
  const row=[n,latin,'species','Mammalia','Carnivora','','Chordata','Canidae','Псовые','Волк'];
  document.getElementById('name').value='Тестовый пример';
  document.getElementById('greek').value=greek;
  results=[row];sum=n;
  document.getElementById('score').textContent=String(n);
  document.getElementById('total').textContent='1';
  document.getElementById('resultPanel').hidden=false;
  render();
  return {n,greek,hasArt:!!window.AnimagiaAnimalAtlas.resolve(row)};
 });
 assert.equal(setup.n,1531);
 assert.equal(setup.hasArt,true,'The approved wolf art must resolve');
 await page.waitForFunction(()=>document.querySelector('#relicCardBackdrop')?.dataset.posterReady==='1',{timeout:20000});
 const dimensions=await page.locator('#relicCardBackdrop').evaluate(canvas=>{
  const ctx=canvas.getContext('2d');
  const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  let visible=0,transparent=0;
  for(let i=3;i<data.length;i+=80){if(data[i]>0)visible++;else transparent++;}
  return {width:canvas.width,height:canvas.height,visible,transparent};
 });
 assert.equal(dimensions.width,1200);assert.equal(dimensions.height,2000);
 assert(dimensions.visible>1000,'Canvas is not painted');
 assert(dimensions.transparent>0,'The decorative border must retain alpha cutouts');
 await page.locator('#relicCard').screenshot({path:path.join(out,'desktop-card.png')});
 const downloadPromise=page.waitForEvent('download',{timeout:20000});
 await page.locator('#downloadRelic').click();
 const download=await downloadPromise;
 const png=fs.readFileSync(await download.path());
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),2000);
 assert.match(download.suggestedFilename(),/Canis_lupus\.png$/);
 fs.writeFileSync(path.join(out,'exported-card.png'),png);
 await page.evaluate(()=>{window.__printed=0;window.print=()=>{window.__printed++};});
 assert.equal(await page.locator('#downloadBestiary').isDisabled(),false);
 const downloadBook=page.waitForEvent('download',{timeout:60000});
 await page.locator('#downloadBestiary').click();
 const book=await downloadBook;
 const pdf=fs.readFileSync(await book.path());
 assert.match(book.suggestedFilename(),/Анимагия_волшебный_бестиарий_1531_1\\.pdf$/);
 assert.equal(pdf.subarray(0,5).toString(),'%PDF-');
 const pages=(pdf.toString('latin1').match(/\\/Type\\s*\\/Page\\b/g)||[]).length;
 assert.equal(pages,2,'One cover page + one illustrated animal page');
 assert(pdf.length>30000,'An illustrated PDF cannot be almost empty');
 fs.writeFileSync(path.join(out,'downloaded-bestiary.pdf'),pdf);
 assert.equal(await page.evaluate(()=>window.__printed),0,'Booklet must download without printing');
 const secondary=page.waitForEvent('download',{timeout:60000});
 await page.locator('#printPdf').click();
 const secondBook=await secondary;
 const secondaryPdf=fs.readFileSync(await secondBook.path());
 assert.equal(secondaryPdf.subarray(0,5).toString(),'%PDF-');
 assert.equal(await page.evaluate(()=>window.__printed),0,'Bottom PDF button must not print either');
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:path.join(out,'mobile-preview.png'),fullPage:true});
 const mobile=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
 assert(mobile.scroll<=mobile.client+2,'Horizontal page overflow: '+JSON.stringify(mobile));
 assert.equal(errors.length,0,'Uncaught JavaScript errors: '+errors.join(' | '));
 console.log('BROWSER_EXPORT_QA_SUCCESS '+JSON.stringify({dimensions,filename:download.suggestedFilename(),pngBytes:png.length,pdfBytes:pdf.length,pagesApprox:pages,printed:0,mobile,jsErrors:errors.length}));
 await browser.close();
})().catch(err=>{console.error('BROWSER_EXPORT_QA_FAILURE',err);process.exitCode=1;}).finally(()=>server.close());
