/* =========================================================
   Linea del tempo interattiva
   Tutto il programma sta in questo file. Nessuna libreria.
   I contenuti NON stanno qui: stanno in eventi.txt.
   ========================================================= */

/* ---------- misure della linea del tempo (in pixel) ---------- */
const MARGINE = 70;        // spazio vuoto a sinistra e a destra
const LARGHEZZA_CARTA = 178;
const ALTEZZA_CARTA = 74;
const DISTANZA_CARTE = 10;
const ALTEZZA_ASSE = 54;   // a che altezza sta il filo del tempo
const STACCO_ASSE = 30;    // spazio fra il filo e la prima fila di cartelline

/* ---------- ingrandimento: quanti pixel vale un anno ---------- */
let pixelPerAnno = 40;
const ZOOM_MINIMO = 5;
const ZOOM_MASSIMO = 160;

/* ---------- colori assegnati automaticamente alle categorie ---------- */
const PALETTE = [
  '#1f6f6b', '#9c5a1e', '#8a2f39', '#3c4f8f',
  '#5a6b1f', '#6b3f7a', '#b06a12', '#2f6b8a'
];
const coloreDi = {};   // esempio: { Economia: '#1f6f6b', ... }

/* ---------- memoria del programma ---------- */
let eventi = [];              // tutti gli eventi letti dal file
let categorieSpente = new Set();   // categorie tolte dai filtri

/* scorciatoie per prendere i pezzi della pagina */
const $ = (id) => document.getElementById(id);


/* =========================================================
   1. LEGGERE IL FILE eventi.txt
   ========================================================= */

fetch('eventi.txt')
  .then((risposta) => {
    if (!risposta.ok) throw new Error('file non trovato');
    return risposta.text();
  })
  .then(avvia)
  .catch(spiegaIlProblema);

/* Trasforma il testo del file in un elenco di eventi.
   Salta le righe vuote e quelle che iniziano con # */
function leggiTesto(testo) {
  const trovati = [];
  const righeSbagliate = [];

  testo.split(/\r?\n/).forEach((riga, indice) => {
    const pulita = riga.trim();
    if (pulita === '' || pulita.startsWith('#')) return;

    const parti = pulita.split('|').map((p) => p.trim());
    const anno = parseInt(parti[0], 10);

    if (parti.length < 4 || isNaN(anno)) {
      righeSbagliate.push(indice + 1);
      return;
    }

    trovati.push({
      anno: anno,
      titolo: parti[1],
      descrizione: parti[2],
      categoria: parti[3]
    });
  });

  if (righeSbagliate.length > 0) {
    avvisa('Attenzione: non sono riuscito a leggere ' + righeSbagliate.length +
           ' riga/e di eventi.txt (riga ' + righeSbagliate.join(', riga ') +
           '). Controlla che ci siano quattro parti separate da | e che l’anno sia un numero.');
  }

  trovati.sort((a, b) => a.anno - b.anno);
  return trovati;
}

function avvia(testo) {
  eventi = leggiTesto(testo);

  if (eventi.length === 0) {
    avvisa('Il file eventi.txt non contiene nessun evento valido.');
    return;
  }

  assegnaColori();
  costruisciFiltri();
  disegnaLinea();
  collegaPulsanti();
}

/* Se il file non si riesce a leggere, spiega cosa fare
   (succede quando si apre il sito con doppio clic invece che da un indirizzo web) */
function spiegaIlProblema() {
  const box = $('messaggio');
  box.hidden = false;
  box.innerHTML =
    '<strong>Non riesco a leggere il file eventi.txt.</strong><br>' +
    'Succede quando la pagina viene aperta con un doppio clic: per sicurezza il browser ' +
    'impedisce alle pagine di leggere i file del computer. Il sito funziona regolarmente ' +
    'una volta pubblicato su GitHub Pages.<br><br>' +
    'Intanto, per vederlo qui: scegli il file <code>eventi.txt</code> qui sotto. ';

  const scelta = document.createElement('input');
  scelta.type = 'file';
  scelta.accept = '.txt';
  scelta.addEventListener('change', () => {
    const file = scelta.files[0];
    if (!file) return;
    const lettore = new FileReader();
    lettore.onload = () => { box.hidden = true; avvia(lettore.result); };
    lettore.readAsText(file, 'UTF-8');
  });
  box.appendChild(scelta);
}

