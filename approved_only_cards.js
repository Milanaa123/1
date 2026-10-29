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
  image.src='./art/animagia-selected-107/'+p.file.split('/').map(encodeURIComponent).join('/');
  image.alt='Золотой рисунок '+p.name;
  image.loading='lazy';
  image.decoding='async';
  image.style.objectFit='contain';
  image.onerror=()=>{image.remove();item.credit.textContent='Рисунок недоступен';};
  item.media.append(image);
  item.credit.textContent='Оригинальный проверенный PNG';
 }
};
