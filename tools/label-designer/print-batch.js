/* Horizontal saved-label gallery, editable cards and print collection. */
(()=>{
'use strict';
const canvasPanel=document.getElementById('stage').closest('.panel');
const strip=document.createElement('section');strip.className='jl-collection';
strip.innerHTML='<div class="jl-collection-header"><strong>My labels <span id="jlLabelCount" class="jl-label-count" aria-live="polite">0</span></strong><div class="jl-collection-actions"><button id="jlSaveLabel" type="button">Save current</button><button id="jlNewLabel" type="button" class="alt">+ New label</button><button id="jlUpdateLabel" type="button" class="alt">Update selected</button></div></div><div class="jl-gallery" id="jlLabelGallery" aria-label="Saved labels"></div><p class="hint" id="jlLabelMessage"></p>';
canvasPanel.insertBefore(strip,canvasPanel.querySelector('#stage'));
const indicator=document.createElement('div');
indicator.className='jl-active-label';
indicator.setAttribute('role','status');
indicator.setAttribute('aria-live','polite');
canvasPanel.insertBefore(indicator,canvasPanel.querySelector('#stage'));
function updateIndicator(){
 const current=saved[active];
 indicator.textContent=current
   ? 'ACTIVE LABEL '+(active+1)+' / '+saved.length+' — '+(model.name||current.name)
   : 'UNSAVED LABEL — '+(model.name||'Untitled label');
 indicator.dataset.selected=active<0?'unsaved':String(active);
}
const gallery=strip.querySelector('#jlLabelGallery'),message=strip.querySelector('#jlLabelMessage');
let saved=[],active=-1,updateTimer=null,selecting=false;
const snapshot=()=>({layout:JSON.parse(JSON.stringify(model)),svg:renderedSvg(),name:model.name||'Untitled label'});
function renderGallery(){
updateIndicator();
document.getElementById('jlLabelCount').textContent=String(saved.length);
gallery.replaceChildren();
saved.forEach((entry,i)=>{
const card=document.createElement('div');card.className='jl-gallery-card'+(active===i?' active':'');
const open=document.createElement('button');open.type='button';open.className='jl-gallery-open';open.setAttribute('aria-pressed',String(active===i));open.title='Edit '+entry.name;
const thumb=document.createElement('div');thumb.className='jl-gallery-preview';
const image=new DOMParser().parseFromString(entry.svg,'image/svg+xml').documentElement;
if(image.nodeName.toLowerCase()==='svg')thumb.append(document.importNode(image,true));
const name=document.createElement('span');name.className='jl-gallery-name';name.textContent=entry.name;open.append(thumb,name);
open.onclick=()=>{
 clearTimeout(updateTimer);
 // Finish the previous label's edits before changing the active document.
 if(active>=0 && active!==i) synchronizeActive();
 selecting=true;
 active=-1;
 try{
   const requested=JSON.parse(JSON.stringify(saved[i].layout));
   const loaded=window.JLLabelEditor.loadLayout(requested);
   // Verify editor model and rendered canvas both contain the selected text.
   const requestedTexts=loaded.elements.filter(e=>e.type==='text').map(e=>e.text);
   const canvasText=[...document.querySelectorAll('#design g.item text')].map(n=>n.textContent);
   if(requestedTexts.some(t=>!canvasText.includes(t))){
     throw Error('Canvas did not display the selected saved label');
   }
   active=i;
   renderGallery();
   message.textContent='Previewing '+saved[i].name+' ('+(i+1)+' of '+saved.length+').';
 }catch(error){
   message.textContent='Unable to switch label: '+error.message;
 }finally{selecting=false}
};
const remove=document.createElement('button');remove.type='button';remove.className='jl-gallery-delete';remove.title='Delete '+entry.name;remove.setAttribute('aria-label','Delete '+entry.name);remove.textContent='×';
remove.onclick=()=>{clearTimeout(updateTimer);saved.splice(i,1);if(active===i)active=-1;else if(active>i)active--;renderGallery();message.textContent='Label deleted'};
card.append(open,remove);gallery.append(card);
});
message.textContent=saved.length+' saved label(s) in this session';
}
document.getElementById('jlSaveLabel').onclick=()=>{saved.push(snapshot());active=saved.length-1;renderGallery();gallery.lastElementChild?.scrollIntoView({block:'nearest',inline:'end',behavior:'smooth'})};
document.getElementById('jlNewLabel').onclick=()=>{
  // Duplicate the most recently saved label, or current canvas if none are saved.
  const source=saved.length?saved[saved.length-1].layout:model;
  const copy=JSON.parse(JSON.stringify(source));
  copy.name=(source.name||'Untitled label')+' - Copy';
  clearTimeout(updateTimer);
  active=-1;
  window.JLLabelEditor.loadLayout(copy);
  saved.push(snapshot());
  active=saved.length-1;
  renderGallery();
  gallery.lastElementChild?.scrollIntoView({block:'nearest',inline:'end',behavior:'smooth'});
  message.textContent='Created label '+saved.length+' from the latest label. You can edit it now.';
};
document.getElementById('jlUpdateLabel').onclick=()=>{if(active<0){message.textContent='Select a saved label first';return}saved[active]=snapshot();renderGallery();message.textContent='Saved changes'};
// Synchronize the active saved label while typing, dragging, or changing styling.
function synchronizeActive(){
 if(selecting || active<0 || !saved[active])return;
 saved[active]=snapshot();
 const card=gallery.children[active];
 if(!card)return;
 const preview=card.querySelector('.jl-gallery-preview');
 const label=card.querySelector('.jl-gallery-name');
 if(preview){
   const svg=new DOMParser().parseFromString(saved[active].svg,'image/svg+xml').documentElement;
   if(svg.nodeName.toLowerCase()==='svg')preview.replaceChildren(document.importNode(svg,true));
 }
 if(label)label.textContent=saved[active].name;
 updateIndicator();
}
document.addEventListener('jl:label-changed',()=>{
 if(selecting || active<0)return;
 updateIndicator();
 clearTimeout(updateTimer);
 updateTimer=setTimeout(synchronizeActive,90);
});
JLPrintSheet.init(()=>{synchronizeActive();return saved.length?saved.map(s=>({svg:s.svg})):[{svg:renderedSvg()}]});
renderGallery();
})();