function avvisa(testo) {
  const box = $('messaggio');
  box.hidden = false;
  box.textContent = testo;
}


/* =========================================================
   2. CATEGORIE: colori e filtri
   ========================================================= */

function categorie() {
  const nomi = [...new Set(eventi.map((e) => e.categoria))];
  nomi.sort((a, b) => a.localeCompare(b, 'it'));
  return nomi;
}

function assegnaColori() {
  categorie().forEach((nome, i) => {
    coloreDi[nome] = PALETTE[i % PALETTE.length];
  });
}

function costruisciFiltri() {
  const contenitore = $('filtri');
  contenitore.innerHTML = '';

  categorie().forEach((nome) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'filtro';
    b.textContent = nome;
    b.style.setProperty('--colore', coloreDi[nome]);
    b.setAttribute('aria-pressed', 'true');

    b.addEventListener('click', () => {
      if (categorieSpente.has(nome)) categorieSpente.delete(nome);
      else categorieSpente.add(nome);

      const spenta = categorieSpente.has(nome);
      b.classList.toggle('spento', spenta);
      b.setAttribute('aria-pressed', String(!spenta));
      disegnaLinea();
    });

    contenitore.appendChild(b);
  });
}

/* gli eventi delle categorie accese */
function eventiVisibili() {
  return eventi.filter((e) => !categorieSpente.has(e.categoria));
}


/* =========================================================
   3. DISEGNARE LA LINEA DEL TEMPO
   ========================================================= */

function disegnaLinea() {
  const elenco = eventiVisibili();
  const tela = $('tela');
  const zonaTacche = $('tacche');
  const zonaEventi = $('eventi');

  zonaTacche.innerHTML = '';
  zonaEventi.innerHTML = '';
  if (elenco.length === 0) return;

  const primoAnno = eventi[0].anno;
  const ultimoAnno = eventi[eventi.length - 1].anno;
  const posizioneX = (anno) => MARGINE + (anno - primoAnno) * pixelPerAnno;

  /* --- le tacche con gli anni sul filo del tempo --- */
  const passo = passoTacche();
  const inizio = Math.floor(primoAnno / passo) * passo;
  for (let anno = inizio; anno <= ultimoAnno + passo; anno += passo) {
    const t = document.createElement('div');
    t.className = 'tacca';
    t.textContent = anno;
    t.style.left = posizioneX(anno) + 'px';
    zonaTacche.appendChild(t);
  }

  /* --- le cartelline, sistemate su più file per non sovrapporsi --- */
  const fineDiOgniFila = [];   // fin dove arriva l'ultima cartellina di ogni fila

  elenco.forEach((evento) => {
    const x = posizioneX(evento.anno);

    let fila = fineDiOgniFila.findIndex((fine) => x > fine + 8);
    if (fila === -1) { fila = fineDiOgniFila.length; }
    fineDiOgniFila[fila] = x + LARGHEZZA_CARTA;

    const y = ALTEZZA_ASSE + STACCO_ASSE + fila * (ALTEZZA_CARTA + DISTANZA_CARTE);
    const colore = coloreDi[evento.categoria];

    /* il puntino sul filo del tempo */
    const punto = document.createElement('div');
    punto.className = 'punto';
    punto.style.left = x + 'px';
    punto.style.top = (ALTEZZA_ASSE - 3) + 'px';
    punto.style.setProperty('--colore', colore);
    zonaEventi.appendChild(punto);

    /* il filo verticale che collega puntino e cartellina */
    const stelo = document.createElement('div');
    stelo.className = 'stelo';
    stelo.style.left = x + 'px';
    stelo.style.top = ALTEZZA_ASSE + 'px';
    stelo.style.height = (y - ALTEZZA_ASSE) + 'px';
    stelo.style.setProperty('--colore', colore);
    zonaEventi.appendChild(stelo);

    /* la cartellina cliccabile */
    const carta = document.createElement('button');
    carta.type = 'button';
    carta.className = 'evento';
    carta.style.left = x + 'px';
    carta.style.top = y + 'px';
    carta.style.height = ALTEZZA_CARTA + 'px';
    carta.style.setProperty('--colore', colore);
    carta.innerHTML =
      '<span class="anno"></span><span class="titolo"></span>';
    carta.querySelector('.anno').textContent = evento.anno;
    carta.querySelector('.titolo').textContent = evento.titolo;

    carta.addEventListener('click', () => {
      if (stoTrascinando) return;   // stavo solo scorrendo la linea
      apriScheda(evento);
    });

    zonaEventi.appendChild(carta);
  });

  /* la tela si allarga e si allunga quanto serve */
  const file = Math.max(fineDiOgniFila.length, 1);
  tela.style.width = (posizioneX(ultimoAnno) + LARGHEZZA_CARTA + MARGINE) + 'px';
  tela.style.height =
    (ALTEZZA_ASSE + STACCO_ASSE + file * (ALTEZZA_CARTA + DISTANZA_CARTE) + 20) + 'px';
}

