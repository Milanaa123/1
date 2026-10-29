'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'..','ru_name_lookup.js'),'utf8');
const responses={
 'Castor fiber':[{name:'Castor fiber',rank:'species',id:10,preferred_common_name:'Бобр обыкновенный'}],
 'Panthera uncia':[{name:'Panthera tigris',rank:'species',id:12,preferred_common_name:'Тигр'}],
 'Lutra lutra':[{name:'Lutra lutra',rank:'genus',id:13,preferred_common_name:'Выдра'}],
 'Vulpes vulpes':[{name:'Vulpes vulpes',rank:'species',id:14,preferred_common_name:'Red fox'}],
 'Ursus arctos':[],
 'Lynx lynx':[],
 'Canis aureus':[]
};
const gbif={
 'Ursus arctos':{matchType:'EXACT',status:'ACCEPTED',rank:'SPECIES',canonicalName:'Ursus arctos',kingdom:'Animalia',
 phylum:'Chordata',class:'Mammalia',order:'Carnivora',family:'Ursidae',usageKey:111},
 'Lynx lynx':{matchType:'FUZZY',status:'ACCEPTED',rank:'SPECIES',canonicalName:'Lynx lynx',kingdom:'Animalia',
 phylum:'Chordata',class:'Mammalia',order:'Carnivora',family:'Felidae',usageKey:112},
 'Canis aureus':{matchType:'EXACT',status:'ACCEPTED',rank:'SPECIES',canonicalName:'Canis aureus',kingdom:'Animalia',
 phylum:'Chordata',class:'Mammalia',order:'Carnivora',family:'Canidae',usageKey:113}
};
const calls=[];
const fetch=async url=>{
 const u=new URL(url);calls.push(url);
 if(u.hostname==='api.inaturalist.org'){
  assert.equal(u.searchParams.get('locale'),'ru');
  return {ok:true,json:async()=>({results:responses[u.searchParams.get('q')]||[]})};
 }
 if(u.pathname.endsWith('/match')){
  return {ok:true,json:async()=>gbif[u.searchParams.get('name')]||{}};
 }
 const key=u.pathname.split('/')[3];
 if(key==='111')return {ok:true,json:async()=>({results:[
  {language:'rus',vernacularName:'Бурый медведь',preferred:true}
 ]})};
 if(key==='113')return {ok:true,json:async()=>({results:[
  {language:'rus',vernacularName:'Обыкновенный шакал'},
  {language:'rus',vernacularName:'Золотистый шакал'}
 ]})};
 throw Error('Unexpected url '+url);
};
const root={};vm.runInNewContext(script,{window:root,fetch,URL});
const api=root.AnimagiaRussianNames;
const row=(name,family='Canidae')=>[1,name,'species','Mammalia','Carnivora','','Chordata',family,'',''];
(async()=>{
 assert.equal(await api.resolve(row('Castor fiber','Castoridae')),'Бобр обыкновенный');
 assert.equal(api.sourceFor(row('Castor fiber','Castoridae')),'iNaturalist');
 assert.equal(await api.resolve(row('Panthera uncia','Felidae')),'');
 assert.equal(await api.resolve(row('Lutra lutra','Mustelidae')),'');
 assert.equal(await api.resolve(row('Vulpes vulpes')),'');
 assert.equal(await api.resolve(row('Ursus arctos','Ursidae')),'Бурый медведь');
 assert.equal(api.sourceFor(row('Ursus arctos','Ursidae')),'GBIF');
 assert.equal(await api.resolve(row('Lynx lynx','Felidae')),'','GBIF fuzzy match rejected');
 assert.equal(await api.resolve(row('Canis aureus')),'','ambiguous real names require review');
 const original=[...row('Ursus arctos','Ursidae').slice(0,9),'Бурый медведь'];
 assert.equal(api.get(original),'Бурый медведь');
 assert.equal(api.get(row('Ursus arctos','Ursidae')),'Бурый медведь');
 const prior=calls.length;
 assert.equal(await api.resolve(row('Ursus arctos','Ursidae')),'Бурый медведь');
 assert.equal(calls.length,prior,'verified positive names cached');
 console.log('RUSSIAN_NAMES_TWO_SOURCES_STRICT_ACCEPTED_TESTS_PASSED');
})().catch(err=>{console.error(err);process.exitCode=1});
