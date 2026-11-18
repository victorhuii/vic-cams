"""Extract original pixels from supplied Pinterest strips; never redraw the art.
Requires Pillow, NumPy and SciPy. Source photos remain outside the repository.
Coordinates refer to the supplied 736px Pinterest image (675px for Cozy Doodles).
"""
from pathlib import Path
import json, argparse, urllib.request, re, html
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--source-dir',default='/private/tmp/victor-pin-frames');parser.add_argument('--download',action='store_true');args=parser.parse_args()
SOURCE=Path(args.source_dir);SOURCE.mkdir(parents=True,exist_ok=True)
OUT=ROOT/'public/frames/originals'
OUT.mkdir(parents=True,exist_ok=True)
# Each ROI restores only the flat-color artwork in a photo window.
# Matching source pixels and their original antialiasing are retained unchanged.
SPECS=[
 dict(key='star-buddies',pin='818247826083632089',crop=[0,0,368,1104],windows=[[16,9,336,224],[16,249,336,224],[16,489,336,225],[16,730,336,224]],rois=[([0,155,144,256],'pastel'),([255,397,323,443],'white'),([224,433,338,479],'gold'),([242,439,365,500],'white'),([3,662,55,719],'white'),([303,663,363,721],'gold'),([40,926,154,955],'pastel'),([159,934,276,956],'white')],date=[140,1087,225,1104],datePoint=[184,1099],ink='#aa9981'),
 dict(key='honey-bears',pin='616500636526937898',crop=[0,0,368,1104],windows=[[16,10,336,224],[16,250,336,224],[16,490,336,224],[16,730,336,224]],rois=[([0,105,161,236],'gold'),([193,362,356,476],'gold'),([0,577,127,726],'gold'),([109,909,260,1047],'gold')],date=[141,1087,226,1104],datePoint=[184,1099],ink='#202020'),
 dict(key='pancake-bears',pin='888475832769247693',crop=[0,0,368,1104],windows=[[30,30,322,216],[30,261,322,216],[30,493,322,216],[30,725,322,216]],rois=[([17,141,117,262],'gold'),([245,30,352,98],'gold'),([273,210,365,257],'pastel'),([18,435,111,485],'pastel'),([279,404,366,481],'white'),([16,675,108,719],'gold'),([288,632,355,666],'gold'),([270,666,366,721],'pastel'),([24,879,144,1041],'gold'),([117,936,243,1041],'pastel'),([209,926,301,1017],'white'),([270,991,318,1040],'gold')],date=[146,1064,227,1087],datePoint=[184,1082],ink='#ad945d'),
 dict(key='love-cats',pin='925489792186178722',crop=[0,0,368,1104],windows=[[30,30,322,216],[30,261,322,216],[30,493,322,216],[30,725,322,216]],rois=[([14,157,166,259],'love'),([17,395,154,492],'white'),([235,395,367,492],'pastel'),([237,597,367,731],'love'),([71,900,327,1048],'love')],date=[148,1064,225,1087],datePoint=[184,1082],ink='#ffffff'),
 dict(key='flower-pups',pin='1134133118709465011',crop=[0,0,368,1104],windows=[[30,31,320,215],[30,263,320,213],[30,495,320,215],[30,728,320,207]],rois=[([237,174,361,258],'pastel'),([28,453,185,489],'pastel'),([270,415,364,480],'pastel'),([19,631,99,714],'white'),([96,669,250,716],'white'),([279,639,350,716],'white'),([78,920,311,993],'white')],wavy=True,date=[145,1066,230,1088],datePoint=[184,1082],ink='#e99b9c'),
 dict(key='picnic-bear',pin='1134133118709464841',crop=[0,0,368,1104],windows=[[30,32,321,214],[30,263,321,214],[30,495,321,214],[30,726,321,215]],rois=[([15,137,132,282],'love'),([239,366,368,505],'pastel'),([15,650,178,749],'white'),([236,29,354,116],'white'),([144,880,268,944],'pastel')],date=[147,1064,227,1087],datePoint=[184,1082],ink='#242424'),
 dict(key='cozy-doodles',pin='693343305179862951',crop=[0,54,344,1147],windows=[[11,64,306,239],[11,318,306,241],[11,568,306,243],[11,819,306,242]],rois=[([0,244,43,300],'pastel'),([0,293,219,333],'white'),([265,258,320,336],'white'),([17,531,120,591],'pastel'),([166,520,253,570],'white'),([246,517,311,572],'pastel'),([18,772,103,837],'pastel'),([258,786,342,841],'pastel'),([30,1035,91,1080],'white'),([263,997,343,1081],'pastel')],date=None,datePoint=[172,1089],ink='#444444'),
 dict(key='cloud-friends',pin='661888476517657329',crop=[0,0,368,1104],windows=[[23,10,319,222],[23,254,319,222],[23,494,319,220],[23,736,319,220]],rois=[([256,0,366,57],'white'),([0,157,113,246],'cloud'),([281,193,367,248],'white'),([0,398,110,482],'pastel'),([277,443,367,526],'pastel'),([0,674,99,770],'pastel'),([277,694,367,790],'cloud'),([72,930,165,975],'gold')],cloud=True,date=[141,1087,228,1104],datePoint=[184,1099],ink='#202020'),
 dict(key='pink-six',pin='617696905182214774',crop=[0,0,736,1104],windows=[[68,45,279,321],[386,69,280,321],[68,373,279,321],[386,399,280,320],[68,701,279,321],[386,727,280,321]],rois=[],date=[586,1048,668,1066],datePoint=[628,1062],ink='#fff7ef'),
 dict(key='heart-sketch',pin='771171136243296510',crop=[8,0,728,919],windows=[[26,0,330,269],[364,0,330,269],[26,279,330,283],[364,279,330,283],[26,571,330,283],[364,571,330,283]],rois=[([0,0,720,870],'heart')],date=None,datePoint=[360,902],ink='#dc80a8'),
 dict(key='photoism-witch',pin='photoism-halloween',source='https://x.com/photoism_kr/status/1967438228287627481',crop=[196,218,467,1024],windows=[[22,45,227,182],[22,231,227,182],[22,417,227,182],[22,603,227,182]],rois=[],blank=True,date=None,datePoint=[135,800],ink='#ffffff'),
 dict(key='photoism-pumpkin',pin='photoism-halloween',source='https://x.com/photoism_kr/status/1967438228287627481',crop=[493,218,765,1024],windows=[[22,45,227,182],[22,231,227,182],[22,417,227,182],[22,603,227,182]],rois=[],blank=True,date=None,datePoint=[136,800],ink='#ffffff'),
]

