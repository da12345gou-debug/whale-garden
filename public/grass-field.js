// A world-space spring field shared by every blade. It keeps footsteps after
// the actors move away, and scrolls its saved state as the player explores.
export class GrassBendField{
  constructor(count=128,spacing=.5){
    this.count=count;this.spacing=spacing;this.size=count*spacing;this.originX=0;this.originZ=0;this.initialized=false;
    this.bendX=new Float32Array(count*count);this.bendZ=new Float32Array(count*count);this.velocityX=new Float32Array(count*count);this.velocityZ=new Float32Array(count*count);
    this.scratch=Array.from({length:4},()=>new Float32Array(count*count));this.pixels=new Uint8Array(count*count*4);this.activeCells=0;
    for(let i=0;i<count*count;i++){this.pixels[i*4]=this.pixels[i*4+1]=128;this.pixels[i*4+3]=255;}
  }
  follow(x,z){
    const ox=Math.floor((x-this.size/2)/this.spacing)*this.spacing,oz=Math.floor((z-this.size/2)/this.spacing)*this.spacing;
    if(!this.initialized){this.originX=ox;this.originZ=oz;this.initialized=true;return;}
    const dx=Math.round((ox-this.originX)/this.spacing),dz=Math.round((oz-this.originZ)/this.spacing);if(!dx&&!dz)return;
    const arrays=[this.bendX,this.bendZ,this.velocityX,this.velocityZ],n=this.count;
    for(let a=0;a<4;a++){
      const next=this.scratch[a];next.fill(0);
      if(Math.abs(dx)<n&&Math.abs(dz)<n){const begin=Math.max(0,-dx),end=Math.min(n,n-dx);for(let j=Math.max(0,-dz);j<Math.min(n,n-dz);j++)next.set(arrays[a].subarray((j+dz)*n+begin+dx,(j+dz)*n+end+dx),j*n+begin);}
      this.scratch[a]=arrays[a];arrays[a]=next;
    }
    [this.bendX,this.bendZ,this.velocityX,this.velocityZ]=arrays;this.originX=ox;this.originZ=oz;
  }
  step(dt,actors=[]){
    dt=Math.min(dt,.05);const n=this.count,s=this.spacing;
    for(let i=0;i<n*n;i++){
      this.velocityX[i]+=(-18*this.bendX[i]-6.8*this.velocityX[i])*dt;this.velocityZ[i]+=(-18*this.bendZ[i]-6.8*this.velocityZ[i])*dt;
      this.bendX[i]+=this.velocityX[i]*dt;this.bendZ[i]+=this.velocityZ[i]*dt;
    }
    const response=1-Math.exp(-dt*28);
    for(const actor of actors){
      const radius=actor.radius,loX=Math.max(0,Math.floor((actor.x-radius-this.originX)/s)),hiX=Math.min(n-1,Math.ceil((actor.x+radius-this.originX)/s));
      const loZ=Math.max(0,Math.floor((actor.z-radius-this.originZ)/s)),hiZ=Math.min(n-1,Math.ceil((actor.z+radius-this.originZ)/s));
      for(let j=loZ;j<=hiZ;j++)for(let k=loX;k<=hiX;k++){
        let dx=this.originX+(k+.5)*s-actor.x,dz=this.originZ+(j+.5)*s-actor.z,d=Math.hypot(dx,dz);if(d>=radius)continue;
        if(d<.001){dx=.1;dz=.05;d=Math.hypot(dx,dz);}
        const force=(1-d/radius)**1.2*(actor.strength??.85),i=j*n+k;
        this.bendX[i]+=(dx/d*force-this.bendX[i])*response;this.bendZ[i]+=(dz/d*force-this.bendZ[i])*response;this.velocityX[i]*=.3;this.velocityZ[i]*=.3;
      }
    }
    this.activeCells=0;
    for(let i=0;i<n*n;i++){
      const x=this.bendX[i],z=this.bendZ[i];if(Math.abs(x)+Math.abs(z)>.025)this.activeCells++;
      this.pixels[i*4]=Math.max(0,Math.min(255,Math.round(128+x*127)));this.pixels[i*4+1]=Math.max(0,Math.min(255,Math.round(128+z*127)));this.pixels[i*4+2]=Math.min(255,Math.round(Math.hypot(x,z)*255));
    }
  }
  sample(x,z){const k=Math.floor((x-this.originX)/this.spacing),j=Math.floor((z-this.originZ)/this.spacing);return k>=0&&k<this.count&&j>=0&&j<this.count?Math.hypot(this.bendX[j*this.count+k],this.bendZ[j*this.count+k]):0;}
}
