'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const window={};
const context=vm.createContext({window,document:{
 createElement(tag){return {tag,className:'',attrs:{},style:{},setAttribute(k,v){this.attrs[k]=v}}},
}});
vm.runInContext(fs.readFileSync('animal_atlas.js','utf8'),context,{filename:'animal_atlas.js'});
const atlas=window.AnimagiaAnimalAtlas;
const row=name=>[123,name,'species','Mammalia','Carnivora','','Chordata'];
test('all 20 positions unique and readable',()=>{
 assert.equal(atlas.list.length,20);
 assert.equal(new Set(atlas.list.map(x=>x.cell)).size,20);
 assert.equal(atlas.list[0].name,'Волк');
 assert.equal(atlas.list[19].name,'Ночная бабочка');
});
test('real species or genus art, never inaccurate Panthera-wide tiger-as-snow-leopard',()=>{
 assert.equal(atlas.resolve(row('Canis lupus')).id,'wolf');
 assert.equal(atlas.resolve(row('Panthera uncia')).id,'snow-leopard');
 assert.equal(atlas.resolve(row('Naja naja')).id,'cobra');
 assert.equal(atlas.resolve(row('Draco volans')).id,'flying-lizard');
 assert.equal(atlas.resolve(row('Panthera tigris')),null);
 assert.equal(atlas.resolve(row('Elephas maximus')),null);
});
test('diet and environment independent, including arboreal and subterranean',()=>{
 const wolf=atlas.style(atlas.resolve(row('Canis lupus')));
 assert.equal(wolf.diet,'predator');
 assert.equal(wolf.habitat,'terrestrial');
 const rabbit=atlas.style(atlas.resolve(row('Oryctolagus cuniculus')));
 assert.equal(rabbit.diet,'herbivore');
 assert.equal(rabbit.habitat,'subterranean');
 const flying=atlas.style(atlas.resolve(row('Draco volans')));
 assert.equal(flying.habitat,'arboreal');
 assert.equal(flying.diet,'predator');
 const fox=atlas.style(atlas.resolve(row('Vulpes vulpes')));
 assert.equal(fox.diet,'omnivore');
 assert.deepEqual(Array.from(fox.secondaryText),['Подземное']);
});
test('unknown species not assigned ungrounded diet or habitat',()=>{
 const alien=atlas.style(atlas.resolve(row('Unknown animal')));
 assert.equal(alien.diet,'unknown');
 assert.equal(alien.habitat,'unknown');
 assert.equal(atlas.style(atlas.resolve(row('Ursus thibetanus'))).diet,'unknown');
});
test('sprite uses one uploaded sheet and exact cropped coordinates',()=>{
 const art=atlas.resolve(row('Canis lupus'));
 const node={children:[],replaceChildren(...x){this.children=x}};
 atlas.render(node,art);
 assert.equal(node.children.length,1);
 assert.match(node.children[0].style.backgroundImage,/9617c2f3/);
 assert.equal(node.children[0].style.backgroundPosition,'0% 0%');
 const part=atlas.resolve(row('Rana temporaria'));
 assert.equal(part.cell,18);
 assert.equal(part.habitat,'semiaquatic');
 const calls=[];const ctx={save(){},drawImage(...args){calls.push(args)},restore(){}};
 const image={naturalWidth:1536,naturalHeight:1024};
 atlas.drawCanvas(ctx,image,part,0,0,300,250);
 assert.equal(calls[0][1],3*(1536/5));
 assert.equal(calls[0][2],3*(1024/4));
 assert.equal(calls[0][3],1536/5);
 assert.equal(calls[0][4],1024/4);
});
test('aquatic, arboreal and subterranean tags work without any matching illustration',()=>{
 const fish=[999,'Hippocampus hippocampus','species','Actinopterygii','Syngnathiformes','','Chordata'];
 assert.equal(atlas.resolve(fish),null);
 assert.equal(atlas.style(atlas.classify(fish)).habitat,'aquatic');
 assert.equal(atlas.style(atlas.classify(fish)).diet,'predator');
 const ocean=[999,'Unknown fish','species','Chondrichthyes','Unknown','','Chordata'];
 assert.equal(atlas.style(atlas.classify(ocean)).habitat,'aquatic');
 assert.equal(atlas.style(atlas.classify(ocean)).diet,'unknown');
 const mole=[999,'Talpa europaea','species','Mammalia','Eulipotyphla','','Chordata'];
 assert.equal(atlas.resolve(mole),null);
 assert.equal(atlas.style(atlas.classify(mole)).habitat,'subterranean');
 const squirrel=[999,'Sciurus vulgaris','species','Mammalia','Rodentia','','Chordata'];
 assert.equal(atlas.style(atlas.classify(squirrel)).habitat,'arboreal');
 assert.equal(atlas.style(atlas.classify(squirrel)).diet,'unknown');
 const panda=[999,'Ailuropoda melanoleuca','species','Mammalia','Carnivora','','Chordata'];
 assert.equal(atlas.style(atlas.classify(panda)).diet,'herbivore');
});
test('art atlas has no local storage, personal-data uploads or numeric changes',()=>{
 const src=fs.readFileSync('animal_atlas.js','utf8');
 for(const forbidden of ['localStorage','sessionStorage','sendBeacon','score(','taxonGreekScore('])
  assert.ok(!src.includes(forbidden),forbidden);
});
