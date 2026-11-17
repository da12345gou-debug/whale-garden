import * as T from './assets/three.module.js';
let installed=false;
export function installReferenceColour(){
  if(installed)return;installed=true;
  T.ShaderChunk.colorspace_fragment+=`\n// Reference illustration colour: saturated emerald, coral and cyan.
    float referenceLuma=dot(gl_FragColor.rgb,vec3(.2126,.7152,.0722));
    gl_FragColor.rgb=clamp((mix(vec3(referenceLuma),gl_FragColor.rgb,1.23)-.5)*1.035+.5,0.,1.);`;
}
