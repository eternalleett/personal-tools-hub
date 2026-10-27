/* Multi-label print batch.
 * Each label copy preserves editable JSON and can be reopened for modification.
 * A saved copy renders at the time it was saved to preserve its appearance.
 */
(function(){
  const panel=document.getElementById('jlPaper').closest('.jl-print-panel');
  const controls=document.createElement('div');controls.className='bar';
  const duplicate=document.createElement('button');duplicate.type='button';duplicate.textContent='+ Duplicate current label';
  const update=document.createElement('button');update.type='button';update.textContent='Update selected copy';
  const clear=document.createElement('button');clear.type='button';clear.textContent='Clear saved copies';
  const chooser=document.createElement('select');chooser.setAttribute('aria-label','Choose saved label copy');
  chooser.style.maxWidth='100%';
  controls.append(duplicate,update,clear);
  panel.prepend(controls,chooser);
  const message=document.createElement('p');message.className='hint';chooser.after(message);
  let saved=[],active=-1;
  const capture=()=>({layout:JSON.parse(JSON.stringify(model)),svg:renderedSvg()});
  function drawList(){
    chooser.replaceChildren(new Option('Current unsaved label','-1'));
    saved.forEach((_,i)=>chooser.add(new Option('Saved label '+(i+1),String(i))));
    chooser.value=String(active);
    message.textContent=saved.length+' saved editable label copies. Select one to edit.';
  }
  duplicate.onclick=()=>{
    saved.push(capture());active=saved.length-1;
    // Copy retains the currently visible layout; modify it and click update.
    drawList();
  };
  update.onclick=()=>{
    if(active<0){message.textContent='Select a saved label first';return}
    saved[active]=capture();drawList();
  };
  clear.onclick=()=>{saved=[];active=-1;drawList()};
  chooser.onchange=()=>{
    active=Number(chooser.value);
    if(active>=0){load(JSON.parse(JSON.stringify(saved[active].layout)));message.textContent='Loaded copy '+(active+1)+'; edit the canvas and click Update selected copy.'}
  };
  JLPrintSheet.init(()=>{
    const result=saved.map(entry=>({svg:entry.svg}));
    result.push({svg:renderedSvg()});
    return result;
  });
  drawList();
})();