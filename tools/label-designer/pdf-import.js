/* PDF import into editable label text and optional flattened visual reference.
 * Uses PDF.js geometry. Vector drawings, QR and barcode values are not reconstructed.
 */
(()=>{'use strict';
const file=document.getElementById('pdfImport'),pageSelect=document.getElementById('pdfPage'),status=document.getElementById('pdfImportStatus'),convert=document.getElementById('pdfConvert');
let pdf=null;
async function open(){
 if(!window.pdfjsLib)throw Error('PDF.js did not load. Check network access.');
 const selected=file.files?.[0];if(!selected)return;
 status.textContent='Reading PDF…';
 pdf=await pdfjsLib.getDocument({data:new Uint8Array(await selected.arrayBuffer())}).promise;
 pageSelect.replaceChildren();
 for(let i=1;i<=pdf.numPages;i++)pageSelect.add(new Option('Page '+i,String(i)));
 status.textContent=pdf.numPages+' page(s) ready for conversion.';
}
file.addEventListener('change',()=>open().catch(e=>status.textContent='Import error: '+e.message));
convert.addEventListener('click',async()=>{
 try{
  if(!pdf)await open();
  if(!pdf)return;
  const page=await pdf.getPage(Number(pageSelect.value)||1);
  const viewport=page.getViewport({scale:1}),mm=25.4/72;
  const width=viewport.width*mm,height=viewport.height*mm;
  if(width<20||height<15||width>300||height>300)throw Error('Page dimensions must be within 20–300 mm wide and 15–300 mm high.');
  const text=await page.getTextContent(),elements=[];
  for(const item of text.items){
   if(!item.str?.trim())continue;
   const t=pdfjsLib.Util.transform(viewport.transform,item.transform);
   const h=Math.max(1,Math.min(40,Math.hypot(t[2],t[3])*mm));
   elements.push({type:'text',x:Math.max(0,t[4]*mm),y:Math.max(0,(t[5]-Math.hypot(t[2],t[3]))*mm),w:Math.max(1,Math.abs((item.width||20)*mm)),h:Math.max(1,h*1.25),text:item.str,fontSize:h,fontFamily:'sans-serif',color:'#111111'});
   if(elements.length>=450)break;
  }
  const layout={version:1,name:(file.files[0]?.name||'PDF').replace(/\.pdf$/i,'')+' - Page '+pageSelect.value,width,height,elements};
  if(document.getElementById('pdfBackground').checked){
   const vp=page.getViewport({scale:2}),canvas=document.createElement('canvas');canvas.width=Math.ceil(vp.width);canvas.height=Math.ceil(vp.height);
   await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;
   layout.backgroundImage=canvas.toDataURL('image/png');
  }
  window.JLLabelEditor.loadLayout(layout);
  status.textContent='Imported '+elements.length+' editable text fields. Background (if enabled) is a non-editable image; check overlapping text and placement.';
 }catch(e){status.textContent='Conversion failed: '+e.message}
});
})();