/* ogni quanti anni scrivere un numero sul filo del tempo */
function passoTacche() {
  if (pixelPerAnno < 8) return 50;
  if (pixelPerAnno < 16) return 25;
  if (pixelPerAnno < 34) return 10;
  if (pixelPerAnno < 90) return 5;
  return 1;
}


/* =========================================================
   4. INGRANDIRE, RIMPICCIOLIRE, SCORRERE
   ========================================================= */

function cambiaZoom(fattore, ancoraX) {
  const cornice = $('cornice');
  const nuovo = Math.min(ZOOM_MASSIMO, Math.max(ZOOM_MINIMO, pixelPerAnno * fattore));
  if (nuovo === pixelPerAnno) return;

  /* teniamo fermo il punto che sta sotto il mouse (o il centro dello schermo) */
  const punto = ancoraX !== undefined ? ancoraX : cornice.clientWidth / 2;
  const primaX = cornice.scrollLeft + punto;
  const rapporto = nuovo / pixelPerAnno;

  pixelPerAnno = nuovo;
  disegnaLinea();

  cornice.scrollLeft = (primaX - MARGINE) * rapporto + MARGINE - punto;
}

function zoomPerVedereTutto() {
  const cornice = $('cornice');
  const durata = eventi[eventi.length - 1].anno - eventi[0].anno;
  const spazio = cornice.clientWidth - MARGINE * 2 - LARGHEZZA_CARTA;
  pixelPerAnno = Math.max(ZOOM_MINIMO, Math.min(ZOOM_MASSIMO, spazio / Math.max(durata, 1)));
  disegnaLinea();
  cornice.scrollLeft = 0;
}

/* trascinamento con il mouse per scorrere la linea */
let stoTrascinando = false;

function abilitaTrascinamento() {
  const cornice = $('cornice');
  let premuto = false, partenzaX = 0, partenzaScroll = 0;

  cornice.addEventListener('mousedown', (e) => {
    premuto = true;
    stoTrascinando = false;
    partenzaX = e.pageX;
    partenzaScroll = cornice.scrollLeft;
    cornice.classList.add('trascino');
  });

  window.addEventListener('mousemove', (e) => {
    if (!premuto) return;
    const spostamento = e.pageX - partenzaX;
    if (Math.abs(spostamento) > 5) stoTrascinando = true;
    cornice.scrollLeft = partenzaScroll - spostamento;
  });

  window.addEventListener('mouseup', () => {
    premuto = false;
    cornice.classList.remove('trascino');
    /* lasciamo passare un attimo prima di riaccettare i clic */
    setTimeout(() => { stoTrascinando = false; }, 30);
  });

  /* rotellina: scorre; con Ctrl premuto ingrandisce */
  cornice.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const bordo = cornice.getBoundingClientRect();
      cambiaZoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - bordo.left);
    } else if (e.deltaX === 0) {
      e.preventDefault();
      cornice.scrollLeft += e.deltaY;
    }
  }, { passive: false });
}


/* =========================================================
   5. LA SCHEDA DELL'EVENTO
   ========================================================= */

