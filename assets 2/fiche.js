/* Form'Elle - fiche de suivi hebdomadaire */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var POINTS = [
    "Méthodologie / organisation du travail", "Compréhension du contenu théorique", "Technique pratique (gestes, produits)",
    "Préparation à la certification", "Gestion du temps / avancement du parcours", "Motivation / état d'esprit",
    "Utilisation de la plateforme Teachizy", "Questions administratives / financement"
  ];
  var DRAPEAUX = [
    ['Gris', 'Gris — Rien à signaler', "Se connecte bien, suit sur Teachizy, vient aux rendez-vous, s'investit, rend ses devoirs."],
    ['Bleu', 'Bleu — Léger retard', "Moins de 5 % de retard par rapport à l'attendu sur Teachizy — rien de grave, suit bien, se connecte, rendez-vous ok."],
    ['Jaune', 'Jaune — Retard non rattrapé', "Retard non rattrapé et/ou moins de 50 % de complétion Teachizy en semaine 2, et/ou 1 rendez-vous manqué, et/ou répond peu aux sollicitations, et/ou travaux non rendus."],
    ['Rouge', 'Rouge — Alerte critique', "Moins de 80 % de complétion Teachizy en semaine 3, et/ou ne répond plus du tout aux sollicitations, ne se connecte pas ou très peu."]
  ];
  var S = { contactId: feParam('contactId'), taskId: '', ctx: null, duree: '', modalite: '', drapeau: '', sigDeja: { att: false, prog: false }, sigCoche: { att: false, prog: false }, sent: false, loaded: false };
  var rdvDateParam = feParam('rdvDate');

  function msg(text, ok) { var m = $('msg'); m.textContent = text; m.className = ok ? 'ok' : 'err'; if (!ok) m.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  function status(text, kind) { var s = $('status'); s.textContent = text; s.className = 'recherche-status' + (kind ? ' ' + kind : ''); }
  function alertSection(id) { var el = $(id); if (!el) return; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('section-alert'); setTimeout(function () { el.classList.remove('section-alert'); }, 2000); }
  function show(id, on) { $(id).classList.toggle('hidden', !on); }
  function radioVal(name) { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }
  function setRadio(name, v) {
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (r) { r.checked = (r.value === v); r.closest('.radio-pill').classList.toggle('on', r.checked); });
  }
  function isRdv2Plus() { var v = $('numRdv').value; return !!v && v.charAt(0) !== '1'; }
  function setSections(enabled) {
    ['section-identite', 'section-suivi', 'section-devoirs', 'section-emargement', 'section-pct', 'section-drapeau', 'section-points', 'section-bilan', 'section-risque', 'section-prochain', 'section-motif'].forEach(function (id) { $(id).classList.toggle('disabled', !enabled); });
  }

  /* ---------- Construction des blocs ---------- */
  $('drapeauGrid').innerHTML = DRAPEAUX.map(function (d) {
    var c = d[0].toLowerCase();
    return '<label class="drapeau-option drapeau-' + c + '" data-d="' + d[0] + '"><input type="radio" name="drapeau" value="' + d[0] + '"><span class="drapeau-flag">' + FE_FLAG + '</span><span class="txt"><strong>' + d[1] + '</strong><span>' + d[2] + '</span></span></label>';
  }).join('');
  $('pointsGrid').innerHTML = POINTS.map(function (p, i) {
    return '<label class="checkbox-item" id="chk' + i + '"><input type="checkbox" value="' + feEsc(p) + '"> ' + feEsc(p) + '</label>';
  }).join('');

  function renderSignatures() {
    [['att', 'sig-attestation', "Attestation sur l'honneur"], ['prog', 'sig-programme', 'Programme de formation']].forEach(function (d) {
      var z = $(d[1]);
      if (S.sigDeja[d[0]]) z.innerHTML = '<div class="signature-item done"><span class="icon">✅</span><span class="txt">' + d[2] + ' — déjà signée</span></div>';
      else z.innerHTML = '<label class="signature-item' + (S.sigCoche[d[0]] ? ' checked' : '') + '"><input type="checkbox" ' + (S.sigCoche[d[0]] ? 'checked' : '') + ' data-sig="' + d[0] + '"><span class="txt">' + d[2] + " signée aujourd'hui</span></label>";
    });
    document.querySelectorAll('[data-sig]').forEach(function (cb) {
      cb.addEventListener('change', function () { S.sigCoche[cb.dataset.sig] = cb.checked; cb.closest('.signature-item').classList.toggle('checked', cb.checked); });
    });
  }
  renderSignatures();

  /* ---------- Interactions ---------- */
  document.querySelectorAll('[data-duree]').forEach(function (b) { b.addEventListener('click', function () { setDuree(b.dataset.duree); }); });
  document.querySelectorAll('[data-modalite]').forEach(function (b) { b.addEventListener('click', function () { setModalite(b.dataset.modalite); }); });
  function setDuree(v) { S.duree = v; document.querySelectorAll('[data-duree]').forEach(function (b) { b.classList.toggle('active', b.dataset.duree === v); }); }
  function setModalite(v) { S.modalite = v; document.querySelectorAll('[data-modalite]').forEach(function (b) { b.classList.toggle('active', b.dataset.modalite === v); }); }
  setDuree('30 min');

  document.querySelectorAll('input[type=radio]').forEach(function (r) {
    r.addEventListener('change', function () {
      document.querySelectorAll('input[name="' + r.name + '"]').forEach(function (x) { x.closest('.radio-pill, .drapeau-option') && x.closest('.radio-pill, .drapeau-option').classList.toggle(x.closest('.drapeau-option') ? 'selected' : 'on', x.checked); });
      if (r.name === 'motif') { show('motifDateWrap', r.value === 'Reporté à sa demande'); show('motifAutreWrap', r.value === 'Autre'); }
      if (r.name === 'prochain') show('prochainDateWrap', r.value === 'date');
      if (r.name === 'risque') show('risqueActionWrap', r.value === 'Oui');
    });
  });
  document.querySelectorAll('#pointsGrid input').forEach(function (cb) { cb.addEventListener('change', function () { cb.closest('.checkbox-item').classList.toggle('checked', cb.checked); }); });
  $('nonRealise').addEventListener('change', function () {
    var nr = $('nonRealise').checked;
    $('nonRealise').closest('.signature-item').classList.toggle('checked', nr);
    show('section-motif', nr); show('blocRealise', !nr); show('section-devoirs', !nr && isRdv2Plus());
  });
  $('numRdv').addEventListener('change', function () { show('section-devoirs', !$('nonRealise').checked && isRdv2Plus()); });

  /* ---------- Historique ---------- */
  function badge(d) { return d ? '<span class="hist-drapeau-badge drapeau-' + d.toLowerCase() + '">' + FE_FLAG + d + '</span>' : ''; }
  function renderHistory(h) {
    $('historique-full').innerHTML = ''; $('historique-full').classList.remove('visible');
    if (!h || !h.length) { $('hist-empty').textContent = "Aucun suivi précédent enregistré ici (les anciens suivis sont dans l'ancien outil)."; show('hist-empty', true); $('hist-summary').innerHTML = ''; show('btnHist', false); return; }
    show('hist-empty', false);
    var l = h[0];
    $('hist-summary').innerHTML = '<div class="hist-summary"><div class="hist-top">' + badge(l.drapeau) + '<span class="hist-pct">' + (l.pct !== null && l.pct !== undefined && l.pct !== '' ? l.pct + ' %' : '') + '</span><span class="hist-date">Dernier suivi : ' + feFr(l.dateSuivi) + ' · ' + feEsc(l.numRdv) + (l.formatrice ? ' · ' + feEsc(l.formatrice) : '') + '</span></div>' +
      (l.difficultes ? '<div class="hist-line"><b>Difficultés :</b> ' + feEsc(l.difficultes) + '</div>' : '') +
      (l.objectifs ? '<div class="hist-line"><b>Objectifs fixés :</b> ' + feEsc(l.objectifs) + '</div>' : '') +
      (l.devoirs ? '<div class="hist-line"><b>Devoir :</b> ' + feEsc(l.devoirs) + '</div>' : '') + '</div>';
    $('historique-full').innerHTML = h.map(function (r) {
      return '<div class="hist-card"><div class="hist-card-head">' + badge(r.drapeau) + '<span>' + feFr(r.dateSuivi) + ' · ' + feEsc(r.numRdv) + '</span>' + (r.pct !== null && r.pct !== undefined && r.pct !== '' ? '<span class="pct">' + r.pct + ' %</span>' : '') + '</div>' +
        (r.rdvRealise === 'Non' ? '<div class="hist-line"><b>RDV non réalisé :</b> ' + feEsc(r.motif) + '</div>' : '') +
        (r.pointsCoches ? '<div class="hist-line"><b>Points :</b> ' + feEsc(r.pointsCoches) + '</div>' : '') +
        (r.difficultes ? '<div class="hist-line"><b>Difficultés :</b> ' + feEsc(r.difficultes) + '</div>' : '') +
        (r.objectifs ? '<div class="hist-line"><b>Objectifs :</b> ' + feEsc(r.objectifs) + '</div>' : '') + '</div>';
    }).join('');
    show('btnHist', h.length > 1);
  }
  $('btnHist').addEventListener('click', function () { var f = $('historique-full'); var v = f.classList.toggle('visible'); $('btnHist').textContent = v ? "Replier l'historique ▴" : "Dérouler tout l'historique ▾"; });

  /* ---------- Chargement du contexte ---------- */
  async function loadContext(params) {
    status('⏳ Chargement de la fiche…', '');
    setSections(false);
    try {
      var c = await feGet(Object.assign({ action: 'contexte' }, params));
      if (!c || !c.ok) { status('⚠️ ' + ((c && c.error) || 'Fiche introuvable'), 'err'); return; }
      S.ctx = c; S.taskId = c.taskId; if (c.contactId) S.contactId = c.contactId;
      $('apprenante').value = c.nom; $('apprenante').readOnly = !!(feParam('contactId') || feParam('taskId'));
      $('chipSession').textContent = (c.debut ? feFr(c.debut) : '—') + ' → ' + (c.fin ? feFr(c.fin) : '—');
      if (c.formule) $('formule').value = c.formule;
      if (c.modaliteFormule) $('modaliteFormule').value = c.modaliteFormule;
      if (!$('numRdv').value) $('numRdv').value = c.numSuggere || '';
      if (c.pct !== null && c.pct !== undefined) { $('pct').value = c.pct; $('pctNote').textContent = '✅ ' + c.pct + ' % repris de ClickUp (Teachizy). Modifiable si besoin.'; }
      else $('pctNote').textContent = 'Pas de % disponible sur ClickUp : renseigne-le à la main.';
      var last = (c.historique || [])[0];
      if (!$('formatrice').value && last && last.formatrice) $('formatrice').value = last.formatrice;
      if (!$('dateCertification').value) {
        var lastCert = (c.historique || []).find(function (r) { return r.dateCertification; });
        if (lastCert) $('dateCertification').value = lastCert.dateCertification;
      }
      S.sigDeja.att = !!c.signeAttestation; S.sigDeja.prog = !!c.signeProgramme; renderSignatures();
      renderHistory(c.historique);
      show('btnReset', true);
      status('✅ ' + c.nom + ' — fiche chargée' + (c.statut ? ' (' + c.statut + ')' : ''), 'ok');
      if (!S.contactId) status('⚠️ Contact GHL introuvable pour cette apprenante : ouvre la fiche depuis le lien Slack pour pouvoir enregistrer.', 'err');
      S.loaded = true; setSections(true);
      show('section-devoirs', !$('nonRealise').checked && isRdv2Plus());
    } catch (e) { status('⚠️ Impossible de charger la fiche : ' + e.message, 'err'); }
  }

  /* ---------- Recherche manuelle ---------- */
  var NOMS = [];
  async function loadNames() {
    try {
      var r = await feGet({ action: 'noms' });
      if (!r || !r.ok) return;
      NOMS = r.data;
      $('liste-apprenantes').innerHTML = NOMS.map(function (n) { return '<option value="' + feEsc(n.nom) + '"></option>'; }).join('');
    } catch (e) {}
  }
  $('btnCharger').addEventListener('click', function () {
    var v = $('apprenante').value.trim().toLowerCase();
    var hit = NOMS.find(function (n) { return n.nom.toLowerCase() === v; });
    if (!hit) { status('Nom non reconnu : choisis une apprenante dans la liste proposée.', 'err'); return; }
    loadContext({ taskId: hit.taskId });
  });

  /* ---------- Envoi ---------- */
  function collect() {
    var nr = $('nonRealise').checked;
    var pts = Array.prototype.slice.call(document.querySelectorAll('#pointsGrid input:checked')).map(function (x) { return x.value; }).join(', ');
    var motif = radioVal('motif');
    var detail = motif === 'Reporté à sa demande' ? $('motifDate').value : (motif === 'Autre' ? $('motifAutre').value.trim() : '');
    return {
      v: 2, k: feKey(false), contactId: S.contactId, apprenante: $('apprenante').value.trim(), rdvDate: rdvDateParam,
      dateSuivi: $('dateSuivi').value, formatrice: $('formatrice').value, numRdv: $('numRdv').value,
      rdvRealise: nr ? 'Non' : 'Oui', motif: nr ? motif : '', detailMotif: nr ? detail : '',
      duree: S.duree, modalite: S.modalite,
      emargement: radioVal('emarg'),
      drapeau: radioVal('drapeau'),
      devoirs: radioVal('devoirs'),
      pctProgression: $('pct').value, dateCertification: $('dateCertification').value,
      formule: $('formule').value, modaliteFormule: $('modaliteFormule').value,
      signatureAttestation: (S.sigDeja.att || S.sigCoche.att) ? 'Oui' : '', signatureProgramme: (S.sigDeja.prog || S.sigCoche.prog) ? 'Oui' : '',
      pointsCoches: pts, pointsAutre: $('pointsAutre').value, pointsForts: $('pointsForts').value, difficultes: $('difficultes').value,
      objectifs: $('objectifs').value, correctionDevoirs: $('correctionDevoirs').value, adaptation: $('adaptation').value, assistance: $('assistance').value, autre: $('autre').value,
      risque: radioVal('risque'), actionRisque: $('actionRisque').value,
      prochainType: radioVal('prochain'), prochainDate: $('prochainDate').value, prochainHeure: $('prochainHeure').value.trim()
    };
  }
  function validate(p) {
    if (!S.loaded) return ['section-apprenante', "Charge d'abord la fiche de l'apprenante."];
    if (!p.contactId) return ['section-apprenante', "Contact GHL introuvable : ouvre la fiche depuis le lien Slack."];
    if (!p.dateSuivi) return ['section-suivi', 'Merci de renseigner la date du suivi.'];
    if (!p.formatrice) return ['section-suivi', 'Merci de choisir la formatrice.'];
    if (!p.numRdv) return ['section-suivi', 'Merci de choisir le n° de rendez-vous.'];
    if (p.rdvRealise === 'Non') {
      if (!p.motif) return ['section-motif', 'Merci de préciser le motif du rendez-vous non réalisé.'];
      if (p.motif === 'Reporté à sa demande' && !p.detailMotif) return ['section-motif', "Merci d'indiquer la nouvelle date prévue."];
      if (p.motif === 'Autre' && !p.detailMotif) return ['section-motif', 'Merci de préciser le motif.'];
    } else {
      if (!p.emargement) return ['section-emargement', "Merci d'indiquer si la feuille d'émargement est signée."];
      if (!p.drapeau) return ['section-drapeau', 'Merci de sélectionner un drapeau de suivi (gris, bleu, jaune ou rouge).'];
      if (isRdv2Plus() && !p.devoirs) return ['section-devoirs', "Merci d'indiquer si le devoir de la semaine a été fait ou non."];
      if (p.risque === 'Oui' && !p.actionRisque.trim()) return ['section-risque', "Merci de préciser l'action prévue (risque d'abandon)."];
    }
    if (p.prochainType === 'date' && !p.prochainDate) return ['section-prochain', 'Merci de renseigner la date du prochain rendez-vous.'];
    return null;
  }
  $('btnSave').addEventListener('click', async function () {
    if (S.sent) return;
    var p = collect(), err = validate(p);
    if (err) { msg(err[1], false); alertSection(err[0]); return; }
    var btn = $('btnSave'); btn.disabled = true; btn.textContent = 'Enregistrement…'; msg('Envoi en cours…', true);
    var body = new URLSearchParams();
    Object.keys(p).forEach(function (k) { body.append(k, p[k] === undefined || p[k] === null ? '' : p[k]); });
    try {
      var r = await fetch(FE.API + FE.POST, { method: 'POST', body: body });
      var j = null; try { j = await r.json(); } catch (x) {}
      if (!r.ok || !j || !j.ok) throw new Error(r.ok ? 'réponse inattendue' : 'HTTP ' + r.status);
      if (j.status === 'doublon') {
        btn.disabled = false; btn.textContent = 'Enregistrer le suivi';
        msg("⚠️ Une fiche existe déjà pour cette apprenante, ce N° de RDV et cette date : rien n'a été recréé. Si tu corriges une fiche, préviens Ninie. Si c'est un autre RDV, change le N° de RDV ou la date.", false);
        return;
      }
      S.sent = true; btn.textContent = 'Fiche enregistrée ✓';
      msg("✅ Fiche enregistrée. Le PDF et la carte ClickUp se mettent à jour dans quelques secondes. Tu peux fermer cette page.", true);
    } catch (e) {
      btn.disabled = false; btn.textContent = 'Enregistrer le suivi';
      msg("L'enregistrement n'a pas pu être confirmé (" + e.message + "). Tu peux réessayer sans risque : une fiche déjà enregistrée n'est pas recréée. Si ça persiste, préviens Ninie ou Dimby.", false);
    }
  });

  /* ---------- Démarrage ---------- */
  var d = rdvDateParam ? rdvDateParam.slice(0, 10) : new Date().toISOString().slice(0, 10);
  $('dateSuivi').value = d;
  var fp = feParam('formatrice').trim().toLowerCase(); if (fp) { var opt = Array.prototype.find.call($('formatrice').options, function (o) { var v = o.value.toLowerCase(); return v && (v === fp || v.indexOf(fp + ' ') === 0 || fp.indexOf(v + ' ') === 0); }); if (opt) $('formatrice').value = opt.value; }
  var nom = feParam('apprenante'); if (nom) $('apprenante').value = nom;
  var rk = document.createElement('button'); rk.id = 'btnReset'; rk.type = 'button'; rk.className = 'btn-link-reset hidden'; rk.textContent = "↺ Changer d'apprenante";
  rk.addEventListener('click', function () { location.href = 'fiche.html'; });
  $('aide').parentNode.appendChild(rk);
  feKey(false);
  setSections(false);
  var tid = feParam('taskId');
  if (S.contactId) { $('btnCharger').classList.add('hidden'); loadContext({ contactId: S.contactId }); }
  else if (tid) { $('btnCharger').classList.add('hidden'); $('apprenante').readOnly = true; loadContext({ taskId: tid }); }
  else { loadNames(); status('Aucune apprenante sélectionnée.', ''); }
})();
