/* JL Toolkit / QR Cat Visualizer
 * Scan-safe: readable 2D QR beside the animated cat.
 * Art: the QR matrix drives 3D fur-pattern cubes. Art cat itself is not scannable.
 * Three.js imported only when the 3D tab opens.
 */
const $=id=>document.getElementById(id);
const tabs=[...document.querySelectorAll('[data-cat-tab]')];
const panes={qr:$('catQrPane'),'3d':$('cat3dPane'),print:$('catPrintPane'),export:$('catExportPane')};
const printPanel=document.querySelector('.jl-print-panel.jl-sheet-tab');
if(printPanel)panes.print.append(printPanel);
let active='qr',sceneState=null, THREE=null,recording=false,disposed=false;
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const darkColors={
 orange:'#e9a359',black:'#292e38',gray:'#959eae',calico:'#f5d9b7'
};
function setTab(tab){
 if(!panes[tab])return;
 active=tab;
 for(const [key,pane] of Object.entries(panes))pane.hidden=key!==tab;
 for(const button of tabs){
  const on=button.dataset.catTab===tab;
  button.classList.toggle('cat-active',on);
  button.setAttribute('aria-selected',String(on));
  button.tabIndex=on?0:-1;
 }
 if(tab==='3d'||tab==='export')loadScene();
 if(tab==='print'){
  document.dispatchEvent(new CustomEvent('jl:sheet-open'));
  $('jlPreviewSheet')?.click();
 }
 if(tab==='export')updateExportPreview();
 if(tab==='3d')updateSafeQr();
}
tabs.forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.catTab)));
function getPayload(){
 if(window.JL_WIFI_MODE==='wifi'&&window.JLWiFi)return window.JLWiFi.payload();
 return $('payload').value.trim();
}
function qrGrid(){
 try{
  if(!window.qrcode)return null;
  const qr=qrcode(0,'H');qr.addData(getPayload());qr.make();return qr;
 }catch(e){return null}
}
function updateSafeQr(){
 const safe=$('catMode').value==='safe';
 $('catSafeCode').hidden=!safe;
 $('catModeText').textContent=safe?'SCAN-SAFE · QR + 3D CAT':'ART CAT · DATA → 3D';
 $('catState').textContent=safe?'Scan-safe':'Art / non-scannable';
 if(!safe)return;
 const current=$('preview').querySelector('svg');
 $('catSafeQr').replaceChildren();
 if(current){
  const clone=current.cloneNode(true);
  clone.removeAttribute('id');
  $('catSafeQr').append(clone);
 }
}
const palette=()=>({
 body:$('catColor').value==='custom' ? $('catCustom').value : darkColors[$('catColor').value],
 spot:$('catColor').value==='black'?'#5b6370':$('catColor').value==='gray'?'#596477':'#9e5c35',
 eye:'#172236',nose:'#bd7482'
});
function save(blob,name){
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),7000);
}
function exportSvg(){
 const svg=$('preview').querySelector('svg');
 if(!svg){$('catExportStatus').textContent='Generate a QR code first.';return}
 const output=svg.cloneNode(true);output.setAttribute('xmlns','http://www.w3.org/2000/svg');
 save(new Blob([new XMLSerializer().serializeToString(output)],{type:'image/svg+xml'}),'jl-cat-qr.svg');
 $('catExportStatus').textContent='QR SVG exported.';
}
function snapshot(){
 if(!sceneState){$('catExportStatus').textContent='Open the 3D preview first.';return}
 sceneState.renderer.render(sceneState.scene,sceneState.camera);
 sceneState.renderer.domElement.toBlob(blob=>{
  if(blob)save(blob,'jl-3d-cat.png');
  else $('catExportStatus').textContent='PNG capture failed.';
 },'image/png');
}
async function exportWebm(){
 if(recording)return;
 if(!sceneState){$('catExportStatus').textContent='Open the 3D preview first.';return}
 const canvas=sceneState.renderer.domElement;
 if(!window.MediaRecorder||!canvas.captureStream){$('catExportStatus').textContent='This browser does not support WebM recording.';return}
 const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(MediaRecorder.isTypeSupported);
 if(!mime){$('catExportStatus').textContent='WebM encoding is unavailable in this browser.';return}
 recording=true;const chunks=[],recorder=new MediaRecorder(canvas.captureStream(30),{mimeType:mime});
 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 recorder.onstop=()=>{recording=false;save(new Blob(chunks,{type:mime}),'jl-3d-cat.webm');$('catExportStatus').textContent='WebM animation exported.'};
 recorder.start();
 $('catExportStatus').textContent='Recording 5 seconds of 3D animation…';
 await new Promise(resolve=>setTimeout(resolve,5000));
 if(recorder.state!=='inactive')recorder.stop();
}
function updateExportPreview(){
 const qr=$('preview').querySelector('svg');
 if(qr){
  const clone=qr.cloneNode(true);clone.style.maxWidth='240px';clone.style.height='auto';
  $('catExportPreview').replaceChildren(clone);
 }
}
$('catPng').addEventListener('click',snapshot);
$('catWebm').addEventListener('click',exportWebm);
$('catSvg').addEventListener('click',exportSvg);
$('catExport').addEventListener('click',()=>{
 const value=$('catExportFormat').value;
 if(value==='webm')exportWebm();else if(value==='svg')exportSvg();else snapshot();
});
function makeGeometry(type,w,h,d){
 const voxel=$('catStyle').value==='voxel',low=$('catStyle').value==='lowpoly';
 if(voxel)return new THREE.BoxGeometry(w,h,d);
 const geo=new THREE.SphereGeometry(1,low?8:24,low?6:16);
 geo.scale(w/2,h/2,d/2);return geo;
}
function createCat(){
 if(!sceneState)return;
 const state=sceneState;
 if(state.cat){state.scene.remove(state.cat);state.cat.traverse(obj=>{obj.geometry?.dispose();if(obj.material&&!Array.isArray(obj.material))obj.material.dispose?.()})}
 const coat=palette(),cat=new THREE.Group(),tail=new THREE.Group(),head=new THREE.Group(),spots=[];
 const bodyMat=new THREE.MeshStandardMaterial({color:coat.body,roughness:.82,flatShading:$('catStyle').value!=='rounded'});
 const lightMat=new THREE.MeshStandardMaterial({color:'#fff4de',roughness:.9});
 const spotMat=new THREE.MeshStandardMaterial({color:coat.spot,roughness:.85});
 const darkMat=new THREE.MeshStandardMaterial({color:coat.eye,roughness:.4});
 const pinkMat=new THREE.MeshStandardMaterial({color:coat.nose,roughness:.48});
 function part(parent,material,at,size,shape){
  const geo=shape==='cone'?new THREE.ConeGeometry(size[0]/2,size[1],$('catStyle').value==='lowpoly'?4:8):makeGeometry(shape,...size);
  const mesh=new THREE.Mesh(geo,material);mesh.position.set(...at);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 part(cat,bodyMat,[0,.15,0],[1.45,1.60,1.02]);
 part(cat,lightMat,[0,-.06,.49],[.94,1.05,.12]);
 part(cat,bodyMat,[-.48,-.76,.30],[.48,.68,.58]);
 part(cat,bodyMat,[.48,-.76,.30],[.48,.68,.58]);
 part(cat,bodyMat,[-.53,.22,-.02],[.39,.82,.50]);
 part(cat,bodyMat,[.53,.22,-.02],[.39,.82,.50]);
 head.position.y=1.12;cat.add(head);
 part(head,bodyMat,[0,0,0],[1.65,1.37,1.18]);
 for(const side of [-1,1]){
  const ear=part(head,bodyMat,[side*.58,.67,0],[.52,.83,.37],'cone');
  ear.rotation.z=-side*.16;
  const inner=part(head,pinkMat,[side*.58,.71,.18],[.20,.39,.09],'cone');
  inner.rotation.z=-side*.16;
  part(head,darkMat,[side*.34,.06,.55],[.16,.21,.13]);
  part(head,lightMat,[side*.31,.095,.66],[.053,.059,.025]);
  part(head,lightMat,[side*.26,-.32,.50],[.45,.31,.30]);
 }
 part(head,pinkMat,[0,-.27,.77],[.20,.13,.12]);
 const whiskerMat=new THREE.MeshStandardMaterial({color:'#f3e8d2'});
 for(const side of [-1,1])for(let i=-1;i<=1;i++){
  const whisker=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,.62,5),whiskerMat);
  whisker.position.set(side*.78,-.32+i*.10,.64);whisker.rotation.z=side*(Math.PI/2+i*.16);
  head.add(whisker);
 }
 tail.position.set(.61,-.36,-.33);cat.add(tail);
 for(let i=0;i<8;i++)part(tail,i%3===0?spotMat:bodyMat,[.10+i*.105,.11+i*.17,-.07-i*.025],[.27,.32,.28]);
 // Transform QR dark modules into deterministic three-dimensional fur markings.
 if($('catMode').value==='art'){
  const qr=qrGrid(),n=qr?.getModuleCount()||0;
  if(n){
   const stride=Math.max(1,Math.ceil(n/26));
   for(let y=0;y<n;y+=stride)for(let x=0;x<n;x+=stride){
    if(!qr.isDark(y,x))continue;
    const nx=x/(n-1)*2-1,ny=y/(n-1)*2-1;
    const radial=nx*nx+ny*ny;
    if(radial>.86)continue;
    const depth=.53*Math.sqrt(1-radial*.92);
    const block=new THREE.Mesh(new THREE.BoxGeometry(.052,.052,.055),spotMat);
    block.position.set(nx*.64,.22-ny*.72,depth);
    const target=new THREE.Vector3(nx*.64,.22-ny*.72,depth);
    const source=new THREE.Vector3(nx*.98,1.0-ny*.98,1.55);
    block.userData.target=target;block.userData.source=source;
    block.position.copy(source);
    spots.push(block);
    cat.add(block);
   }
  }
 }else if($('catColor').value==='orange'){
  for(let i=-2;i<=2;i++)part(head,spotMat,[i*.19,.38,.49],[.07,.20,.055]);
 }
 state.cat=cat;state.head=head;state.tail=tail;state.spots=spots;state.morphStart=performance.now();
 state.scene.add(cat);cat.position.y=.18;
}
async function loadScene(){
 if(sceneState){resize();updateSafeQr();return}
 if(disposed)return;
 $('cat3dStatus').textContent='Loading interactive 3D scene…';
 try{
  THREE=await import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js');
  const host=$('catCanvas'),width=host.clientWidth||600,height=host.clientHeight||420;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(39,width/height,.1,100);camera.position.set(3.6,2.6,7.8);camera.lookAt(0,.3,0);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.setSize(width,height);renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;
  host.replaceChildren(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xffffff,0x66728e,2.4));
  const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(3,8,6);key.castShadow=true;scene.add(key);
  const fill=new THREE.PointLight(0xffcfb2,48,20);fill.position.set(-3,3,-1);scene.add(fill);
  const ground=new THREE.Mesh(new THREE.CylinderGeometry(1.88,1.95,.20,48),new THREE.MeshStandardMaterial({color:0x394560,roughness:.8,metalness:.18}));
  ground.position.y=-1.10;ground.receiveShadow=true;scene.add(ground);
  sceneState={scene,camera,renderer,ground,cat:null,head:null,tail:null,start:performance.now(),rotation:0};
  createCat();resize();updateSafeQr();
  const orbit={drag:false,x:0,angle:0};
  host.addEventListener('pointerdown',e=>{orbit.drag=true;orbit.x=e.clientX;host.setPointerCapture?.(e.pointerId)});
  host.addEventListener('pointermove',e=>{if(!orbit.drag)return;orbit.angle+=(e.clientX-orbit.x)*.008;orbit.x=e.clientX});
  host.addEventListener('pointerup',()=>orbit.drag=false);
  host.addEventListener('pointercancel',()=>orbit.drag=false);
  function tick(time){
   if(disposed)return;
   requestAnimationFrame(tick);
   if(!sceneState)return;
   const t=(time-sceneState.start)/1000,cat=sceneState.cat,anim=$('catAnimation').value;
   if(cat){
    if(sceneState.spots?.length){
      const progress=Math.max(0,Math.min(1,(time-sceneState.morphStart)/1400));
      const eased=1-Math.pow(1-progress,3);
      for(const block of sceneState.spots){
        block.position.lerpVectors(block.userData.source,block.userData.target,eased);
        block.scale.setScalar(.3+.7*eased);
      }
    }
    const motion=reduceMotion?.2:1;
    cat.rotation.y=orbit.angle+(anim==='spin'?t*.8:Math.sin(t*.7)*.08)*motion;
    cat.position.y=.18+(anim==='jump'?Math.abs(Math.sin(t*2))*1.1:anim==='walk'?Math.abs(Math.sin(t*3))*.09:Math.sin(t*1.7)*.055)*motion;
    sceneState.head.rotation.z=Math.sin(t*1.5)*.045*motion;
    sceneState.tail.rotation.z=Math.sin(t*(anim==='tail'?5:2.8))*.28*motion;
    sceneState.tail.rotation.x=Math.sin(t*1.1)*.14*motion;
    if(anim==='walk')cat.rotation.z=Math.sin(t*4)*.036*motion;else cat.rotation.z=0;
   }
   renderer.render(scene,camera);
  }
  requestAnimationFrame(tick);
  $('cat3dStatus').textContent='3D cat ready. Drag the scene to rotate.';
 }catch(err){$('cat3dStatus').textContent='3D unavailable: '+err.message+'. QR Preview and Print remain usable.'}
}
function resize(){
 if(!sceneState)return;
 const host=$('catCanvas'),w=host.clientWidth||600,h=host.clientHeight||420;
 sceneState.camera.aspect=w/h;sceneState.camera.updateProjectionMatrix();
 sceneState.renderer.setSize(w,h);
}
window.addEventListener('resize',resize);
for(const id of ['catMode','catStyle','catColor','catCustom']){
 $(id).addEventListener('input',()=>{
  $('catCustomRow').hidden=$('catColor').value!=='custom';
  updateSafeQr();
  if(sceneState)createCat();
 });
}
for(const id of ['payload','wifiSsid','wifiPassword','wifiSecurity','wifiHidden','ecc','type']){
 $(id)?.addEventListener('input',()=>{if(sceneState&&$('catMode').value==='art')createCat();updateSafeQr()});
}
$('generate').addEventListener('click',()=>{updateSafeQr();if(sceneState&&$('catMode').value==='art')createCat()});
const mutation=new MutationObserver(()=>{if(active==='3d')updateSafeQr()});
mutation.observe($('preview'),{childList:true});
window.addEventListener('beforeunload',()=>{disposed=true;sceneState?.renderer.dispose()});
setTab('qr');
