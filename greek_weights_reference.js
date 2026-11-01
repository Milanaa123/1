'use strict';
/* A faithful five-column display of the user's complete methodical table.
 * All numerical values are taken from W, the calculator's sole GREEK
 * numerical map. English/Russian columns are source annotations, not
 * additional numeric or romanisation rules.
 *
 * Sho and San have no numeric values in the supplied methodical table.
 * A dash is intentionally NOT equivalent to zero.
 */
(()=>{
 const body=document.getElementById('greekMethodWeightsBody');
 if(!body)return;
 if(typeof W==='undefined'||typeof score!=='function'||
    typeof validGreek!=='function'){
  throw new Error('Greek calculator must load before the source reference table');
 }
 const rows=[
  // glyph, lowercase, name, expected Greek value, Latin hint, Russian hint
  ['Α','α','альфа',1,'A','а'],
  ['Β','β','бета',2,'B','б'],
  ['Γ','γ','гамма',3,'G','г'],
  ['Δ','δ','дельта',4,'D','д'],
  ['Ε','ε','эпсилон',5,'E','е'],
  ['Ϝ','ϝ','дигамма',6,'','в/ф'],
  ['Ϛ','ϛ','стигма',6,'','ст'],
  ['Ζ','ζ','дзета',7,'Z','дз'],
  ['Η','η','эта',8,'E','е'],
  ['Θ','θ','тета',9,'TH','т'],
  ['Ι','ι','йота',10,'I','и'],
  ['Κ','κ','каппа',20,'K','к'],
  ['Λ','λ','лямбда',30,'L','л'],
  ['Μ','μ','мю',40,'M','м'],
  ['Ν','ν','ню',50,'N','н'],
  ['Ξ','ξ','кси',60,'X','кс'],
  ['Ο','ο','омикрон',70,'O','о'],
  ['Π','π','пи',80,'P','п'],
  ['Ϙ','ϙ','коппа',90,'Q','к'],
  ['Ϟ','ϟ','коппа (числовая форма)',90,'Q','к'],
  ['Ρ','ρ','ро',100,'R','р'],
  ['Σ','σ','сигма',200,'S','с'],
  ['ς','ς','конечная сигма',200,'S','с'],
  ['Τ','τ','тау',300,'T','т'],
  ['Υ','υ','ипсилон',400,'U','умляут'],
  ['Φ','φ','фи',500,'PH','ф'],
  ['Χ','χ','хи',600,'CH','х'],
  ['Ψ','ψ','пси',700,'PS','пс'],
  ['Ω','ω','омега',800,'O','о'],
  ['Ϡ','ϡ','сампи',900,'[si], [ks], [ts]','сс'],
  ['Ϸ','ϸ','шо',null,'','ш'],
  // The source screenshot does not print a Greek glyph for San.
  ['','', 'сан',null,'','ц/с']
 ];
 const fragment=document.createDocumentFragment();
 for(const [upper,lower,label,expected,latin,russian] of rows){
  if(expected!==null){
   if(W[lower]!==expected||score(upper)!==expected||
      score(lower)!==expected||!validGreek(lower)){
    throw new Error('Greek methodological number mismatch for '+upper+' '+label);
   }
  }else if(lower && validGreek(lower)){
   throw new Error('No Greek numerical value is supplied for '+label);
  }
  const cells=[
   upper?(upper===lower?lower:upper+' '+lower):'—',
   label,
   expected===null?'—':String(W[lower]),
   latin||'—',
   russian
  ];
  const tr=document.createElement('tr');
  if(expected===null)tr.className='greek-method-unnumbered';
  for(const content of cells){
   const td=document.createElement('td');td.textContent=content;tr.append(td);
  }
  fragment.append(tr);
 }
 body.replaceChildren(fragment);
 if(score('ιετυ')!==715||score('ραβδι')!==117||score('φϟη')!==598||
    score('ς')!==200){
  throw new Error('Methodical control examples differ from the Greek scorer');
 }
})();
