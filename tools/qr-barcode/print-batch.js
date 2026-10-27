/* QR collection for printing: existing CSV/text bulk entries and user duplicates. */
(function(){
  let copies=[];
  const box=document.createElement('div');
  box.className='bar';
  const duplicate=document.createElement('button');duplicate.type='button';duplicate.textContent='+ Duplicate current QR';
  const clear=document.createElement('button');clear.type='button';clear.textContent='Clear duplicates';
  box.append(duplicate,clear);
  document.getElementById('jlPaper').closest('.jl-print-panel').prepend(box);
  const status=document.createElement('p');status.className='hint';box.after(status);
  duplicate.onclick=()=>{const o=opts();if(!document.getElementById('payload').value.trim())return;copies.push({value:document.getElementById('payload').value,label:document.getElementById('caption').value,type:o.type,options:{...o}});status.textContent=copies.length+' saved duplicates. Change the input to create variations.'};
  clear.onclick=()=>{copies=[];status.textContent='Duplicates cleared'};
  JLPrintSheet.init(()=>{
    const o=opts();
    const list=copies.map(x=>({svg:makeSvg(x.value,x.label,x.type,x.options)}));
    if(mode==='bulk'&&items.length)list.push(...items.map(x=>({svg:x.svg})));
    else if(singleSvg)list.push({svg:singleSvg});
    return list;
  });
})();