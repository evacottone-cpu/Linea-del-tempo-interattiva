# Regole del progetto

Questo repository contiene un piccolo sito "Linea del tempo interattiva",
pubblicato con GitHub Pages. Chi lo cura non è programmatore/programmatrice.
Claude deve rispettare sempre le regole qui sotto.

## 1. Sito statico, senza complicazioni

- Solo **HTML, CSS e JavaScript** scritti a mano.
- **Nessuna libreria esterna** (niente jQuery, Bootstrap, React, CDN vari...).
- **Nessun passaggio di build**: il sito deve funzionare aprendo direttamente
  i file, senza installare o compilare nulla.

## 2. Struttura dei file

- `index.html` sta nella **cartella principale** del repository.
- Si usano **solo percorsi relativi** (esempio: `css/stile.css`,
  `dati/eventi.txt`), mai percorsi che iniziano con `/` o con `file:///`.
  Questo serve perché su GitHub Pages il sito vive dentro una sottocartella
  dell'indirizzo.

## 3. Contenuti separati dal codice

- I testi e i dati del sito stanno in **file di testo semplici**
  (per esempio dentro una cartella `dati/`), non dentro il codice.
- Quei file devono essere **modificabili da chi non sa programmare**:
  righe chiare, spiegate da un commento iniziale, senza simboli strani
  da rispettare a memoria.
- Se serve aggiungere un contenuto, si aggiunge una riga nel file dei dati,
  non una riga di codice.

## 4. Commit e messaggi

- Commit **piccoli e frequenti**: una modifica = un commit.
- Messaggi **in italiano**, che spiegano **cosa è cambiato** e perché,
  con parole comprensibili (esempio: "Aggiunti tre eventi del 1861 nel
  file dei dati").

## 5. Git sì, gh no

- Si usa **solo `git` da riga di comando**.
- **Mai `gh`** (la GitHub CLI): non è installata.
- **Prima di ogni `git push` va chiesta conferma** a chi cura il progetto.

## 6. Come comunicare

- Spiegare ogni passaggio con **parole semplici**, senza dare per scontati
  termini tecnici: chi legge non è programmatore/programmatrice.
- Quando si usa un termine tecnico, spiegarlo in poche parole.

## 7. Privacy

- Il repository è **pubblico**: tutto quello che viene caricato è visibile
  a chiunque su internet.
- **Mai dati personali reali di studenti e studentesse** (nomi e cognomi,
  foto, classi, email, voti, indirizzi). Se servono esempi, usare nomi
  inventati.
