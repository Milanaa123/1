'use strict';
/* Only approved original 107 PNGs may appear in search result cards.
   Override the historical third-party photo fetcher before any search runs.
 */
loadPhotos=function(){
 while(queue.length){
  const item=queue.shift();
  if(item.stamp!==photoStamp)continue;
  const p=window.AnimagiaAnimalAtlas?.resolve(item.row);
  if(!p||p.artSet!=='original107'){
   item.credit.textContent='Рисунок пока не готов';
   continue;
  }
  const image=document.createElement('img');
  image.src='./art/animagia-original-400/'+p.file.split('/').map(encodeURIComponent).join('/');
  image.alt=p.exact===true?'Рисунок вида '+p.scientific:
   'Художественный рисунок '+(p.sourceScientific||p.name)+' (не изображение вида '+item.row[1]+')';
  image.loading='lazy';
  image.decoding='async';
  image.style.objectFit='contain';
  image.onerror=()=>{image.remove();item.credit.textContent='Рисунок недоступен';};
  item.media.append(image);
  item.credit.textContent=p.exact===true?'Оригинальный рисунок этого вида':
   'Иллюстрация другого вида/общий образ: '+(p.sourceScientific||p.name);
 }
};
