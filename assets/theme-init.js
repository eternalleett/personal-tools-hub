/* Apply saved colors before styles render to prevent light-mode flashing. */
(function(){
  try {
    const state=JSON.parse(localStorage.getItem('jl-theme')||'{}');
    const dark=!!state.dark;
    if(dark) document.documentElement.classList.add('jl-dark');
    const defaults=dark?{top:'#080e1d',menu:'#111c32',main:'#101827',accent:'#8198ff'}:{top:'#14213b',menu:'#1d2d48',main:'#f4f6fb',accent:'#4a5ed5'};
    const palette={...defaults,...(state.colors?.[dark?'dark':'light']||(!dark?state:{}))};
    for(const k of [...Object.keys(defaults),'surface','ink','muted','border','link']) if(typeof palette[k]==='string'&&/^#[0-9a-f]{6}$/i.test(palette[k])) document.documentElement.style.setProperty('--jl-'+k,palette[k]);
    const fonts={system:'system-ui,-apple-system,"Segoe UI",sans-serif',nunito:'"Nunito",system-ui,sans-serif',quicksand:'"Quicksand",system-ui,sans-serif',rubik:'"Rubik",system-ui,sans-serif',atkinson:'"Atkinson Hyperlegible",system-ui,sans-serif'};
    document.documentElement.style.setProperty('--jl-font',fonts[state.font]||fonts.system);
    document.documentElement.style.colorScheme=dark?'dark':'light';
  } catch(_){}
})();