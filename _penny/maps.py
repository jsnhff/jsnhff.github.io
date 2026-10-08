# Coin face maps for the penny, from the US Mint's public-domain image of the
# cent (source/us-mint-cent.png). Writes colour, normal and roughness maps for
# each face into the current directory; run from images/penny/:
#   python3 ../../_penny/maps.py ../../_penny/source/us-mint-cent.png
#
# Colour keeps the coin but flattens half the studio lighting baked into the
# render, so the scene's own light does the shading. Relief is the fine detail
# of the luminance (a high-pass), plus a raised rim from the geometry; the
# normals come from that, and raised metal is made smoother than the field.
from PIL import Image
import numpy as np, os, sys
src=Image.open(sys.argv[1]).convert('RGB')
N=512
faces={'obverse':(151.5,150.5,139.5),'reverse':(446.5,150.0,139.5)}
yy,xx=np.mgrid[0:N,0:N]; rr=np.hypot(xx-(N-1)/2,yy-(N-1)/2)/(N/2)
inside=rr<=0.985
def blur(a,s):
    if s<=0: return a
    r=int(3*s)+1; x=np.arange(-r,r+1); k=np.exp(-x**2/(2*s*s)); k/=k.sum()
    p=np.pad(a,r,mode='edge')
    t=np.apply_along_axis(lambda v: np.convolve(v,k,'valid'),1,p)
    return np.apply_along_axis(lambda v: np.convolve(v,k,'valid'),0,t)
for name,(cx,cy,R) in faces.items():
    crop=src.crop((round(cx-R),round(cy-R),round(cx+R),round(cy+R))).resize((N,N),Image.LANCZOS)
    c=np.asarray(crop).astype(float)/255
    lum=c@np.array([0.2126,0.7152,0.0722])
    lumi=lum.copy(); lumi[~inside]=lum[inside&(rr>0.9)].mean()
    low=blur(lumi,40); meanL=lum[inside].mean()
    flat=np.clip(c*((meanL/np.maximum(low,1e-3))**0.5)[...,None],0,1)
    edgecol=np.median(flat[(rr>0.9)&(rr<0.97)],axis=0); flat[~inside]=edgecol
    hp=lumi-blur(lumi,6); hp=hp/np.percentile(np.abs(hp[inside]),99)
    rim=np.clip((rr-0.86)/0.04,0,1)*np.clip((1.0-rr)/0.03,0,1)
    h=np.clip(0.5+0.35*hp,0,1)*0.7+rim*0.45
    h[~inside]=h[inside&(rr>0.95)].mean(); h=blur(h,0.8)
    gy,gx=np.gradient(h); k=6.0
    nx=-gx*k; ny=gy*k; L=np.sqrt(nx**2+ny**2+1)
    nor=np.stack([nx/L*0.5+0.5, ny/L*0.5+0.5, 1/L*0.5+0.5],-1)
    rough=np.clip(0.42-0.44*(h-0.5),0.15,0.6)
    Image.fromarray((flat*255).astype(np.uint8)).save(f'{name}-color.webp',quality=90)
    Image.fromarray((nor*255).astype(np.uint8)).save(f'{name}-normal.webp',quality=92)
    Image.fromarray((rough*255).astype(np.uint8)).save(f'{name}-rough.webp',quality=90)


