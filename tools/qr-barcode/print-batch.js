/* Horizontal QR/barcode collection with save, edit, create and delete. */
(()=>{
'use strict';
const panel=document.getElementById('preview').closest('.panel'),anchor=panel.querySelector('#singleResult');
const section=document.createElement('section');section.className='jl-collection';
section.innerHTML='<div class="jl-collection-header"><strong>My QR / barcodes</strong><div class="jl-collection-actions"><button id="jlSaveCode" type="button">Save current</button><button id="jlNewCode" type="button" class="alt">+ New code</button><button id="jlUpdateCode" type="button" class="alt">Update selected</button></div></div><div id="jlCodeGallery" class="jl-gallery"></div><p id="jlCodeMessage" class="hint"></p>';
panel.insertBefore(section,anchor);
const gallery=document.getElementById('jlCodeGallery'),info=document.getElementById('jlCodeMessage');
let saved=[],active=-1;
function capture(){const o=opts();return{value:document.getElementById('payload').value,label:document.getElementById('caption').value,type:o.type,options:{...o,ecc:window.JL_WIFI_MODE==='wifi'?'H':o.ecc},logo:window.JL_WIFI_MODE==='wifi'?window.JLWiFi.logo:(window.JL_QR_LOGO||null)}}
function svgFor(record){const old=window.JL_QR_LOGO;try{window.JL_QR_LOGO=record.logo;return makeSvg(record.value,record.label,record.type,record.options)}finally{window.JL_QR_LOGO=old}}
function draw(){
gallery.replaceChildren();
saved.forEach((r,i)=>{const card=document.createElement('div');card.className='jl-gallery-card'+(i===active?' active':'');const open=document.createElement('button');open.type='button';open.className='jl-gallery-open';const preview=document.createElement('div');preview.className='jl-gallery-preview';try{preview.innerHTML=svgFor(r)}catch(e){preview.textContent='Invalid code'}const label=document.createElement('span');label.className='jl-gallery-name';label.textContent=(r.type.toUpperCase()+'  |  '+(r.label||r.value)).slice(0,55);open.append(preview,label);open.onclick=()=>{active=i;document.getElementById('singleTab').click();document.getElementById('payload').value=r.value;document.getElementById('caption').value=r.label;document.getElementById('type').value=r.type;window.JL_QR_LOGO=r.logo;if(!(window.JLWiFi?.restore(r.value))){window.JL_WIFI_MODE='text';document.getElementById('qrMode').value='text';document.getElementById('wifiFields').hidden=true;document.getElementById('normalPayload').hidden=false;render();}draw();info.textContent='Editing selected item; click Update selected to save.'};const del=document.createElement('button');del.type='button';del.className='jl-gallery-delete';del.textContent='×';del.title='Delete code';del.setAttribute('aria-label','Delete '+(r.label||r.value));del.onclick=()=>{saved.splice(i,1);if(active===i)active=-1;else if(active>i)active--;draw()};card.append(open,del);gallery.append(card)});
info.textContent=saved.length+' saved codes for print sheets';
}
document.getElementById('jlSaveCode').onclick=()=>{saved.push(capture());active=saved.length-1;draw();gallery.lastElementChild?.scrollIntoView({block:'nearest',inline:'end',behavior:'smooth'})};
document.getElementById('jlNewCode').onclick=()=>{active=-1;document.getElementById('singleTab').click();document.getElementById('payload').value='';document.getElementById('caption').value='';window.JL_QR_LOGO=null;window.JL_WIFI_MODE='text';document.getElementById('qrMode').value='text';document.getElementById('wifiFields').hidden=true;document.getElementById('normalPayload').hidden=false;render();draw()};
document.getElementById('jlUpdateCode').onclick=()=>{if(active<0)return info.textContent='Select a saved item first';saved[active]=capture();draw()};
JLPrintSheet.init(()=>{const arr=saved.map(r=>({svg:svgFor(r)}));if(mode==='bulk'&&items.length)arr.push(...items.map(i=>({svg:i.svg})));if(!arr.length&&singleSvg)arr.push({svg:singleSvg});return arr});
draw();
})();