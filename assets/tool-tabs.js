/* Shared in-page function finder and print-sheet tab switcher. */
(()=>{'use strict';const tabs=document.querySelector('.jl-view-tabs'),sheet=document.querySelector('.jl-sheet-tab');if(!tabs||!sheet)return;
const root=document.querySelector('.page')||document.querySelector('.wrap')||document.body;
const editor= tabs.nextElementSibling;
if(!editor)return;
// Move print sheet from its nested editor panel into an independent sibling view.
tabs.parentElement.insertBefore(sheet,editor.nextSibling);
function show(which){
 const print=which==='sheets';editor.hidden=print;sheet.hidden=!print;root.classList.toggle('jl-sheet-open',print);
 tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('jl-tab-active',b.dataset.view===which));
}
tabs.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>show(b.dataset.view)));
show('editor');
})();