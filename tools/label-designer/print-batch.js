/* Managed label collection: thumbnails, layout names, editing, deletion and print sheets. */
(function(){
 const panel=document.getElementById('jlPaper').closest('.jl-print-panel');
 const controls=document.createElement('div');controls.className='bar';
 const saveBtn=document.createElement('button');saveBtn.textContent='Save current as new label';
 const updateBtn=document.createElement('button');updateBtn.textContent='Update selected label';
 controls.append(saveBtn,updateBtn);
 const list=document.createElement('div');list.className='jl-label-library';
 const note=document.createElement('p');note.className='hint';
 panel.prepend(controls,list,note);
 let records=[],active=-1;
 const snap=()=>({layout:JSON.parse(JSON.stringify(model)),svg:renderedSvg(),name:model.name||'Untitled Label'});
 function repaint(){
   list.replaceChildren();note.textContent=records.length+' saved labels in this session.';
   records.forEach((record,i)=>{
     const card=document.createElement('div');card.className='jl-label-item'+(i===active?' active':'');
     const preview=document.createElement('div');preview.className='jl-label-thumb';
     const svg=new DOMParser().parseFromString(record.svg,'image/svg+xml').documentElement;
     if(svg.nodeName.toLowerCase()==='svg')preview.append(document.importNode(svg,true));
     const content=document.createElement('div');const name=document.createElement('strong');name.textContent=record.name||'Untitled Label';
     const actions=document.createElement('div');actions.className='bar';
     const edit=document.createElement('button');edit.textContent='Edit';edit.className='alt';edit.onclick=()=>{active=i;load(JSON.parse(JSON.stringify(records[i].layout)));repaint()};
     const del=document.createElement('button');del.textContent='Delete';del.className='warn';del.onclick=()=>{records.splice(i,1);if(active===i)active=-1;else if(active>i)active--;repaint()};
     actions.append(edit,del);content.append(name,actions);card.append(preview,content);list.append(card);
   });
 }
 saveBtn.onclick=()=>{records.push(snap());active=records.length-1;repaint()};
 updateBtn.onclick=()=>{if(active<0){note.textContent='Choose Edit on a saved label first.';return}records[active]=snap();repaint()};
 JLPrintSheet.init(()=>records.length?records.map(x=>({svg:x.svg})):[{svg:renderedSvg()}]);
 repaint();
})();