function apriScheda(evento) {
  const colore = coloreDi[evento.categoria];
  const scheda = $('scheda');

  scheda.style.setProperty('--colore', colore);
  $('scheda-anno').textContent = evento.anno;
  $('scheda-titolo').textContent = evento.titolo;
  $('scheda-categoria').textContent = evento.categoria;
  $('scheda-descrizione').textContent = evento.descrizione;

  scheda.hidden = false;
  $('velo').hidden = false;
  $('chiudi-scheda').focus();
}

function chiudiScheda() {
  $('scheda').hidden = true;
  $('velo').hidden = true;
}


/* =========================================================
   6. MODALITÀ QUIZ
   ========================================================= */

let carteInGioco = [];   // gli eventi estratti per la partita

function nuovaPartita() {
  const disponibili = eventiVisibili();
  const quante = Math.min(parseInt($('numero-carte').value, 10), disponibili.length);

  $('esito').hidden = true;

  if (disponibili.length < 3) {
    $('esito').hidden = false;
    $('esito').textContent =
      'Servono almeno tre eventi: riaccendi qualche categoria nella linea del tempo.';
    $('carte').innerHTML = '';
    return;
  }

  /* pesco a caso, poi mescolo l'ordine in cui le mostro */
  carteInGioco = mescola(disponibili).slice(0, quante);
  carteInGioco = mescola(carteInGioco);

  disegnaCarte();
}

