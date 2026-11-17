import * as T from './assets/three.module.js';
// Rounded, cupped petals with a soft rim and small radial folds.
export function petalGeometry(length=.25,width=.10){
  const positions=[],uv=[],indices=[],rows=12,columns=6;
  for(let i=0;i<=rows;i++){
    const t=i/rows,w=Math.pow(Math.sin(Math.PI*t),.48)*width;
    for(let j=0;j<=columns;j++){
      const s=j/columns*2-1;
      positions.push(s*w,.026*t+.035*t*t+.022*s*s*Math.sin(Math.PI*t)+.004*Math.cos(s*9)*Math.sin(Math.PI*t),t*length);
      uv.push(j/columns,t);
      if(i<rows&&j<columns){const a=i*(columns+1)+j;indices.push(a,a+columns+1,a+1,a+1,a+columns+1,a+columns+2);}
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