def pixels_for_art(rgb,box,kind):
 x0,y0,x1,y1=box
 a=rgb[y0:y1,x0:x1].astype(float);r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
 white=(np.minimum(np.minimum(r,g),b)>218)
 gold=(r>170)&(g>112)&(b<185)&(r-g>17)&(g-b>12)
 pink=(r>225)&(g>135)&(b>135)&(r-g>24)
 if kind=='white': candidate=white
 elif kind=='gold':candidate=gold
 elif kind=='honey':candidate=gold&(g-b>42)
 elif kind=='love':candidate=white|gold|pink
 elif kind=='cloud':candidate=white|gold|((r>175)&(b-g>5)&(r-b<35))
 elif kind=='fox':candidate=((r>180)&(g<150)&(b<145))|white
 elif kind=='green':candidate=gold|((g>r+10)&(g>b+20)&(r>95)&(b<150))
 elif kind=='lavender':candidate=(r>175)&(b-g>5)&(r-b<35)
 elif kind=='heart':candidate=(r>180)&(b>140)&(b-g>12)&(r-g>30)
 else:candidate=white|gold
 # Close the thin original outlines and fill enclosed eyes, mouths and clothing.
 candidate=ndi.binary_closing(candidate,iterations=2,border_value=0)
 labels,n=ndi.label(candidate)
 areas=np.bincount(labels.ravel());areas[0]=0
 keep=np.flatnonzero(areas>=max(250 if kind=='heart' else 15,areas.max()*.035))
 mask=np.isin(labels,keep)
 mask=mask if kind=='heart' else ndi.binary_fill_holes(mask)
 mask=ndi.binary_dilation(mask,iterations=1 if kind=='heart' else 2)
 return mask

