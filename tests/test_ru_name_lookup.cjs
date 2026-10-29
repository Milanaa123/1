'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','ru_name_lookup.js'),'utf8');
const win={},calls=[];
const responses={
 'Castor fiber':[{name:'Castor fiber',rank:'species',id:123,preferred_common_name:'Бобр обыкновенный'}],
 'Panthera uncia':[{name:'Panthera tigris',rank:'species',id:456,preferred_common_name:'Тигр'}],
 'Lutra lutra':[{name:'Lutra lutra',rank:'genus',id:987,preferred_common_name:'Выдра'}],
 'Vulpes vulpes':[{name:'Vulpes vulpes',rank:'species',id:411,preferred_common_name:'Red fox'}]
};
const fetch=async url=>{
 const taxon=new URL(url).searchParams.get('q');
 calls.push(taxon);
 assert.equal(new URL(url).searchParams.get('locale'),'ru');
 return {ok:true,json:async()=>({results:responses[taxon]||[]})};
};
vm.runInNewContext(src,{window:win,fetch,URL});
const api=win.AnimagiaRussianNames;
assert(api);
const row=(name,rank='species')=>[1,name,rank,'Mammalia','Carnivora','','Chordata','Castoridae','Бобровые',''];
(async()=>{
 assert.equal(await api.resolve(row('Castor fiber')),'Бобр обыкновенный');
 assert.equal(api.get(row('Castor fiber')),'Бобр обыкновенный');
 assert.equal(await api.resolve(row('Panthera uncia')),'','related species must be rejected');
 assert.equal(await api.resolve(row('Lutra lutra')),'','genus cannot supply species name');
 assert.equal(await api.resolve(row('Vulpes vulpes')),'','English name is not Russian');
 assert.equal(api.get([...row('Castor fiber').slice(0,9),'Бобр обыкновенный']),'Бобр обыкновенный');
 assert.equal(calls.filter(x=>x==='Castor fiber').length,1,'successful names must be cached');
 console.log('RUSSIAN_SPECIES_NAMES_EXACT_MATCH_VERIFIED');
})().catch(e=>{console.error(e);process.exitCode=1});
