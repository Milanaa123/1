#!/usr/bin/env python3
"""Two anatomically distinct feline vector studies; traced from newly generated original art, not the old erroneous silhouettes."""
import base64,hashlib,json,zlib,io
from pathlib import Path
from PIL import Image,ImageDraw
import cairosvg
ROOT=Path(__file__).resolve().parents[1]
ENCODED="eNpFmMu1NDcIhHO561kIoadj6JvApOLj3F1f0b-9GY569EBQFKC_f9bPXz-_Mz6x41mIfGaXWM9C7Ge2T5zxzCsRz8xP3On_joT-u_dZfGzPGjVi5nn21Kg_Oz-9jeeMT4_-XEQ-0Za-SkZovDQ-71j_ty3ZJEMyvWV01g3P53jmxdX8vrz7f-NYklqX2rd1ja-ViN6sU4yjsc4b2i_3c_Ynczy7S2z0z5FYIaeuPz-54rlhEe3qKzsxF3kkm05anwxpdKSxLCItPl2mDG668uncbO6no9EaltnX03v4MBlFsmteq_2vzlkaB_I8XQZP1m3Nz5C8Oodx_3TdVHtqfJ_u85vk1Hn3SSw4z5M6pw-Nu74ncn909pMpPXUPXV__D31Hz9Q67T9nfWc9-w-k1skOeTVPeuUJ31M6aryf3Ohx6n9hIa_Ol6c8D7mX9c0tuwVS9-06b8rouXSezJ2a13HCsr76z3rkZP9ur4yQywSkEdj5PqM323fIP6Xf8P1H1_8zJK_vN0aveaP5PgOQCxljDiNtCBldUBhzG1FDeAewY6zaB6n9_f_uJWWHsfiu8cGuGnP_TI0lR3vG3sbBEJz6npLSY2t_2QF7eZ5wM1uvfVkv_46j89GPwJHdZhMO2pEULjpSdhzS527jaIDT2UpKn9mAr_YFb8LP1L1T954JTrSfcNfX0rxR97u6R59eb7vc-cpre3h-a5LXkTaxe5u1PjgvHLkT3Alnk8iWX2ccR9oEd4qXaX-wj-wxVs0T_r3fgl-m_TrHa5f1SnC_T425j-IBP_s763bhcBIH3J84-DOW3ed55533fPzStY_YquS0_yZxpXipc3TP-e4zwviZMA7zpH_sY_uLA-RX2SXAW3xkNsKFqFQUhKwmS5eUFY5oSuBC6I5yeaSEmCP750B5mjIewUBMLOMrpmFBpgsi2lMAV9wJNjpdvyHwKrbEgNCYiBPGDTESR0av0a7R8RRFv4wn6nwUs9G3P8oFkLkshNjx_b1FeJf4u88h_M5zEfoTgoYyUQ0GhWgJXx0seb-_-BNexE7ilMJrnO9vniwCYOOAILQy1vfXDBcw2vYf8iJSWwERINf0BxCUFKVIiYQLsSNy2az9iuXhzCYtE1BDEgqGfiCNbhCZPGTr0ZBSyivxwSp2tRSLxTxsIB20pWHAxAUM02E8oQHgaRWGJuY2j86RL56XedJxt8E535MjhycGQNROYUIQGgw4TZgNZnsjC-a7ZBBd5o0EM8RqmrjfEDo6Ks8LcUKDEzShw3lJ7tFRQ7movzmpm9ukyyA4df1dZOdkJm8HZMUOZlnY0dGss9FNO6WPOmZ1ZxEWDtifkzq31A6CXwg_0IB37DKo-U9eHtQH8CbKgo_pVD-LEAhMfNdlWTImTENmZIUzqzMnymvCeGsMUyoSg8XmLG2lwBjEdLY6C4mpJ5icyxMSr4q8LUWuOctgyS08xsJC3iA7NvkEtur3zTICFF4Gs6CcgibxSewyUNcf_dYf_Val07FgyN3ZqlRRLGAISWmvGOU7JVKC3X4qsaOj7SJLQkCUPo0SSD7DNa3VramFfFsyHAx1dVucSLkGVZniKQ2CS_RKXUEKlEqETRzCRx_gNrbWROd4bqlSqsoqJQvMEdzaFodETjrbUb-NeWrLjraH609rjRnibIIc9jnOMxSf5DmB5iEKNEHOfHckP-3ik5o3i64AUiihjTNd4pF4vbPChe-ILXJsLmrXqVUhWlewm0JC6TJc-4YLRJXCUhiedz0WtmavylUrlfBFG7rzsULBuXvhehllTFuJEy0vsSBX8wfWCqLMUh5MqlOiBxJpwOy1s6tUuZ7cQ200_tRszTkZiW08z_Pz_-_iGmooaSDb3GuGh0piVZGAsW3UNV10xFxM1B_E9yUlbHNMwBAA3X-ISrj1SArtSyLQUicCSeVzV-iDAMdxUhqOdYLEURSWIGDASpuVsuxhgthJFBGQDcomFXf6SKtCgAxyl24Jtma44gQhuafRmc7kVVHiUs_bWd-xKilQiMmJIt1Wi_QVpJFKHzcJfVXT4JyGAoAkSZf68BqBTC1zOXEbAlnQUy61eW0DvtONTDbGilqPPwjZxMyo-hYPNUaVUfnZfUqnUGh1Et_HQFdS9nsEKgmOmkjEXWf9QdulnA6_snIom4bzrnhVNzKYSPMGB2DqHCXf09lQwVhbH3HfrTmzVUntrfuL22Bv1aRhxJPC0B4mnpQ7q8Jf7EfxGxTfuGTsyvUqZ9zNcKZ9jxIDp7zleLgMb1QxWnGa_6iKSiuBrJSCBsM0iTdfQmn0Q9sbeOdmruq1EMvFcYPmnYEbrSJwa82tpy-FZRvOiqrhMqrYKkNSXUi3S2fUvYDcB2wobOC8ivtp55KOEkKiE8NqTjKjPDMEr7vdobDPGOUYjzMq5JxTal7yP6kFY5odZulDVWM617TplKSLP8PgxYKap79pKLVLt2tkL1wjUupERTSc6gK2fDtdU-HC8P98jzLTPNZCGPsUD_hwYumOQr77eYyKrUQkdH9KGLfqLrJCuUL_cmb1hJ4UhR7YipYEmVUpUt_SCmJXFo335HD-42VAeLgmdpXOVQqiFpzg20Q517aWntiEoWZVPX6hdhHBqUcHtlBU-wlh1J9y66nqgwK_e8OKhVN1DksFtvvmBnJxD9f9FFyHt4BhFwxHx_fn8xPNrzCnoDjVM1_qN5X9ynDiLSpMXeFWXxVtV3pzgLxhre-6CbBHOADlVbALj5xeEaqChvTHDanXbjVNp2pUt1LTI-HU1eT1RxnfldHlaaiLyRCqn3kT0EWkbkptegO_uSx3rtiautWlH9-JXLBBeQbNUpXN4jiO9ZuM-FrZxC8C-CiVg2LXiwDFqVuO9yUEZGbfRmq_7zmHepCXiWUrc76rXsa9tKX6TWwjxmT_7s45bEHG6ReZMKP4xYWGhXqT5yHBsrsjhWGq889WBauzdwLf61oZPkjzQtbLxm3ef_gc6PT4Xpa5HbfZq9riXpZUXWR1v2Dcqr3til3VrO5HR52dDiOt78RudN50QfQPNFh0JMgchpXn8c4VrI_qxF3jn7fDxceuW_xy4IqLiF_XnTPVBZ110FnDFAD0vO-Fuyol2hGvozuVfybBwMvDCfOj0X6qM4fHPD__jNOFWx9J50lPwkgtCe2CjE5OV0IBQms8foMZPNx5JvehgVpmGTp5ImQu82jJ1r8___wLNLR5Bw=="
paths=json.loads(zlib.decompress(base64.urlsafe_b64decode(ENCODED)).decode())
assert set(paths)=={'6','10'}
OUT=ROOT/'art/redraw-gold';OUT.mkdir(exist_ok=True,parents=True)
QA=ROOT/'qa-artifacts';QA.mkdir(exist_ok=True,parents=True)
bg=Image.new('RGB',(1280,490),'#16121b');draw=ImageDraw.Draw(bg)
items=[]
for i,(n,name) in enumerate([(6,'Тигр'),(10,'Пума')]):
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
 bg.paste(painted,(i*640,0),painted)
 draw.text((i*640+15,451),f'#{n} {name} original vector proposal',fill='#efcb8a')
 items.append({'index':n,'file':target.name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'anatomy_reviewed':False,'published':False,'source':'newly generated feline figure, simplified as source-independent vector; detailed morphology manual approval required'})
(OUT/'manifest-proposals.json').write_text(json.dumps({'status':'candidate-only','items':items},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
bg.save(QA/'redraw-cats-06-10-proposals.png',optimize=True)
print('NEW_CATS_VECTOR_CANDIDATES',items,flush=True)
