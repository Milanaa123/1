'use strict';
/* Original Greek letter/value table from the Transfiguration methodical text.
   These are GREEK numerals; Latin text is only the editable spelling of a name.
   The numeric source of truth is the same W used by the calculator.
 */
(()=>{
 const body=document.getElementById('greekMethodWeightsBody');
 if(!body)return;
 if(typeof W==='undefined'||typeof score!=='function'){
  throw new Error('Greek numeral calculator must load before its reference table');
 }
 const rows=[
  ['Α','α','альфа',1],
  ['Β','β','бета',2],
  ['Γ','γ','гамма',3],
  ['Δ','δ','дельта',4],
  ['Ε','ε','эпсилон',5],
  ['Ϝ','ϝ','дигамма',6],
  ['Ϛ','ϛ','стигма',6],
  ['Ζ','ζ','дзета',7],
  ['Η','η','эта',8],
  ['Θ','θ','тета',9],
  ['Ι','ι','йота',10],
  ['Κ','κ','каппа',20],
  ['Λ','λ','лямбда',30],
  ['Μ','μ','мю',40],
  ['Ν','ν','ню',50],
  ['Ξ','ξ','кси',60],
  ['Ο','ο','омикрон',70],
  ['Π','π','пи',80],
  ['Ϙ','ϙ','коппа',90],
  ['Ϟ','ϟ','коппа (числовая форма)',90],
  ['Ρ','ρ','ро',100],
  ['Σ','σ','сигма',200],
  ['ς','ς','сигма в конце слова',200],
  ['Τ','τ','тау',300],
  ['Υ','υ','ипсилон',400],
  ['Φ','φ','фи',500],
  ['Χ','χ','хи',600],
  ['Ψ','ψ','пси',700],
  ['Ω','ω','омега',800],
  ['Ϡ','ϡ','сампи',900]
 ];
 const fragment=document.createDocumentFragment();
 for(const [upper,lower,label,expected] of rows){
  const actual=W[lower];
  if(actual!==expected||score(upper)!==expected){
   throw new Error('Greek methodical numeral mismatch: '+upper+' '+actual+' vs '+expected);
  }
  const tr=document.createElement('tr');
  const letter=document.createElement('td');
  letter.textContent=upper===lower?lower:upper+' '+lower;
  const name=document.createElement('td');name.textContent=label;
  const value=document.createElement('td');value.textContent=String(actual);
  tr.append(letter,name,value);
  fragment.append(tr);
 }
 body.replaceChildren(fragment);
 if(score('ιετυ')!==715||score('ραβδι')!==117||score('φϟη')!==598){
  throw new Error('Methodical numerical control examples differ from Greek scoring');
 }
})();
