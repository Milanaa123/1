'use strict';
/* Ancient-alphabet v2: deterministic transcription, NOT a lexical translation.
   v and w use archaic digamma /w/ as an approximation, never Ancient beta /b/.
   Keep exact parity with greek_taxa.py; any revision requires full reindex. */
const GREEK_TAXON_RULE_VERSION = 'taxon-ancient-alphabet-v2';
const GREEK_TAXON_DIGRAPHS = {
 ph:'φ',th:'θ',ch:'χ',ps:'ψ',rh:'ρ',ae:'αι',oe:'οι',au:'αυ',
 eu:'ευ',ei:'ει',ai:'αι',ou:'ου'
};
const GREEK_TAXON_SINGLE = {
 a:'α',b:'β',c:'κ',d:'δ',e:'ε',f:'φ',g:'γ',h:'χ',
 i:'ι',j:'ι',k:'κ',l:'λ',m:'μ',n:'ν',o:'ο',
 p:'π',q:'κ',r:'ρ',s:'σ',t:'τ',u:'ου',
 v:'ϝ',w:'ϝ',x:'ξ',y:'υ',z:'ζ'
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
