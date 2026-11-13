(()=>{
'use strict';
const $=id=>document.getElementById(id),items=[];let chosen=null,busy=false;
const valid=new Set(['pdf','docx','xls','xlsx','csv','tsv','html','htm','txt','md','markdown','json','xml','pptx','png','jpg','jpeg','webp','bmp','gif','svg','log','yaml','yml']);
const extension=n=>(n.split('.').pop()||'').toLowerCase();
const basename=n=>n.replace(/\.[^.]+$/,'').replace(/[\\/\x00-\x1f]/g,'_')||'document';
const escapeCell=v=>String(v??'').replace(/\|/g,'\\|').replace(/\r?\n/g,'<br>').trim();
const pause=()=>new Promise(r=>setTimeout(r,0));
const decode=b=>new TextDecoder().decode(b);
const completed=()=>items.filter(x=>x.status==='done');
function sync(){
const done=completed().length,fail=items.filter(x=>x.status==='error').length;
$('summary').textContent=items.length+' file(s) · '+done+' converted · '+fail+' failed'+(busy?' · processing':'');
$('fileCount').textContent=String(items.length);
$('convert').disabled=busy||!items.some(x=>x.status!=='done'&&valid.has(extension(x.file.name)));
$('exportZip').disabled=busy||!done;
$('exportCombined').disabled=busy||!done;
$('clear').disabled=busy||!items.length;
$('downloadOne').disabled=busy||!chosen||chosen.status!=='done';
$('copy').disabled=!chosen||chosen.status!=='done';
}
function render(){
const host=$('queue');host.replaceChildren();
if(!items.length){const p=document.createElement('p');p.className='empty';p.textContent='Import files to see them listed here.';host.append(p);}
for(const x of items){
const card=document.createElement('article');card.className='file';
const head=document.createElement('div');head.className='head';
const info=document.createElement('div'),name=document.createElement('div'),size=document.createElement('div'),state=document.createElement('span');
name.className='name';name.textContent=x.file.name;
size.className='meta';size.textContent=(x.file.size/1024).toFixed(1)+' KB'+(x.status==='done'?' · '+basename(x.file.name)+'.md':'');
info.append(name,size);state.className='status '+(x.status==='done'?'done':x.status==='error'?'error':'');state.textContent=x.label;head.append(info,state);
const track=document.createElement('div'),fill=document.createElement('div');track.className='track';track.setAttribute('role','progressbar');track.setAttribute('aria-label',x.file.name+' progress');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');track.setAttribute('aria-valuenow',String(x.progress));fill.className='fill '+(x.status==='done'?'done':x.status==='error'?'error':'');fill.style.width=x.progress+'%';track.append(fill);
const actions=document.createElement('div');actions.className='file-actions';
function button(label,fn,secondary=false){const b=document.createElement('button');b.type='button';b.textContent=label;if(secondary)b.className='secondary';b.disabled=busy;b.addEventListener('click',fn);actions.append(b);}
if(x.status==='done'){button(chosen===x?'Viewing':'Preview',()=>select(x),true);button('Download .md',()=>downloadOne(x));}
if(x.status==='error'){const e=document.createElement('span');e.className='meta';e.textContent=x.error;actions.append(e);}
button('Remove',()=>{if(busy)return;items.splice(items.indexOf(x),1);if(chosen===x){chosen=null;$('preview').value='';$('previewInfo').textContent='Select a converted file to preview.';}render();},true);
card.append(head,track,actions);host.append(card);
}sync();
}
function update(x,status,progress,label){x.status=status;x.progress=Math.max(0,Math.min(100,Math.round(progress)));x.label=label;render();}
function add(files){if(busy)return;for(const file of files){const ok=valid.has(extension(file.name));items.push({file,status:ok?'queued':'error',progress:0,label:ok?'Queued':'Unsupported',error:ok?'':'Unsupported file type',md:''});}render();}
const input=$('fileInput'),drop=$('dropzone');input.addEventListener('change',()=>{add(input.files);input.value='';});
for(const evt of ['dragenter','dragover'])drop.addEventListener(evt,e=>{e.preventDefault();drop.classList.add('drag');});
for(const evt of ['dragleave','drop'])drop.addEventListener(evt,e=>{e.preventDefault();drop.classList.remove('drag');});
drop.addEventListener('drop',e=>add(e.dataTransfer.files));drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input.click();}});
$('clear').onclick=()=>{if(busy)return;items.length=0;chosen=null;$('preview').value='';render();};
function select(x){chosen=x;$('preview').value=x.md;$('previewInfo').textContent=x.file.name+' · '+x.md.length.toLocaleString()+' characters';render();}
function read(x){return new Promise((resolve,reject)=>{const r=new FileReader();r.onprogress=e=>{if(e.lengthComputable)update(x,'reading',Math.min(15,15*e.loaded/e.total),'Reading '+Math.round(e.loaded/e.total*100)+'%');};r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error||Error('File read failed'));r.readAsArrayBuffer(x.file);});}
function htmlMd(html){if(!window.TurndownService)throw Error('Markdown library unavailable');const svc=new TurndownService({headingStyle:'atx',codeBlockStyle:'fenced'});svc.addRule('unsafe',{filter:['script','style','noscript','iframe','form'],replacement:()=>''});return svc.turndown(html);}
function table(rows){if(!rows.length)return '(Empty table)';const width=Math.max(1,...rows.map(r=>r.length));const line=r=>'| '+Array.from({length:width},(_,i)=>escapeCell(r[i])).join(' | ')+' |';return [line(rows[0]),'| '+Array(width).fill('---').join(' | ')+' |',...rows.slice(1).map(line)].join('\n');}
function csv(text,separator){const rows=[];let row=[],value='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){value+='"';i++;}else if(c==='"')quoted=false;else value+=c;}else if(c==='"')quoted=true;else if(c===separator){row.push(value);value='';}else if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);rows.push(row);row=[];value='';}else value+=c;}if(row.length||value!==''){row.push(value);rows.push(row);}return table(rows);}
function sheets(buf,x){if(!window.XLSX)throw Error('Spreadsheet library unavailable');const book=XLSX.read(buf,{type:'array',cellDates:true});return book.SheetNames.map((n,i)=>{update(x,'converting',20+65*(i+1)/book.SheetNames.length,'Sheet '+(i+1)+'/'+book.SheetNames.length);return '## Sheet: '+n+'\n\n'+table(XLSX.utils.sheet_to_json(book.Sheets[n],{header:1,defval:'',raw:false}));}).join('\n\n');}
let ocrWorker;
async function recognize(blob,x){if(!window.Tesseract)throw Error('OCR library unavailable');update(x,'converting',45,'Recognizing text');if(!ocrWorker)ocrWorker=await Tesseract.createWorker('eng');const res=await ocrWorker.recognize(blob);return res.data.text.trim();}
async function pdf(buf,x){if(!window.pdfjsLib)throw Error('PDF library unavailable');pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';const doc=await pdfjsLib.getDocument({data:new Uint8Array(buf)}).promise;try{const result=[];for(let i=1;i<=doc.numPages;i++){const page=await doc.getPage(i),content=await page.getTextContent();const lines=[];let current='',lastY=null;for(const t of content.items){if(typeof t.str!=='string')continue;const y=t.transform?.[5];if(lastY!==null&&Math.abs(y-lastY)>3){if(current.trim())lines.push(current.trim());current='';}current+=t.str+(t.hasEOL?'\n':' ');lastY=y;}if(current.trim())lines.push(current.trim());let extracted=lines.join('\n').trim();if($('ocr').checked&&extracted.length<40){const v=page.getViewport({scale:1.6}),canvas=document.createElement('canvas');canvas.width=Math.ceil(v.width);canvas.height=Math.ceil(v.height);await page.render({canvasContext:canvas.getContext('2d'),viewport:v}).promise;const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));if(blob)extracted=await recognize(blob,x)||extracted;canvas.width=canvas.height=0;}result.push(($('pageHeadings').checked?'## Page '+i+'\n\n':'')+(extracted||'(No text found)'));update(x,'converting',20+70*i/doc.numPages,'Page '+i+'/'+doc.numPages);await pause();}return result.join('\n\n---\n\n');}finally{await doc.destroy();}}
async function slides(buf,x){if(!window.JSZip)throw Error('ZIP library unavailable');const zip=await JSZip.loadAsync(buf),paths=Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b)=>+a.match(/slide(\d+)/)[1]-+b.match(/slide(\d+)/)[1]);if(!paths.length)throw Error('No slides found');const result=[];for(let i=0;i<paths.length;i++){const xml=new DOMParser().parseFromString(await zip.file(paths[i]).async('string'),'text/xml'),ps=[...xml.getElementsByTagName('*')].filter(e=>e.localName==='p');const text=ps.map(p=>[...p.getElementsByTagName('*')].filter(e=>e.localName==='t').map(e=>e.textContent).join('')).filter(Boolean).join('\n');result.push('## Slide '+(i+1)+'\n\n'+(text||'(No text found)'));update(x,'converting',20+70*(i+1)/paths.length,'Slide '+(i+1)+'/'+paths.length);await pause();}return result.join('\n\n');}
async function convert(buf,x){const t=extension(x.file.name);update(x,'converting',17,'Extracting content');switch(t){
case 'pdf':return pdf(buf,x);
case 'docx':if(!window.mammoth)throw Error('Word library unavailable');return htmlMd((await mammoth.convertToHtml({arrayBuffer:buf})).value);
case 'xls':case 'xlsx':return sheets(buf,x);
case 'pptx':return slides(buf,x);
case 'csv':return csv(decode(buf).replace(/^\uFEFF/,''),',');
case 'tsv':return csv(decode(buf).replace(/^\uFEFF/,''),'\t');
case 'html':case 'htm':return htmlMd(decode(buf));
case 'png':case 'jpg':case 'jpeg':case 'webp':case 'bmp':case 'gif':if(!$('ocr').checked)throw Error('Enable OCR for images');return recognize(x.file,x);
case 'svg':return [...new DOMParser().parseFromString(decode(buf),'image/svg+xml').querySelectorAll('text,tspan')].map(n=>n.textContent.trim()).filter(Boolean).join('\n')||'(SVG has no text nodes)';
case 'json':return '```json\n'+JSON.stringify(JSON.parse(decode(buf)),null,2)+'\n```'; 
case 'xml':return '```xml\n'+decode(buf)+'\n```';
case 'yaml':case 'yml':return '```yaml\n'+decode(buf)+'\n```';
case 'md':case 'markdown':case 'txt':case 'log':return decode(buf);
default:throw Error('Unsupported file type');
}}
function wrapped(x,text){return $('metadata').checked?'---\nsource: '+JSON.stringify(x.file.name)+'\nformat: '+JSON.stringify(extension(x.file.name))+'\nsize_bytes: '+x.file.size+'\n---\n\n# '+basename(x.file.name)+'\n\n'+text.trim()+'\n':text.trim()+'\n';}
$('convert').onclick=async()=>{if(busy)return;busy=true;sync();for(const x of items){if(x.status==='done'||!valid.has(extension(x.file.name)))continue;try{update(x,'reading',0,'Reading');const bytes=await read(x);x.md=wrapped(x,await convert(bytes,x));update(x,'done',100,'✓ Converted');if(!chosen||chosen.status!=='done')select(x);}catch(e){x.error=e instanceof Error?e.message:String(e);update(x,'error',x.progress,'Failed');}await pause();}busy=false;render();};
function save(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);}
function downloadOne(x){if(x.status!=='done')return;update(x,'exporting',95,'Exporting');try{save(new Blob([x.md],{type:'text/markdown;charset=utf-8'}),basename(x.file.name)+'.md');update(x,'done',100,'✓ Download started');}catch(e){x.error=String(e);update(x,'error',95,'Export failed');}}
$('downloadOne').onclick=()=>{if(chosen)downloadOne(chosen);};
$('copy').onclick=async()=>{if(chosen)try{await navigator.clipboard.writeText(chosen.md);$('previewInfo').textContent='Copied Markdown';}catch(e){$('previewInfo').textContent='Clipboard unavailable; copy from preview.';}};
$('exportCombined').onclick=()=>{const docs=completed();if(busy||!docs.length)return;const text=docs.map(x=>'<!-- Source: '+x.file.name.replace(/-->/g,'')+' -->\n\n'+x.md).join('\n\n---\n\n');save(new Blob([text],{type:'text/markdown;charset=utf-8'}),'combined-documents.md');};
$('exportZip').onclick=async()=>{const docs=completed();if(busy||!docs.length)return;if(!window.JSZip){$('summary').textContent='ZIP library unavailable';return;}busy=true;const zip=new JSZip(),names=new Map();for(const x of docs){const base=basename(x.file.name),n=names.get(base)||0;names.set(base,n+1);zip.file(base+(n?'-'+(n+1):'')+'.md',x.md);update(x,'exporting',0,'Preparing ZIP');}try{const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'},m=>{for(const x of docs)update(x,'exporting',Math.min(99,m.percent),'Packing '+Math.floor(m.percent)+'%');});save(blob,'markdown-files.zip');for(const x of docs)update(x,'done',100,'✓ ZIP download started');}catch(e){for(const x of docs){x.error=String(e);update(x,'error',x.progress,'ZIP failed');}}finally{busy=false;render();}};
render();
})();