function mescola(elenco) {
  const copia = elenco.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function disegnaCarte() {
  const lista = $('carte');
  lista.innerHTML = '';

  carteInGioco.forEach((evento) => {
    const li = document.createElement('li');
    li.className = 'carta';
    li.style.setProperty('--colore', coloreDi[evento.categoria]);
    li.dataset.anno = evento.anno;

    li.innerHTML =
      '<span class="presa" aria-hidden="true">&#8942;&#8942;</span>' +
      '<span class="testo">' +
        '<span class="titolo-carta"></span>' +
        '<span class="categoria-carta"></span>' +
      '</span>' +
      '<span class="segno"></span>' +
      '<span class="frecce">' +
        '<button type="button" class="su" aria-label="Sposta in su">&#9650;</button>' +
        '<button type="button" class="giu" aria-label="Sposta in giù">&#9660;</button>' +
      '</span>';

    li.querySelector('.titolo-carta').textContent = evento.titolo;
    li.querySelector('.categoria-carta').textContent = evento.categoria;

    li.querySelector('.su').addEventListener('click', () => {
      const prima = li.previousElementSibling;
      if (prima) lista.insertBefore(li, prima);
      pulisciSegni();
    });

    li.querySelector('.giu').addEventListener('click', () => {
      const dopo = li.nextElementSibling;
      if (dopo) lista.insertBefore(dopo, li);
      pulisciSegni();
    });

    lista.appendChild(li);
  });
}

/* togliere i segni verdi e rossi quando si sposta di nuovo una carta */
function pulisciSegni() {
  $('carte').querySelectorAll('.carta').forEach((c) => {
    c.classList.remove('giusta', 'sbagliata');
    c.querySelector('.segno').textContent = '';
    const anno = c.querySelector('.anno-svelato');
    if (anno) anno.remove();
  });
  $('esito').hidden = true;
}

/* Trascinamento delle carte del quiz.
   Usiamo i "pointer": così funziona allo stesso modo con il mouse,
   con il dito sul tablet e con la penna della LIM. */
function abilitaTrascinamentoCarte() {
  const lista = $('carte');
  let carta = null;      // la carta che sto trascinando
  let partenzaY = 0;     // dove ho premuto
  let spostata = false;

  lista.addEventListener('pointerdown', (e) => {
    /* i clic sulle frecce non devono avviare il trascinamento */
    if (e.target.closest('button')) return;

    /* con il dito si trascina solo dalla maniglia a sinistra,
       così il resto della carta serve ancora a scorrere la pagina */
    const dallaManiglia = !!e.target.closest('.presa');
    if (e.pointerType === 'touch' && !dallaManiglia) return;

    carta = e.target.closest('.carta');
    if (!carta) return;

    partenzaY = e.clientY;
    spostata = false;
    carta.setPointerCapture(e.pointerId);
    carta.classList.add('in-volo');
  });

  lista.addEventListener('pointermove', (e) => {
    if (!carta) return;
    e.preventDefault();

    let scarto = e.clientY - partenzaY;
    if (Math.abs(scarto) > 3) spostata = true;

    /* se ho superato la metà della carta vicina, faccio lo scambio */
    const sopra = carta.previousElementSibling;
    const sotto = carta.nextElementSibling;

    if (sopra && scarto < -sopra.offsetHeight / 2) {
      partenzaY += scambia(carta, () => lista.insertBefore(carta, sopra));
      scarto = e.clientY - partenzaY;
    } else if (sotto && scarto > sotto.offsetHeight / 2) {
      partenzaY += scambia(carta, () => lista.insertBefore(sotto, carta));
      scarto = e.clientY - partenzaY;
    }

    carta.style.transform = 'translateY(' + scarto + 'px)';
  });

  const lascia = () => {
    if (!carta) return;
    carta.style.transform = '';
    carta.classList.remove('in-volo');
    carta = null;
    if (spostata) pulisciSegni();
  };

  lista.addEventListener('pointerup', lascia);
  lista.addEventListener('pointercancel', lascia);
}

/* Sposta la carta nell'elenco e restituisce di quanto si è alzata o
   abbassata, così possiamo correggere il conto e non farla "saltare". */
function scambia(carta, mossa) {
  const prima = carta.offsetTop;
  mossa();
  return carta.offsetTop - prima;
}

function controllaOrdine() {
  const carte = [...$('carte').querySelectorAll('.carta')];
  if (carte.length === 0) return;

  const anniMessi = carte.map((c) => parseInt(c.dataset.anno, 10));
  const anniGiusti = anniMessi.slice().sort((a, b) => a - b);

  let giuste = 0;

  carte.forEach((carta, i) => {
    const corretta = anniMessi[i] === anniGiusti[i];
    if (corretta) giuste++;

    carta.classList.add(corretta ? 'giusta' : 'sbagliata');
    carta.querySelector('.segno').textContent = corretta ? '✓' : '✗';

    /* sveliamo l'anno vero */
    if (!carta.querySelector('.anno-svelato')) {
      const anno = document.createElement('span');
      anno.className = 'anno-svelato';
      anno.textContent = carta.dataset.anno;
      carta.querySelector('.testo').after(anno);
    }
  });

  const esito = $('esito');
  esito.hidden = false;
  esito.textContent = giuste === carte.length
    ? 'Perfetto! Tutte e ' + carte.length + ' le carte sono al posto giusto.'
    : 'Hai messo al posto giusto ' + giuste +
      (giuste === 1 ? ' carta' : ' carte') + ' su ' + carte.length +
      '. Sposta quelle segnate con ✗ e prova di nuovo.';
}


/* =========================================================
   7. PASSARE DA UNA MODALITÀ ALL'ALTRA
   ========================================================= */

function mostraLinea() {
  $('vista-linea').hidden = false;
  $('vista-quiz').hidden = true;
  $('btn-linea').classList.add('attivo');
  $('btn-quiz').classList.remove('attivo');
}

function mostraQuiz() {
  $('vista-linea').hidden = true;
  $('vista-quiz').hidden = false;
  $('btn-quiz').classList.add('attivo');
  $('btn-linea').classList.remove('attivo');
  nuovaPartita();
}


/* =========================================================
   8. COLLEGARE I PULSANTI
   ========================================================= */

function collegaPulsanti() {
  $('zoom-piu').addEventListener('click', () => cambiaZoom(1.4));
  $('zoom-meno').addEventListener('click', () => cambiaZoom(1 / 1.4));
  $('zoom-tutto').addEventListener('click', zoomPerVedereTutto);

  $('btn-linea').addEventListener('click', mostraLinea);
  $('btn-quiz').addEventListener('click', mostraQuiz);

  $('chiudi-scheda').addEventListener('click', chiudiScheda);
  $('velo').addEventListener('click', chiudiScheda);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') chiudiScheda();
  });

  $('btn-nuova').addEventListener('click', nuovaPartita);
  $('numero-carte').addEventListener('change', nuovaPartita);
  $('btn-controlla').addEventListener('click', controllaOrdine);

  abilitaTrascinamento();
  abilitaTrascinamentoCarte();

  /* se si cambia la larghezza della finestra, ridisegniamo */
  window.addEventListener('resize', disegnaLinea);
}
