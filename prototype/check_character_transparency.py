"""Validate production sprite alpha and grid integrity without modifying any artwork."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent.parent/'docs/assets'
sheets={'fullbody-main-cast.png':(3,2,.45),'fullbody-fair-cast.png':(3,2,.45),'youthful-web-portraits.png':(4,3,.15),'character-expressions.png':(4,3,.15),'cast-emotions.png':(4,3,.15),'iseo-dialogue-expressions.png':(3,1,.15),'dogyeom-dialogue-expressions.png':(3,2,.15),'fair-jihoo-acting.png':(3,2,.15),'fair-naeun-acting.png':(3,2,.15),'fair-dohyun-acting.png':(3,2,.15),'fair-extra-acting.png':(3,3,.15)}
for name,(columns,rows,minimum) in sheets.items():
 im=Image.open(root/name);assert im.mode=='RGBA',(name,im.mode)
 hist=im.getchannel('A').histogram();clear=hist[0]/(im.width*im.height);opaque=sum(hist[200:])/(im.width*im.height)
 assert clear>=minimum,(name,'remaining opaque backdrop',clear)
 assert opaque>.12,(name,'character was lost',opaque)
 for row in range(rows):
  for col in range(columns):
   x0,x1=round(col*im.width/columns),round((col+1)*im.width/columns);y0,y1=round(row*im.height/rows),round((row+1)*im.height/rows)
   a=im.getchannel('A').crop((x0,y0,x1,y1));h=a.histogram();assert sum(h[200:])/(a.width*a.height)>.12,(name,'empty cell',col,row)
 print(name,im.size,'clear',round(clear,3),'grid',str(columns)+'x'+str(rows))
print('All production portrait sheets retain opaque characters over true transparent backgrounds.')
