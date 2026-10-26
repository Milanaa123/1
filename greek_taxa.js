'use strict';
/* Approved PROJECT taxon transliteration v3, NOT a lexical Greek translation.
   Mirrors the fixed earlier Greek scheme (b->μπ, d->ντ, g->γκ,
   j->τζ, v->β, w->ου). Must match greek_taxa.py exactly. */
const GREEK_TAXON_RULE_VERSION = 'taxon-project-transcription-v3';
const GREEK_TAXON_DIGRAPHS = {
 ph:'φ',th:'θ',ch:'χ',ps:'ψ',rh:'ρ'
};
const GREEK_TAXON_SINGLE = {
 a:'α',b:'μπ',c:'κ',d:'ντ',e:'ε',f:'φ',g:'γκ',h:'χ',
 i:'ι',j:'τζ',k:'κ',l:'λ',m:'μ',n:'ν',o:'ο',
 p:'π',q:'κ',r:'ρ',s:'σ',t:'τ',u:'ου',
 v:'β',w:'ου',x:'ξ',y:'υ',z:'ζ'
};
const GREEK_TAXON_REGEX = /^[A-Za-z]+(?:-[A-Za-z]+)*(?: [A-Za-z]+(?:-[A-Za-z]+)*)+$/;
function taxonGreek(scientific) {
 if(!GREEK_TAXON_REGEX.test(scientific))throw Error('Неподдерживаемое научное название: '+scientific);
 return scientific.toLowerCase().split(' ').map(word=>{
  let result='',i=0;
  while(i<word.length){
   if(word[i]==='-'){result+='-';i++;continue;}
   const two=word.slice(i,i+2);
   if(Object.prototype.hasOwnProperty.call(GREEK_TAXON_DIGRAPHS,two)){
    result+=GREEK_TAXON_DIGRAPHS[two];i+=2;
   }else{
    const one=GREEK_TAXON_SINGLE[word[i]];
    if(!one)throw Error('Неизвестный символ научного названия');
    result+=one;i++;
   }
  }
  return result.replace(/σ(?=$|-)/g,'ς');
 }).join(' ');
}
function taxonGreekScore(scientific){
 const greek=taxonGreek(scientific);
 // score() comes from app.js and uses exactly the historical Greek values.
 return score(greek);
}
