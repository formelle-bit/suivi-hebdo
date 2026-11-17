/* Form'Elle - suivi hebdo : configuration et accès à l'API n8n */
var FE = {
  API: 'https://lynqacdemy.app.n8n.cloud/webhook',
  GET: '/formelle-suivi-api',
  POST: '/formelle-suivi-page'
};
function feParam(name) {
  var p = new URLSearchParams(location.search), out = '';
  p.forEach(function (v, k) { if (!out && k.toLowerCase() === name.toLowerCase()) out = v; });
  return out;
}
function feStore(k, v) { try { if (v === null) localStorage.removeItem(k); else if (v !== undefined) localStorage.setItem(k, v); return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
function feKey(askIfMissing) {
  var k = feParam('k');
  if (k) { feStore('fe_k', k); try { var u = new URL(location.href); u.searchParams.delete('k'); history.replaceState(null, '', u.toString()); } catch (e) {} return k; }
  k = feStore('fe_k');
  if (!k && askIfMissing) {
    k = (prompt("Code d'accès Form'Elle (demande-le à Ninie) :") || '').trim();
    if (k) feStore('fe_k', k);
  }
  return k;
}
async function feGet(params) {
  var k = feKey(true);
  var q = new URLSearchParams(Object.assign({}, params, { k: k, _: Date.now() }));
  var r = await fetch(FE.API + FE.GET + '?' + q.toString(), { cache: 'no-store' });
  var j = await r.json();
  if (j && j.ok === false && /acc[eè]s/i.test(j.error || '')) feStore('fe_k', null);
  return j;
}
function feEsc(s) {
  if (s === null || s === undefined || s === '') return '';
  var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML;
}
var FE_FLAG = '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="2.4" y1="1" x2="2.4" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M2.9 1.9C5.8 0.6 8.4 3.1 12.4 1.9V8.6C8.4 9.8 5.8 7.3 2.9 8.6V1.9Z" fill="currentColor"/></svg>';
function feFr(iso) { var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '/' + m[2] + '/' + m[1] : (iso || ''); }
