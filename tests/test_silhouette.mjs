import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const API='https://api.phylopic.org';
const EXACT='11111111-1111-4111-8111-111111111111';
const GENUS='22222222-2222-4222-8222-222222222222';
const PIC1='33333333-3333-4333-8333-333333333333';
const PIC2='44444444-4444-4444-8444-444444444444';

function makeFixture(){
 const calls=[];
 class MockImage {
   naturalWidth=500;
   naturalHeight=300;
   set src(url){this._src=url;queueMicrotask(()=>this.onload?.());}
   get src(){return this._src;}
 }
 const json=(data)=>({ok:true,json:async()=>data});
 const fetch=async (url,options={})=>{
   const u=new URL(url),name=u.searchParams.get('filter_name');
   calls.push({url:String(url),options});
   if(u.pathname==='/')return json({build:560});
   if(u.pathname==='/nodes'){
     const item=name==='panthera uncia'?{uuid:EXACT,names:[{value:'Panthera uncia'}]}:
       name==='ursus'?{uuid:GENUS,names:[{value:'Ursus'}]}:null;
     return json({_embedded:{items:item?[item]:[]}});
   }
   if(u.pathname==='/images'){
     const id=u.searchParams.get('filter_node')||u.searchParams.get('filter_clade');
     const item=id===EXACT?{uuid:PIC1,_links:{vectorFile:{href:'https://static.phylopic.org/animal-a.svg'}}}:
       id===GENUS?{uuid:PIC2,_links:{vectorFile:{href:'https://static.phylopic.org/animal-b.svg'}}}:null;
     return json({_embedded:{items:item?[item]:[]}});
   }
   if(u.pathname.endsWith('.svg'))return {
     ok:true,headers:{get:()=> 'image/svg+xml'},
     blob:async()=>new Blob(['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20"><path d="M 3 3 h 20 v 13 H 3 z"/></svg>'],{type:'image/svg+xml'})
   };
   throw Error('Unexpected request '+url);
 };
 const context=vm.createContext({window:{},URL,Blob,Image:MockImage,AbortSignal,fetch,
   Promise,Map,Array,Number,String,Math,Error});
 vm.runInContext(fs.readFileSync('silhouette_service.js','utf8'),context);
 return {api:context.window.AnimagiaSilhouettes,calls};
}
const animal=name=>[500,name,'species','Mammalia','Carnivora','','Chordata'];

test('exact real species gets its own public-domain SVG silhouette',async()=>{
 const {api,calls}=makeFixture();
 const art=await api.load(animal('Panthera uncia'));
 assert.equal(art?.exact,true);
 assert.equal(art?.name,'Panthera uncia');
 assert.equal(art?.link,'https://www.phylopic.org/images/'+PIC1);
 assert.match(art?.src??'',/^blob:/);
 assert.ok(calls.filter(x=>x.url.includes('/images?')).every(x=>{
   const p=new URL(x.url).searchParams;
   return p.get('filter_license_by')==='false'&&
     p.get('filter_license_nc')==='false'&&p.get('filter_license_sa')==='false';
 }));
});
test('missing exact illustration uses named genus, not invented species',async()=>{
 const {api}=makeFixture();
 const art=await api.load(animal('Ursus arctos'));
 assert.equal(art?.exact,false);
 assert.equal(art?.name,'Ursus');
 assert.match(art?.message??'',/Обобщённый силуэт рода/);
});
test('unknown species leaves animal slot empty rather than fabricating',async()=>{
 const {api}=makeFixture();
 assert.equal(await api.load(animal('Lynx lynx')),null);
});
test('only scientific name is sent to PhyloPic and previous lookup is cached',async()=>{
 const {api,calls}=makeFixture();
 await api.load(animal('Panthera uncia'));
 const old=calls.length;
 await api.load(animal('Panthera uncia'));
 assert.equal(calls.length,old);
 assert.ok(calls.every(x=>!x.url.includes('Фрейзер')&&!x.url.includes('1875')));
});
