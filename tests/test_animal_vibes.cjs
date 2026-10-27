'use strict';
/* 100 illustrated reference subjects approved by owner, in screenshot order.
 This QA file tests decorative frame grouping only. It does not invent new
 ecological facts and does NOT mean 100 pictures are already in the atlas.
 The Pegasus test is decorative-only, not a claim of a real zoological taxon. */
const fs=require('node:fs'),test=require('node:test'),assert=require('node:assert/strict');
const source=fs.readFileSync('relic_features.js','utf8');
const begin=source.indexOf(' function cardAdornment('),end=source.indexOf(' // All bites/cuts',begin);
assert.ok(begin>0&&end>begin);
const {cardAdornment}=new Function(source.slice(begin,end)+'\nreturn {cardAdornment};')();
const ROSTER=[
 [
  "Волк",
  "Canis lupus",
  "Mammalia",
  "Carnivora",
  "predator",
  "terrestrial",
  "predator"
 ],
 [
  "Лиса",
  "Vulpes vulpes",
  "Mammalia",
  "Carnivora",
  "omnivore",
  "terrestrial",
  "omnivore"
 ],
 [
  "Собака",
  "Canis lupus familiaris",
  "Mammalia",
  "Carnivora",
  "unknown",
  "terrestrial",
  "predator"
 ],
 [
  "Кошка",
  "Felis catus",
  "Mammalia",
  "Carnivora",
  "predator",
  "terrestrial",
  "predator"
 ],
 [
  "Лев",
  "Panthera leo",
  "Mammalia",
  "Carnivora",
  "unknown",
  "terrestrial",
  "predator"
 ],
 [
  "Тигр",
  "Panthera tigris",
  "Mammalia",
  "Carnivora",
  "unknown",
  "terrestrial",
  "predator"
 ],
 [
  "Снежный барс",
  "Panthera uncia",
  "Mammalia",
  "Carnivora",
  "predator",
  "terrestrial",
  "predator"
 ],
 [
  "Гепард",
  "Acinonyx jubatus",
  "Mammalia",
  "Carnivora",
  "unknown",
  "terrestrial",
  "predator"
 ],
 [
  "Ягуар",
  "Panthera onca",
  "Mammalia",
  "Carnivora",
  "unknown",
  "terrestrial",
  "predator"
 ],
 [
  "Пума",
  "Puma concolor",
  "Mammalia",
  "Carnivora",
  "unknown",
  "terrestrial",
  "predator"
 ],
 [
  "Медведь",
  "Ursus arctos",
  "Mammalia",
  "Carnivora",
  "unknown",
  "terrestrial",
  "omnivore"
 ],
 [
  "Панда",
  "Ailuropoda melanoleuca",
  "Mammalia",
  "Carnivora",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Енот",
  "Procyon lotor",
  "Mammalia",
  "Carnivora",
  "unknown",
  "terrestrial",
  "omnivore"
 ],
 [
  "Выдра",
  "Lutra lutra",
  "Mammalia",
  "Carnivora",
  "predator",
  "semiaquatic",
  "aquatic"
 ],
 [
  "Норка",
  "Mustela lutreola",
  "Mammalia",
  "Carnivora",
  "unknown",
  "semiaquatic",
  "aquatic"
 ],
 [
  "Барсук",
  "Meles meles",
  "Mammalia",
  "Carnivora",
  "unknown",
  "terrestrial",
  "omnivore"
 ],
 [
  "Росомаха",
  "Gulo gulo",
  "Mammalia",
  "Carnivora",
  "unknown",
  "terrestrial",
  "predator"
 ],
 [
  "Оцелот",
  "Leopardus pardalis",
  "Mammalia",
  "Carnivora",
  "unknown",
  "terrestrial",
  "predator"
 ],
 [
  "Рысь",
  "Lynx lynx",
  "Mammalia",
  "Carnivora",
  "unknown",
  "terrestrial",
  "predator"
 ],
 [
  "Каракал",
  "Caracal caracal",
  "Mammalia",
  "Carnivora",
  "unknown",
  "terrestrial",
  "predator"
 ],
 [
  "Сова",
  "Strix aluco",
  "Aves",
  "Strigiformes",
  "predator",
  "aerial",
  "avian"
 ],
 [
  "Филин",
  "Bubo bubo",
  "Aves",
  "Strigiformes",
  "predator",
  "aerial",
  "avian"
 ],
 [
  "Ворон",
  "Corvus corax",
  "Aves",
  "Passeriformes",
  "omnivore",
  "aerial",
  "avian"
 ],
 [
  "Ворона",
  "Corvus cornix",
  "Aves",
  "Passeriformes",
  "omnivore",
  "aerial",
  "avian"
 ],
 [
  "Сокол",
  "Falco peregrinus",
  "Aves",
  "Falconiformes",
  "predator",
  "aerial",
  "avian"
 ],
 [
  "Ястреб",
  "Accipiter gentilis",
  "Aves",
  "Accipitriformes",
  "predator",
  "aerial",
  "avian"
 ],
 [
  "Орёл",
  "Aquila chrysaetos",
  "Aves",
  "Accipitriformes",
  "predator",
  "aerial",
  "avian"
 ],
 [
  "Стервятник",
  "Gyps fulvus",
  "Aves",
  "Accipitriformes",
  "predator",
  "aerial",
  "avian"
 ],
 [
  "Чайка",
  "Larus argentatus",
  "Aves",
  "Charadriiformes",
  "omnivore",
  "aerial",
  "avian"
 ],
 [
  "Колибри",
  "Archilochus colubris",
  "Aves",
  "Apodiformes",
  "unknown",
  "aerial",
  "avian"
 ],
 [
  "Олень",
  "Cervus elaphus",
  "Mammalia",
  "Artiodactyla",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Лось",
  "Alces alces",
  "Mammalia",
  "Artiodactyla",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Косуля",
  "Capreolus capreolus",
  "Mammalia",
  "Artiodactyla",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Северный олень",
  "Rangifer tarandus",
  "Mammalia",
  "Artiodactyla",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Кабан",
  "Sus scrofa",
  "Mammalia",
  "Artiodactyla",
  "omnivore",
  "terrestrial",
  "omnivore"
 ],
 [
  "Бизон",
  "Bison bison",
  "Mammalia",
  "Artiodactyla",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Зубр",
  "Bison bonasus",
  "Mammalia",
  "Artiodactyla",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Баран",
  "Ovis aries",
  "Mammalia",
  "Artiodactyla",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Козёл",
  "Capra hircus",
  "Mammalia",
  "Artiodactyla",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Серна",
  "Rupicapra rupicapra",
  "Mammalia",
  "Artiodactyla",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Лошадь",
  "Equus caballus",
  "Mammalia",
  "Perissodactyla",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Пегас (декоративный образ)",
  "Equus pegasi",
  "Mammalia",
  "Perissodactyla",
  "unknown",
  "terrestrial",
  "herbivore"
 ],
 [
  "Осел",
  "Equus asinus",
  "Mammalia",
  "Perissodactyla",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Зебра",
  "Equus quagga",
  "Mammalia",
  "Perissodactyla",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Жираф",
  "Giraffa camelopardalis",
  "Mammalia",
  "Artiodactyla",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Антилопа",
  "Antilope cervicapra",
  "Mammalia",
  "Artiodactyla",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Газель",
  "Gazella gazella",
  "Mammalia",
  "Artiodactyla",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Верблюд",
  "Camelus dromedarius",
  "Mammalia",
  "Artiodactyla",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Лама",
  "Lama glama",
  "Mammalia",
  "Artiodactyla",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Альпака",
  "Vicugna pacos",
  "Mammalia",
  "Artiodactyla",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Кролик",
  "Oryctolagus cuniculus",
  "Mammalia",
  "Lagomorpha",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Заяц",
  "Lepus europaeus",
  "Mammalia",
  "Lagomorpha",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Белка",
  "Sciurus vulgaris",
  "Mammalia",
  "Rodentia",
  "unknown",
  "arboreal",
  "omnivore"
 ],
 [
  "Бобр",
  "Castor fiber",
  "Mammalia",
  "Rodentia",
  "herbivore",
  "semiaquatic",
  "aquatic"
 ],
 [
  "Хомяк",
  "Cricetus cricetus",
  "Mammalia",
  "Rodentia",
  "unknown",
  "terrestrial",
  "omnivore"
 ],
 [
  "Мышь",
  "Mus musculus",
  "Mammalia",
  "Rodentia",
  "unknown",
  "terrestrial",
  "omnivore"
 ],
 [
  "Крыса",
  "Rattus norvegicus",
  "Mammalia",
  "Rodentia",
  "unknown",
  "terrestrial",
  "omnivore"
 ],
 [
  "Дикобраз",
  "Hystrix cristata",
  "Mammalia",
  "Rodentia",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Суслик",
  "Spermophilus citellus",
  "Mammalia",
  "Rodentia",
  "unknown",
  "terrestrial",
  "omnivore"
 ],
 [
  "Сурок",
  "Marmota marmota",
  "Mammalia",
  "Rodentia",
  "unknown",
  "terrestrial",
  "herbivore"
 ],
 [
  "Кенгуру",
  "Macropus rufus",
  "Mammalia",
  "Diprotodontia",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Коала",
  "Phascolarctos cinereus",
  "Mammalia",
  "Diprotodontia",
  "herbivore",
  "arboreal",
  "herbivore"
 ],
 [
  "Вомбат",
  "Vombatus ursinus",
  "Mammalia",
  "Diprotodontia",
  "herbivore",
  "terrestrial",
  "herbivore"
 ],
 [
  "Динго",
  "Canis lupus dingo",
  "Mammalia",
  "Carnivora",
  "unknown",
  "terrestrial",
  "predator"
 ],
 [
  "Тасманский дьявол",
  "Sarcophilus harrisii",
  "Mammalia",
  "Dasyuromorphia",
  "unknown",
  "terrestrial",
  "predator"
 ],
 [
  "Эму",
  "Dromaius novaehollandiae",
  "Aves",
  "Casuariiformes",
  "omnivore",
  "terrestrial",
  "avian"
 ],
 [
  "Страус",
  "Struthio camelus",
  "Aves",
  "Struthioniformes",
  "omnivore",
  "terrestrial",
  "avian"
 ],
 [
  "Казуар",
  "Casuarius casuarius",
  "Aves",
  "Casuariiformes",
  "omnivore",
  "terrestrial",
  "avian"
 ],
 [
  "Киви",
  "Apteryx australis",
  "Aves",
  "Apterygiformes",
  "omnivore",
  "terrestrial",
  "avian"
 ],
 [
  "Пингвин",
  "Aptenodytes forsteri",
  "Aves",
  "Sphenisciformes",
  "predator",
  "semiaquatic",
  "aquatic"
 ],
 [
  "Кит",
  "Megaptera novaeangliae",
  "Mammalia",
  "Cetacea",
  "predator",
  "aquatic",
  "aquatic"
 ],
 [
  "Дельфин",
  "Delphinus delphis",
  "Mammalia",
  "Cetacea",
  "predator",
  "aquatic",
  "aquatic"
 ],
 [
  "Косатка",
  "Orcinus orca",
  "Mammalia",
  "Cetacea",
  "predator",
  "aquatic",
  "aquatic"
 ],
 [
  "Акула",
  "Carcharodon carcharias",
  "Elasmobranchii",
  "Lamniformes",
  "predator",
  "aquatic",
  "aquatic"
 ],
 [
  "Скат",
  "Mobula birostris",
  "Elasmobranchii",
  "Myliobatiformes",
  "predator",
  "aquatic",
  "aquatic"
 ],
 [
  "Тюлень",
  "Phoca vitulina",
  "Mammalia",
  "Carnivora",
  "predator",
  "semiaquatic",
  "aquatic"
 ],
 [
  "Морской лев",
  "Zalophus californianus",
  "Mammalia",
  "Carnivora",
  "predator",
  "semiaquatic",
  "aquatic"
 ],
 [
  "Морж",
  "Odobenus rosmarus",
  "Mammalia",
  "Carnivora",
  "predator",
  "aquatic",
  "aquatic"
 ],
 [
  "Ламантин",
  "Trichechus manatus",
  "Mammalia",
  "Sirenia",
  "herbivore",
  "aquatic",
  "aquatic"
 ],
 [
  "Выдра морская",
  "Enhydra lutris",
  "Mammalia",
  "Carnivora",
  "predator",
  "aquatic",
  "aquatic"
 ],
 [
  "Черепаха",
  "Testudo graeca",
  "Reptilia",
  "Testudines",
  "herbivore",
  "terrestrial",
  "reptile"
 ],
 [
  "Морская черепаха",
  "Chelonia mydas",
  "Reptilia",
  "Testudines",
  "herbivore",
  "aquatic",
  "aquatic"
 ],
 [
  "Ящерица",
  "Lacerta agilis",
  "Reptilia",
  "Squamata",
  "predator",
  "terrestrial",
  "reptile"
 ],
 [
  "Игуана",
  "Iguana iguana",
  "Reptilia",
  "Squamata",
  "herbivore",
  "terrestrial",
  "reptile"
 ],
 [
  "Хамелеон",
  "Chamaeleo chamaeleon",
  "Reptilia",
  "Squamata",
  "predator",
  "arboreal",
  "reptile"
 ],
 [
  "Геккон",
  "Gekko gecko",
  "Reptilia",
  "Squamata",
  "predator",
  "terrestrial",
  "reptile"
 ],
 [
  "Змея",
  "Natrix natrix",
  "Reptilia",
  "Squamata",
  "predator",
  "semiaquatic",
  "reptile"
 ],
 [
  "Змея (удав)",
  "Boa constrictor",
  "Reptilia",
  "Squamata",
  "predator",
  "terrestrial",
  "reptile"
 ],
 [
  "Кобра",
  "Naja naja",
  "Reptilia",
  "Squamata",
  "predator",
  "terrestrial",
  "reptile"
 ],
 [
  "Питон",
  "Python regius",
  "Reptilia",
  "Squamata",
  "predator",
  "terrestrial",
  "reptile"
 ],
 [
  "Крокодил",
  "Crocodylus niloticus",
  "Reptilia",
  "Crocodylia",
  "predator",
  "semiaquatic",
  "reptile"
 ],
 [
  "Аллигатор",
  "Alligator mississippiensis",
  "Reptilia",
  "Crocodylia",
  "predator",
  "semiaquatic",
  "reptile"
 ],
 [
  "Черепаховая ящерица",
  "Gerrhosaurus major",
  "Reptilia",
  "Squamata",
  "predator",
  "terrestrial",
  "reptile"
 ],
 [
  "Летучая мышь",
  "Myotis myotis",
  "Mammalia",
  "Chiroptera",
  "predator",
  "aerial",
  "nocturnal"
 ],
 [
  "Осьминог",
  "Octopus vulgaris",
  "Cephalopoda",
  "Octopoda",
  "predator",
  "aquatic",
  "aquatic"
 ],
 [
  "Кальмар",
  "Loligo vulgaris",
  "Cephalopoda",
  "Teuthida",
  "predator",
  "aquatic",
  "aquatic"
 ],
 [
  "Медуза",
  "Aurelia aurita",
  "Scyphozoa",
  "Semaeostomeae",
  "predator",
  "aquatic",
  "aquatic"
 ],
 [
  "Морской конёк",
  "Hippocampus hippocampus",
  "Actinopterygii",
  "Syngnathiformes",
  "predator",
  "aquatic",
  "aquatic"
 ],
 [
  "Краб",
  "Cancer pagurus",
  "Malacostraca",
  "Decapoda",
  "omnivore",
  "aquatic",
  "aquatic"
 ],
 [
  "Омар",
  "Homarus gammarus",
  "Malacostraca",
  "Decapoda",
  "omnivore",
  "aquatic",
  "aquatic"
 ]
];
test('Exactly 100 approved subjects have an appropriate visual family',()=>{
 assert.equal(ROSTER.length,100);
 for(const [russian,name,cls,order,diet,habitat,expected] of ROSTER){
  const row=[1878,name,'species',cls,order,'','Chordata'];
  const frame=cardAdornment(row,{diet,habitat},'Φρέιζερ');
  assert.equal(frame.kind,expected,russian+' / '+name);
  assert.ok(Number.isInteger(frame.variant)&&frame.variant>=0&&frame.variant<5);
 }
});
test('Frogs retain webbed feet, not giant destructive water bites',()=>{
 const frog=cardAdornment([1878,'Cornufer opisthodon','species','Amphibia','Anura','','Chordata'],
  {diet:'predator',habitat:'semiaquatic'},'Φρέιζερ');
 assert.equal(frog.kind,'soft-predator');
 const slice=source.slice(source.indexOf(' const gentle=['),source.indexOf(' const aquatic=['));
 assert.match(slice,/webbedFoot/);
 assert.ok(!slice.includes('bite(')&&!slice.includes('claw('),'Frog frame must not have bites or claws');
 assert.ok(!slice.includes('waterSplash('),'No broad water holes on frog');
});
test('Approved artwork is not replaced and score calculation stays separate',()=>{
 const atlas=fs.readFileSync('animal_atlas.js','utf8');
 const app=fs.readFileSync('app.js','utf8');
 assert.ok(atlas.includes("'./art/animals-gold-v1.png'"));
 assert.ok(app.includes('function score(s)'));
});
