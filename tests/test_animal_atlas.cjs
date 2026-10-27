'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const window={};
const context=vm.createContext({window,Image:class{
 constructor(){this.naturalWidth=1536;this.naturalHeight=1024;}
 set src(_){if(this.onload)this.onload();}
},document:{
 createElement(tag){
  if(tag==='canvas'){
   const canvas={tag,width:307,height:256,attrs:{},className:'',
    setAttribute(k,v){this.attrs[k]=v},
    getContext(){
     return {save(){},restore(){},drawImage(){},putImageData(){},
      scale(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},
      bezierCurveTo(){},quadraticCurveTo(){},ellipse(){},arc(){},
      fill(){},stroke(){},
      getImageData(){
       const data=new Uint8ClampedArray(canvas.width*canvas.height*4);
       for(let i=0;i<data.length;i+=4){
        data[i]=232;data[i+1]=191;data[i+2]=116;data[i+3]=255;
       }
       return {data};
      }
     };
    }
   };
   return canvas;
  }
  return {tag,className:'',attrs:{},style:{},setAttribute(k,v){this.attrs[k]=v}};
 }
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
test('transparent watercolor-style ink is isolated on same-origin Canvas',()=>{
 const art=atlas.resolve(row('Canis lupus'));
 assert.equal(art.cell,0);
 assert.ok(atlas.imageUrl.includes('./art/animals-gold-v1.png'));
 const node={children:[],replaceChildren(...x){this.children=x},
  append(...x){this.children.push(...x)},contains(x){return this.children.includes(x)}};
 atlas.render(node,art);
 assert.equal(node.children.length,1);
 assert.equal(node.children[0].tag,'canvas');
 const part=atlas.resolve(row('Rana temporaria'));
 assert.equal(part.cell,18);
 assert.equal(part.habitat,'semiaquatic');
 const calls=[];
 const ctx={save(){},drawImage(...args){calls.push(args)},restore(){}};
 const image={naturalWidth:1536,naturalHeight:1024};
 atlas.drawCanvas(ctx,image,part,0,0,300,250);
 assert.equal(calls.length,1);
 assert.equal(calls[0][0].tag,'canvas');
 assert.ok(calls[0][3]>290&&calls[0][3]<=300,'frog image width must fit the card');
 assert.ok(calls[0][4]>240&&calls[0][4]<=250,'frog image height must fit the card');
 assert.ok(Math.abs(calls[0][3]/calls[0][4]-307/256)<.005,
  'frog must preserve original source proportions, never stretch the muzzle');
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
 const beaver=[999,'Castor fiber','species','Mammalia','Rodentia','','Chordata'];
 assert.equal(atlas.style(atlas.classify(beaver)).diet,'herbivore');
 assert.equal(atlas.style(atlas.classify(beaver)).habitat,'semiaquatic');
 const panda=[999,'Ailuropoda melanoleuca','species','Mammalia','Carnivora','','Chordata'];
 assert.equal(atlas.style(atlas.classify(panda)).diet,'herbivore');
});
test('screenshot examples: real frog illustration and correct frog/spider diet',()=>{
 const frog=[1878,'Cornufer opisthodon','species','Amphibia','Anura','','Chordata'];
 const art=atlas.resolve(frog);
 assert.equal(art.id,'frog');
 assert.equal(art.exact,false);
 assert.equal(atlas.style(atlas.classify(frog)).diet,'predator');
 // Verified source-based exception for stream-associated Faro webbed frog.
 assert.equal(atlas.style(atlas.classify(frog)).habitat,'semiaquatic');
 const alpine=[1878,'Microkayla wettsteini','species','Amphibia','Anura','','Chordata'];
 assert.equal(atlas.style(atlas.classify(alpine)).habitat,'terrestrial');
 const spider=[1878,'Bowie sagittatus','species','Arachnida','Araneae','','Arthropoda'];
 assert.equal(atlas.style(atlas.classify(spider)).diet,'predator');
 assert.equal(atlas.style(atlas.classify(spider)).habitat,'unknown');
});
test('art atlas has no local storage, personal-data uploads or numeric changes',()=>{
 const src=fs.readFileSync('animal_atlas.js','utf8');
 for(const forbidden of ['localStorage','sessionStorage','sendBeacon','score(','taxonGreekScore('])
  assert.ok(!src.includes(forbidden),forbidden);
});

test('Stage 4: source frog face retains full muzzle and drawn nostril',()=>{
 const source=fs.readFileSync('animal_atlas.js','utf8');
 const start=source.indexOf('if(index===18){'),end=source.indexOf('const [cx,cy,rx,ry]',start);
 const cut=source.slice(start,end);
 assert.ok(cut.includes('[212,29]')&&cut.includes('[225,34]'),'tight mask protects muzzle and excludes background orbit');
 assert.ok(source.includes('ctx.ellipse(219.5,43,2.35,1.6'));
 assert.ok(source.includes("if(profile.id==='frog')"));
 assert.ok(source.includes('Math.min(w/cutout.width,h/cutout.height)'));
 assert.ok(!source.includes('localStorage')&&!source.includes('sessionStorage'));
});
