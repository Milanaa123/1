'use strict';
/* A picture of a related taxon is NOT a drawing of the calculated species.
 * Only source taxa documented by the frozen Catalogue of Life are reusable,
 * and only inside the same genus, family, or order. No invented taxonomy.
 */
(()=>{
 const previous=window.AnimagiaAnimalAtlas;
 const index=window.AnimagiaRepresentativeIndex;
 if(!previous||!index||index.version!==1)return;
 const byGenus=index.genus||{};
 const byFamily=index.family||{};
 const byOrder=index.order||{};
 const labels={
  genus:'того же рода',
  family:'того же семейства',
  order:'того же отряда'
 };
 function resolve(row){
  const direct=previous.resolve(row);
  if(!Array.isArray(row)||!['species','subspecies'].includes(row[2])||
     typeof row[1]!=='string')return direct;
  // Exact portraits, artwork already reused within an explicitly approved
  // genus, and historical same-species reconstructions take precedence.
  if(direct?.exact===true || direct?.file && direct.file!=='additional/Лягушка.png'){
   return direct;
  }
  const cls=row[3],ord=row[4],fam=row[7];
  if(typeof cls!=='string'||!cls||typeof ord!=='string'||!ord)return direct;
  const genus=row[1].split(' ')[0];
  let level=null,source=null;
  if(typeof fam==='string'&&fam){
   const genusKey=[cls,ord,fam,genus].join('|');
   const familyKey=[cls,ord,fam].join('|');
   if(Object.hasOwn(byGenus,genusKey)){level='genus';source=byGenus[genusKey]}
   else if(Object.hasOwn(byFamily,familyKey)){level='family';source=byFamily[familyKey]}
  }
  if(!source){
   const orderKey=[cls,ord].join('|');
   if(Object.hasOwn(byOrder,orderKey)){level='order';source=byOrder[orderKey]}
  }
  if(!source)return direct;
  const [file,sourceScientific,sourceLabel]=source;
  if(typeof file!=='string'||!file.startsWith('animals/')&&!file.startsWith('additional/')&&!file.startsWith('new/')||
     typeof sourceScientific!=='string'||!sourceScientific)return direct;
  // The user selected row[1], not sourceScientific. The preview must never
  // suggest that the representative image depicts that exact species.
  const note='Рисунок другого вида '+labels[level]+': '+sourceScientific+
   '. Это НЕ изображение вида '+row[1]+'.';
  return Object.freeze({
   artSet:'original107',file,scientific:row[1],name:sourceLabel||sourceScientific,
   exact:false,representativeLevel:level,
   sourceScientific,note
  });
 }
 window.AnimagiaAnimalAtlas=Object.freeze({
  ...previous,resolve,
  representativeLevels:Object.freeze(Object.keys(labels))
 });
})();
