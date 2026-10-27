/* Shared printable sheet utility for QR and label tools.
 * Input: [{svg: full SVG markup}] in order; output: paginated PDF or PNG preview.
 * All measurements are in millimetres; layout uses PDF vector-embedded PNGs.
 */
window.JLPrintSheet = (() => {
  const $ = id => document.getElementById(id);
  let getItems = () => [], lastPages = [];
  function config() {
    const select = $('jlPaper').value;
    const [width,height] = select === 'custom'
      ? [Number($('jlPaperW').value),Number($('jlPaperH').value)]
      : select.split(',').map(Number);
    const cols=Number($('jlCols').value),rows=Number($('jlRows').value);
    if(!(width>10&&height>10&&cols>0&&rows>0&&cols<=10&&rows<=10))throw Error('Invalid print dimensions');
    return {width,height,cols,rows,margin:Math.max(0,Number($('jlMargin').value)||0)};
  }
  async function raster(svg) {
    const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
    try {
      const img=new Image();
      await new Promise((ok,bad)=>{img.onload=ok;img.onerror=()=>bad(Error('Cannot render sheet item'));img.src=url});
      const canvas=document.createElement('canvas');
      canvas.width=img.naturalWidth||600;canvas.height=img.naturalHeight||400;
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      return canvas;
    } finally {URL.revokeObjectURL(url)}
  }
  async function generate() {
    const items=getItems();if(!items.length)throw Error('Add a code or label first');
    const o=config(),widthPx=Math.round(o.width*3),heightPx=Math.round(o.height*3);
    const cellW=(o.width-2*o.margin)/o.cols,cellH=(o.height-2*o.margin)/o.rows;
    if(cellW<=0||cellH<=0)throw Error('Margin is larger than paper');
    let pages=[];
    for(let offset=0;offset<items.length;offset+=o.cols*o.rows){
      const canvas=document.createElement('canvas');canvas.width=widthPx;canvas.height=heightPx;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,widthPx,heightPx);
      for(let i=0;i<o.cols*o.rows&&offset+i<items.length;i++){
        const item=items[offset+i],src=await raster(item.svg);
        const c=i%o.cols,r=Math.floor(i/o.cols),scale=Math.min(cellW*3/src.width,cellH*3/src.height)*.92;
        const x=(o.margin+c*cellW)*3+(cellW*3-src.width*scale)/2;
        const y=(o.margin+r*cellH)*3+(cellH*3-src.height*scale)/2;
        ctx.drawImage(src,x,y,src.width*scale,src.height*scale);
      }
      pages.push(canvas);
      // Yield to UI between pages.
      await new Promise(ok=>setTimeout(ok,0));
    }
    lastPages=pages;
    const area=$('jlSheets');area.replaceChildren();
    pages.forEach((c,i)=>{const wrapper=document.createElement('div');wrapper.className='jl-sheet-preview';const head=document.createElement('small');head.textContent='Page '+(i+1);wrapper.append(head,c);area.append(wrapper)});
    $('jlSheetInfo').textContent=items.length+' items • '+pages.length+' page(s) • '+o.width+' × '+o.height+' mm • '+o.cols+' columns × '+o.rows+' rows';
  }
  async function downloadPdf() {
    if(!lastPages.length)await generate();
    if(!window.PDFLib)throw Error('PDF library could not load');
    const doc=await PDFLib.PDFDocument.create(),o=config();
    for(const canvas of lastPages){
      const png=await doc.embedPng(await new Promise(ok=>canvas.toBlob(ok,'image/png')).then(b=>b.arrayBuffer()));
      const w=o.width*72/25.4,h=o.height*72/25.4,page=doc.addPage([w,h]);
      page.drawImage(png,{x:0,y:0,width:w,height:h});
    }
    const bytes=await doc.save(),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
    const a=document.createElement('a');a.href=url;a.download='jl-toolkit-print-sheet.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),6000);
  }
  function init(provider) {
    getItems=provider;
    $('jlPreviewSheet').onclick=async()=>{try{$('jlSheetInfo').textContent='Preparing print preview…';await generate()}catch(e){$('jlSheetInfo').textContent=e.message}};
    $('jlExportSheet').onclick=async()=>{try{$('jlSheetInfo').textContent='Preparing PDF…';await generate();await downloadPdf();$('jlSheetInfo').textContent+=' • PDF exported'}catch(e){$('jlSheetInfo').textContent=e.message}};
    $('jlPaper').onchange=()=>{$('jlCustomPaper').hidden=$('jlPaper').value!=='custom';lastPages=[]};
    for(const id of ['jlCols','jlRows','jlMargin','jlPaperW','jlPaperH'])$(id).onchange=()=>lastPages=[];
  }
  return {init};
})();