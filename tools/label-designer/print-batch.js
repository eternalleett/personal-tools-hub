/* Horizontal saved-label gallery, editable cards and print collection. */
(()=>{
'use strict';
const canvasPanel=document.getElementById('stage').closest('.panel');
const strip=document.createElement('section');strip.className='jl-collection';
strip.innerHTML='<div class="jl-collection-header"><strong>My labels <span id="jlLabelCount" class="jl-label-count" aria-live="polite">0</span></strong><div class="jl-collection-actions"><button id="jlSaveLabel" type="button">Save current</button><button id="jlNewLabel" type="button" class="alt">+ New label</button><button id="jlUpdateLabel" type="button" class="alt">Update selected</button></div></div><div class="jl-gallery" id="jlLabelGallery" aria-label="Saved labels"></div><p class="hint" id="jlLabelMessage"></p>';
canvasPanel.insertBefore(strip,canvasPanel.querySelector('#stage'));
const gallery=strip.querySelector('#jlLabelGallery'),message=strip.querySelector('#jlLabelMessage');
let saved=[],active=-1;
const snapshot=()=>({layout:JSON.parse(JSON.stringify(model)),svg:renderedSvg(),name:model.name||'Untitled label'});
function renderGallery(){
document.getElementById('jlLabelCount').textContent=String(saved.length);
gallery.replaceChildren();
saved.forEach((entry,i)=>{
const card=document.createElement('div');card.className='jl-gallery-card'+(active===i?' active':'');
const open=document.createElement('button');open.type='button';open.className='jl-gallery-open';open.title='Edit '+entry.name;
const thumb=document.createElement('div');thumb.className='jl-gallery-preview';
const image=new DOMParser().parseFromString(entry.svg,'image/svg+xml').documentElement;
if(image.nodeName.toLowerCase()==='svg')thumb.append(document.importNode(image,true));
const name=document.createElement('span');name.className='jl-gallery-name';name.textContent=entry.name;open.append(thumb,name);
open.onclick=()=>{active=i;load(JSON.parse(JSON.stringify(entry.layout)));renderGallery();message.textContent='Editing '+entry.name+'. Select Update selected to save changes.'};
const remove=document.createElement('button');remove.type='button';remove.className='jl-gallery-delete';remove.title='Delete '+entry.name;remove.setAttribute('aria-label','Delete '+entry.name);remove.textContent='×';
remove.onclick=()=>{saved.splice(i,1);if(active===i)active=-1;else if(active>i)active--;renderGallery();message.textContent='Label deleted'};
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
  load(copy);
  saved.push(snapshot());
  active=saved.length-1;
  renderGallery();
  gallery.lastElementChild?.scrollIntoView({block:'nearest',inline:'end',behavior:'smooth'});
  message.textContent='Created label '+saved.length+' from the latest label. You can edit it now.';
};
document.getElementById('jlUpdateLabel').onclick=()=>{if(active<0){message.textContent='Select a saved label first';return}saved[active]=snapshot();renderGallery();message.textContent='Saved changes'};
JLPrintSheet.init(()=>saved.length?saved.map(s=>({svg:s.svg})):[{svg:renderedSvg()}]);
renderGallery();
})();