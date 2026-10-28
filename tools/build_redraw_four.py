#!/usr/bin/env python3
"""Four anatomically distinctive bird, deer, and lagomorph silhouette studies; traced from newly generated original art, not the old erroneous silhouettes."""
import base64,hashlib,json,zlib,io
from pathlib import Path
from PIL import Image,ImageDraw
import cairosvg
ROOT=Path(__file__).resolve().parents[1]
ENCODED="eNpNmMm1HTkORH3561wQ4Nw2ZDkgV_q07x03kFJphUc-DiCGQCD_-5Pj5z8__8w1nmjzneM857yznWedd5zxzPaOOZ4x39HbM_s72n12vn2vJ2K9PbVznDfPfuLEmzGe7PfNlk_O9UYfT2_n1d-973drNOcbM56ekm0-fYX_PePVgSXzPn3rkJAMyan5yDe3lrf-5uLQIXmfvPvVhRpLSv28U8rEkwcpZfSe3KzT-tskpfxCufv2KznuO3I_mbx06hGfvPGOsZ4MvbnrvBxap3N6viOm9skkspPu1PjUOdI3sVF0nz9C-6b2NemxdG7TeUtGu7vuP9qHMY_Wy-D9aP_qktJrTempedmhr-Z3WG_0H9ihvV2e4b04g_exrkdofn__d9ulj6h5O0PnJ_txnuzaNB9Z_-s9vem-dsvOso_temtd7m5nJm4M_tc5Ib1i1j45vyfnS4_UvT3t7t61j_cohDrvVHD03er8w73Sb2uf7GMZreY74-F39q19k_lb7zsEoc7FLuin9YP3XNm51_zoeo_sYnm2_Lk_eb1_rPB5Azvtb73ltB6D92z8pfHUPVv_92l_YQf7S_HH-lyctyqOSIalc288kal8kpS9puIkZM-5FF8Rv_7xA2OWIxRgMiYG1R_2mF44_5JYVJ7uQ_JisUpDLGlLEFlzloWJEGlkD3Td5BQhhRTqTqlMuy4dElsLtKNyqTs20jEyKgfl2-BGqRrYQKoGuai3BjbsoZRunzyeT8cEN8t4uQkiBfMhiZPk1B-ykiKpsnIruu755GJeC3RkKnySNFT6oBLpYVWnFhAnOeMtKas4z8JxhT_yXs-n82sZP3SATnZi6sR2nYjBBjmcx0gdLVAEp-ycqYmhE8n8oZ0d7TuhAHQoVHE5Dlkb3MOOAOD-duh13SewkxWrkruT5CyUr0dnIhy17DQajeFo9pEd-OrlZBbUXUt_ALIOG_2Ry_kjB-vIxkQ4cL3zAmBfXMmjRgSZ04iQX6bqJO46tWBNQx2pJqk_FDAZzbme5Dx3BQ_mbAWI_RyV1CxIkiPwM2qDJhylkmF3EuQKN8Ns6s642kG6nE1aUEy6ozjIdwVv4JY-9WMXMIYAHkCoHWQU-bCOM69vHaWg66e5LOGuOAPLrFpwlqEeLwTQIij2yfJOyVnr0AkokKljYVq9Jsh1lFZMWWqD53cvdwagLxMH5VPPjSlv-YecMqYWpFAG5RUQoJLKJDunqzAwFI0TumHD42CBJ0YdGV-dUk4OzCIXgGce83rW8TgOko6y71DcRJPqKqdUN1UTi_FQ8xRkQKOecXWlKqgKzVDOshHjQA_ab9nr_vNJ1Z1Q_IGjoeCplzaMNR5so9OAVakB6soXhz-F6lhWGbTTym2spJyVWYFMEF0KqAAOeQXl9J51fv08P71DW4ZybehahQdVWBknsIagCBNw2KhSO46Fvbge8QtwHdgX3birXDtIEr2OVFbg4sCO2YEfJW6o2gOhoZQHPEJVPgiRDSJWGAdpqioa4FoXQpIQ8nOAa4N5wEZjIEOKBtVc9ogJNGtMdVKVDKoTYDTT1S-oTqxbWewIhFV1C6owEjakUOXczj2uzkLmAysAiWERGoOG6Ik-pBvFRu9OasRBrpKKMqpoutoWqxJTekG2klRZWFgvid7yYFI1B6VlfCXmqyQ9i42tD3TXKooIe-unAANXGfeu2ULOLNaQ1_OCPMlT7IB5UvSr6h12eL6ap_rRB6xD_uQdmWZBCQagLyi5TlV12w8ICL-ryz6WZ9Q5VLh-C-phYbAsqg12HRU3xm1YoEorLDEIVlCrz8oO2XfofQFrRCbBfMl3yfXXPFnaKltlH5E6YIFsUeVfQlEASTf7dnOg31ofcyJA89QCKr3BsztcTCXASLLQ95DN1kP6dSeifrQoOBFQk5jRVgFVM3LltyA-AMlaAHJpgRJyBgkJnyGDFAEW-eA3JSSktjUSm-q-S_AKM6PlCg4Wij0qt7Jyb-HLYZt2qmmj0sn2MNemWIGRAteXWJo17te-SHyiIgtrgZGTE-mcaR-LyWIr5Jps4YZkklswvV1y9Vqv-812LI-NSw51YrptM8-Sq2iVZeVMH8VAKVwqJZKnnOJchr9trxswcMDYHdAu5nmqY3As3lG8TrHT3SHIudQOmDLID18B_KIYz5AdoSfFJbK4BChrVgLXGM7F0c21isGyHvYCc-2nYhyeMMrTPndkdT7jVmczmnOYmHcujK9DmrP24ZcvivGHx7MqBRjpdaynw-n337FpR3M5cocFWVrTtcPn0vlQcUzHvvOy135qLNgifjPup5_86LH3VeXM2K5MXu_xciVNVzatb8el0mNym5aYdndVp0FtGAktaLa_iz0Mn06B3B7VmZFS-Bs3Ss0J89FxfY2CXh1rVg71NdQp40I52pUHYj1ukMFyxRA0rPPjX5Cbbq20g05A5DDAhQH6a6cs5cgdZPlHZStECDlCw9nN2z-fwhomXJAdJCXBCWcCkRpjSOJdZlX0tyWhYyBiuBLW_9AySqpomE_YFa5OZ0GtFDRwpIFDcUGZrk8N0DoKgRSaANqkoCtdnwWqC3OievgwKQZtrzMi6AGoxvSa8DFnWvXyGMqy_yabo-QsXku1IqLiVhVy9VynqvqlWhPJ18hgJPE3ia__SarzdofmKgyikNmwgF1fPuzJfl2FmU96XqogGUwVbr08jueFk7AIqqr37fVVXcjyqip8spCFXvt2g63rAv0a7waR6K58nu4Z1Xvn14uXbFW96XCoip1zpxEy3e8VMldv3-sbAXoQ0Zs4-3pif8PIT1YZIrzQa3zs4U9vjb4gTkR1rCAarQptkZDcVVXI6m8o60M2wjWH2ZQlmeuKMAvJqJq9FQJ4zPz-5nchBYjWipb_kXE-GSbbzvRRbZqR0PP7k9eN0Z8xzanlh0Qet0IMI0xz1-NaafLd3SYVMq3izPcbt_2NZ5H0-yHTb26NHS1bIWFrxfUhseQB9t7OuW88TYphs9iF_MBeQSUgV-ky4fK9WM897nPcLynJkgb544bUI7pYvDX4A4QSiTDJy49E5vc9ITvIVR_8HLfRS_KdgApmmfX94Jy_JAj3_X_qm1IQT7FrnooNrkX__s9qH_zQuT95MAhtlF68-l-Y7U4NPDsfWO9PMqbRZqE51ihM4fvNb0yhM4NyGonWQ2Mg7OWrlhDBn17a429T-6FfVAGBU6reQTGlI8wTMTxJ06rtmFoBx0h-MmvrDzoKAp5ZX_ZILgUNQCgsl56kGhmjCEEZ0f5ZF85uZfzFkA7p9Sn318___g84lKYL"
paths=json.loads(zlib.decompress(base64.urlsafe_b64decode(ENCODED)).decode())
assert set(paths)=={'24','33','51','52'}
OUT=ROOT/'art/redraw-gold';OUT.mkdir(exist_ok=True,parents=True)
QA=ROOT/'qa-artifacts';QA.mkdir(exist_ok=True,parents=True)
bg=Image.new('RGB',(1280,980),'#16121b');draw=ImageDraw.Draw(bg)
items=[]
for i,(n,name) in enumerate([(24,'Ворона'),(33,'Косуля'),(51,'Кролик'),(52,'Заяц')]):
 p=paths[str(n)]
 assert p.startswith('M') and len(p)>600
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="640" height="440" viewBox="0 0 640 440" role="img" aria-label="{name} — оригинальный чёткий золотой рисунок">
<defs><linearGradient id="g" x1="0%" y1="0%" x2="42%" y2="100%"><stop stop-color="#f9d9a0"/><stop offset="0.57" stop-color="#dab075"/><stop offset="1" stop-color="#b47b40"/></linearGradient></defs>
<path d="{p}" fill="url(#g)" stroke="#f4cf93" stroke-width="1" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''
 data=svg.encode()
 target=OUT/f'animal-{n:03d}.svg';target.write_bytes(data)
 painted=Image.open(io.BytesIO(cairosvg.svg2png(bytestring=data))).convert('RGBA')
 assert painted.size==(640,440)
 assert all(painted.getpixel(pos)[3]==0 for pos in ((0,0),(639,0),(0,439),(639,439)))
 bg.paste(painted,((i%2)*640,(i//2)*490),painted)
 draw.text(((i%2)*640+15,(i//2)*490+451),f'#{n} {name} original vector proposal',fill='#efcb8a')
 items.append({'index':n,'file':target.name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'anatomy_reviewed':False,'published':False,'source':'newly generated feline figure, simplified as source-independent vector; detailed morphology manual approval required'})
(OUT/'manifest-proposals-4.json').write_text(json.dumps({'status':'candidate-only','items':items},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
bg.save(QA/'redraw-crow-deer-rabbit-hare-proposals.png',optimize=True)
print('NEW_CATS_VECTOR_CANDIDATES',items,flush=True)
