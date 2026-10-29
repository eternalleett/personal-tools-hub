/* JL Toolkit Wi-Fi QR: standard WIFI:T:...; payload and built-in logo. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const escapeWifi = value => String(value ?? '').replace(/[\\;,:"]/g, '\\$&');
  const wifiSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="none" stroke="#14213b" stroke-width="9" stroke-linecap="round"><path d="M14 39 Q50 8 86 39"/><path d="M27 56 Q50 36 73 56"/><path d="M40 72 Q50 64 60 72"/></g><circle cx="50" cy="87" r="6.5" fill="#14213b"/></svg>';
  const logo = 'data:image/svg+xml;base64,' + btoa(wifiSvg);
  window.JL_WIFI_MODE = 'text';
  function payload(data) {
    const ssid = String(data?.ssid ?? $('wifiSsid').value);
    const security = data?.security ?? $('wifiSecurity').value;
    const password = String(data?.password ?? $('wifiPassword').value);
    const hidden = data?.hidden ?? $('wifiHidden').checked;
    if (!ssid.trim()) throw Error('Enter a Wi-Fi name (SSID)');
    if (security !== 'nopass' && !password) throw Error('Enter the Wi-Fi password');
    if (!['WPA','WEP','nopass'].includes(security)) throw Error('Unsupported security type');
    return 'WIFI:T:' + security + ';S:' + escapeWifi(ssid) +
      (security === 'nopass' ? '' : ';P:' + escapeWifi(password)) +
      ';H:' + (hidden === true || hidden === 'true' || hidden === '1' ? 'true' : 'false') + ';;';
  }
  window.JLWiFi = { payload, logo };
  function setMode(next) {
    window.JL_WIFI_MODE = next;
    $('qrMode').value = next;
    $('wifiFields').hidden = next !== 'wifi';
    $('normalPayload').hidden = next === 'wifi';
    $('type').value = 'qr';
    if (next === 'wifi') {
      $('ecc').value = 'H';
      if (!$('caption').value || $('caption').value === 'Sample code')
        $('caption').value = 'Wi-Fi: ' + $('wifiSsid').value;
    }
    render();
  }
  $('qrMode').onchange = () => setMode($('qrMode').value);
  for (const id of ['wifiSsid','wifiPassword','wifiSecurity','wifiHidden']) {
    $(id).addEventListener('input', () => {
      if (id === 'wifiSecurity') {
        $('wifiPassword').disabled = $('wifiSecurity').value === 'nopass';
      }
      if (window.JL_WIFI_MODE === 'wifi') render();
    });
  }
  $('wifiShowPassword').onchange = () => {
    $('wifiPassword').type = $('wifiShowPassword').checked ? 'text' : 'password';
  };
  // Reuses the existing RFC-4180-compatible CSV row parser.
  $('wifiCsv').onchange = async event => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const records = parseCsv(await file.text());
      if (records.length && records[0][0]?.trim().toLowerCase() === 'ssid') records.shift();
      imported = records.filter(r => r.some(x => x.trim())).map(r => ({
        value: payload({ssid:r[0],password:r[1],security:normalizeSecurity(r[2]),hidden:(r[3]||'').trim().toLowerCase()}),
        label:r[4] || 'Wi-Fi: ' + r[0], type:'qr', wifi:true
      }));
      window.JL_WIFI_MODE = 'text';
      $('qrMode').value = 'text';$('wifiFields').hidden = true;$('normalPayload').hidden=false;
      tab('bulk');
      status('Loaded '+imported.length+' Wi-Fi QR code(s). Each will use the Wi-Fi icon.');
    } catch (error) { status('Wi-Fi CSV error: '+error.message); }
  };
  function normalizeSecurity(v) {
    const x = String(v || 'WPA').trim().toLowerCase();
    if (['none','open','nopass'].includes(x)) return 'nopass';
    if (x === 'wep') return 'WEP';
    if (['wpa','wpa2','wpa3','wpa/wpa2','wpa2/wpa3'].includes(x)) return 'WPA';
    throw Error('Unknown Wi-Fi security type: '+v);
  }
  function parseCsv(text) {
    const out=[];let row=[],cell='',quote=false;
    text=String(text).replace(/^\uFEFF/,'');
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(quote){if(c==='"'&&text[i+1]==='"'){cell+='"';i++}else if(c==='"')quote=false;else cell+=c}
      else if(c==='"')quote=true;
      else if(c===','){row.push(cell);cell=''}
      else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);out.push(row);row=[];cell=''}
      else cell+=c;
    }
    if(quote)throw Error('CSV has an unclosed quote');
    row.push(cell);if(row.some(c=>c.trim()))out.push(row);
    return out;
  }
  // Allows saved QR records to restore the Wi-Fi editor settings.
  window.JLWiFi.restore = value => {
    if (!value.startsWith('WIFI:')) return false;
    const fields={};let key='',val='',escaped=false,readingKey=true;
    for(const c of value.slice(5)){
      if(escaped){(readingKey?key+=c:val+=c);escaped=false;continue}
      if(c==='\\'){escaped=true;continue}
      if(c===':'&&readingKey){readingKey=false;continue}
      if(c===';'){if(key)fields[key]=val;key='';val='';readingKey=true;continue}
      if(readingKey)key+=c;else val+=c;
    }
    $('wifiSsid').value=fields.S||'';
    $('wifiPassword').value=fields.P||'';
    $('wifiSecurity').value=fields.T||'WPA';
    $('wifiHidden').checked=fields.H==='true';
    setMode('wifi');
    return true;
  };
})();
