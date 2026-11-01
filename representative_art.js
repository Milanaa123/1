'use strict';
/* Visual group fallback for ALL catalogue species and subspecies.
 * Priority: original species > original genus > verified genus > verified
 * family > verified order > verified class. Every group source must have
 * its own SHA-audited 400-original-PNG record and documented CoL taxonomy.
 * This drawing is NEVER advertised as the portrait of another species.
 */
(()=>{
 const previous=window.AnimagiaAnimalAtlas;
 const index=window.AnimagiaRepresentativeIndex;
 if(!previous||!index||index.version!==2)return;
 const byGenus=index.genus||{};
 const byFamily=index.family||{};
 const byOrder=index.order||{};
 const byGenusClass=index.genusClass||{};
 const byFamilyClass=index.familyClass||{};
 const byClass=index['class']||{};
 const labels={
  genus:'того же рода',
  family:'того же семейства',
  order:'того же отряда',
  class:'того же класса (общий образ группы)'
 };
 function resolve(row){
  const direct=previous.resolve(row);
  if(!Array.isArray(row)||!['species','subspecies'].includes(row[2])||
     typeof row[1]!=='string')return direct;
  // An actual original species drawing (or a reviewed genus image) wins.
  if(direct?.exact===true || (direct?.file && direct.file!=='additional/Лягушка.png')){
   return direct;
  }
  // The user's generic transparent frog is deliberately the preferred
  // artwork for all Anura, rather than any unrelated amphibian illustration.
  if(row[3]==='Amphibia'&&row[4]==='Anura'&&direct?.file==='additional/Лягушка.png'){
   return Object.freeze({
    ...direct,exact:false,representativeLevel:'order',
    sourceScientific:'',
    note:'Обобщённый золотой рисунок лягушки для отряда бесхвостых. '+
         'Это НЕ анатомический рисунок вида '+row[1]+'.'
   });
  }
  const cls=row[3],ord=row[4],fam=row[7];
  if(typeof cls!=='string'||!cls)return direct;
  const genus=row[1].split(' ')[0];
  let level=null,source=null;
  if(typeof fam==='string'&&fam){
   const genusKey=[cls,ord,fam,genus].join('|');
   const familyKey=[cls,ord,fam].join('|');
   const genusByClassKey=[cls,fam,genus].join('|');
   const familyByClassKey=[cls,fam].join('|');
   if(ord&&Object.hasOwn(byGenus,genusKey)){
    level='genus';source=byGenus[genusKey];
   }else if(Object.hasOwn(byGenusClass,genusByClassKey)){
    level='genus';source=byGenusClass[genusByClassKey];
   }else if(ord&&Object.hasOwn(byFamily,familyKey)){
    level='family';source=byFamily[familyKey];
   }else if(Object.hasOwn(byFamilyClass,familyByClassKey)){
    level='family';source=byFamilyClass[familyByClassKey];
   }
  }
  if(!source&&typeof ord==='string'&&ord){
   const orderKey=[cls,ord].join('|');
   if(Object.hasOwn(byOrder,orderKey)){level='order';source=byOrder[orderKey]}
  }
  if(!source&&Object.hasOwn(byClass,cls)){
   level='class';source=byClass[cls];
  }
  if(!source)return direct;
  const [file,sourceScientific,sourceLabel]=source;
  if(typeof file!=='string'||
      !(file.startsWith('animals/')||file.startsWith('additional/')||file.startsWith('new/'))||
      typeof sourceScientific!=='string'||!sourceScientific)return direct;
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