if args.download:
 for pin in dict.fromkeys(s['pin'] for s in SPECS):
  target=SOURCE/(pin+'.jpg')
  if target.exists():continue
  if pin=='photoism-halloween':url='https://pbs.twimg.com/media/G0di1CkbgAAxmRJ.jpg'
  else:
   req=urllib.request.Request('https://www.pinterest.com/pin/'+pin+'/',headers={'User-Agent':'Mozilla/5.0'})
   page=urllib.request.urlopen(req,timeout=30).read().decode()
   match=re.search(r'<meta[^>]*property="og:image"[^>]*content="([^"]+)"',page)
   if not match:raise RuntimeError('Original image is unavailable for pin '+pin)
   url=html.unescape(match.group(1))
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
  target.write_bytes(urllib.request.urlopen(req,timeout=30).read())
manifest=[]
for spec in SPECS:
 im=Image.open(SOURCE/(spec['pin']+'.jpg')).convert('RGB').crop(spec['crop']);rgb=np.array(im);h,w=rgb.shape[:2];alpha=np.full((h,w),255,np.uint8)
 for x,y,width,height in spec['windows']:alpha[y:y+height,x:x+width]=0
 for box,kind in spec['rois']:
  x0,y0,x1,y1=box;m=pixels_for_art(rgb,box,'honey' if spec['key']=='honey-bears' else kind)
  clips={
   ('honey-bears',(193,362,356,476)):[(194,444),(200,427),(212,422),(218,416),(245,390),(260,389),(260,379),(269,367),(282,363),(296,365),(306,373),(312,389),(326,398),(337,416),(342,439),(354,456),(355,476),(194,476)],
   ('honey-bears',(109,909,260,1047)):[(110,960),(122,947),(146,940),(166,940),(181,936),(195,929),(203,916),(215,909),(229,909),(239,914),(241,925),(239,936),(243,947),(245,963),(250,976),(246,992),(250,1015),(259,1029),(249,1040),(215,1045),(178,1042),(150,1046),(128,1042),(121,1034),(125,1013),(132,1001),(125,981),(116,973)],
   ('honey-bears',(0,105,161,236)):[(9,146),(17,139),(35,134),(54,136),(74,124),(90,123),(96,114),(109,109),(123,111),(132,120),(135,137),(142,155),(143,177),(155,185),(161,199),(153,218),(146,234),(15,234),(10,218),(11,198),(16,190),(11,183),(6,170),(6,154)],
   ('star-buddies',(224,433,338,479)):[(225,450),(236,440),(254,433),(269,429),(294,430),(313,439),(327,450),(333,470),(317,478),(229,478)],
  }
  polygon=clips.get((spec['key'],tuple(box))) if spec['key']!='honey-bears' else None
  if polygon:
   clip=Image.new('1',(x1-x0,y1-y0));ImageDraw.Draw(clip).polygon([(x-x0,y-y0) for x,y in polygon],fill=1);m &= np.array(clip)
  alpha[y0:y1,x0:x1][m]=255
 if spec.get('cloud'):
  alpha[:]=255
  a=rgb.astype(float);r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
  blue=(b>r+15)&(g>r+10)
  barrier=ndi.binary_closing(blue,iterations=1)
  for x,y,width,height in spec['windows']:
   top=max(0,y-10);bottom=min(h,y+height+14);region=barrier[top:bottom,:];seed=np.zeros_like(region);seed[(y+height//2)-top,x+width//2]=True
   hole=ndi.binary_propagation(seed,mask=~region)
   inside=np.zeros_like(hole);inside[y-top:y-top+height,x:x+width]=True;alpha[top:bottom,:][hole&inside]=0
  # Restore the exact flat-color stickers. Narrow masks exclude clothing lettering.
  for box,kind in [([0,167,94,218],'fox'),([6,399,93,460],'gold'),([277,443,367,526],'gold'),([0,674,91,749],'green'),([279,699,355,790],'lavender'),([72,930,165,975],'gold'),([256,0,366,57],'white'),([0,143,31,181],'white'),([0,210,115,248],'white'),([281,193,367,248],'white'),([0,453,106,484],'white'),([303,489,367,526],'white'),([0,719,99,770],'white'),([277,742,367,790],'white')]:
   x0,y0,x1,y1=box;m=pixels_for_art(rgb,box,kind);alpha[y0:y1,x0:x1][m]=255
 if spec['key']=='heart-sketch':rgb[:55,:26]=[255,255,255];alpha[:55,:26]=255
 if spec.get('wavy'):
  # This original has a scalloped fourth window. Its salmon paper is retained.
  x,y,width,height=spec['windows'][3];region=rgb[y:y+height,x:x+width].astype(float);paper=np.array([234,168,163]);m=np.max(np.abs(region-paper),axis=2)<24
  seeds=np.zeros_like(m);seeds[0,:]=m[0,:];seeds[-1,:]=m[-1,:];seeds[:,0]=m[:,0];seeds[:,-1]=m[:,-1];m=ndi.binary_propagation(seeds,mask=m)
  alpha[y:y+height,x:x+width][m]=255
 if spec.get('blank'):
  alpha[:]=255
  for x,y,width,height in spec['windows']:
   a=rgb[y:y+height,x:x+width].astype(float);white=(a.min(axis=2)>=240)&((a.max(axis=2)-a.min(axis=2))<24)
   labels,n=ndi.label(white);areas=np.bincount(labels.ravel());areas[0]=0;hole=labels==areas.argmax()
   alpha[y:y+height,x:x+width][hole]=0
 if spec['date']:
  x0,y0,x1,y1=spec['date'];patch=np.median(rgb[max(0,y0-4):y0,x0:x1],axis=(0,1)).astype('uint8')
  rgb[y0:y1,x0:x1]=patch;alpha[y0:y1,x0:x1]=255
 rgb[alpha==0]=0 # Do not ship the sample photographs hidden in transparent pixels.
 out=Image.fromarray(np.dstack([rgb,alpha]));out.save(OUT/(spec['key']+'.png'),optimize=True)
 # Review proof: opaque red/blue photos behind the unmodified source characters.
 proof=Image.new('RGBA',im.size,'#db304a');d=ImageDraw.Draw(proof)
 for i,(x,y,width,height) in enumerate(spec['windows']):d.rectangle((x,y,x+width-1,y+height-1),fill=['#db304a','#3277cf','#65ae80','#ab6dd0'][i%4])
 proof.alpha_composite(out);proof.convert('RGB').save(SOURCE/(spec['key']+'-proof.jpg'))
 manifest.append({k:v for k,v in spec.items() if k not in ['rois','date','wavy','crop','cloud','blank']}|{'width':w,'height':h,'src':'/frames/originals/'+spec['key']+'.png','source':spec.get('source','https://www.pinterest.com/pin/'+spec['pin']+'/')})
(ROOT/'src/features/booth/originalFrames.ts').write_text('// Source artwork metadata, generated by scripts/extract-frame-art.py.\nexport const originalFrameArtwork='+json.dumps({m['key']:m for m in manifest},ensure_ascii=False,separators=(',',':'))+';\nexport type OriginalFrame=(typeof originalFrameArtwork)[keyof typeof originalFrameArtwork];\n')
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Extracted',len(manifest),'original frame overlays.')
