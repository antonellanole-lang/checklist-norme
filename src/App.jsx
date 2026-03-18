import { useState, useEffect, useCallback } from "react";

/* ─── CDN loaders ─── */
const loadXLSX = () => new Promise(res => {
  if (window.XLSX) return res(window.XLSX);
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
  s.onload = () => res(window.XLSX); document.head.appendChild(s);
});

/* ═══════════════════════════════════════════════════════════════
   LIBRERIA NORME PREIMPOSTATA
   Struttura voce: { text: "Descrizione", ref: "Norma Art. X, c. Y" }
   Modificabile dal pannello "Gestisci norme" al passo 4
   ═══════════════════════════════════════════════════════════════ */
const DEFAULT_DISCIPLINES = {
  architettura: {
    label: "Architettura", icon: "🏛️", color: "#C8A96E",
    sections: [
      { title: "Art. 1 – Campo di Applicazione – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "1.1 – L'edificio è di nuova costruzione privata (residenziale o non residenziale)?", ref: "D.M. 236/1989, Art. 1" },
        { text: "1.2 – L'edificio rientra nell'edilizia residenziale pubblica sovvenzionata/agevolata di nuova costruzione?", ref: "D.M. 236/1989, Art. 1" },
        { text: "1.3 – L'intervento riguarda la ristrutturazione di edifici privati (anche preesistenti)?", ref: "D.M. 236/1989, Art. 1" },
        { text: "1.4 – Sono compresi gli spazi esterni di pertinenza dell'edificio?", ref: "D.M. 236/1989, Art. 1" },
      ]},
      { title: "Art. 3.2 – Accessibilità Obbligatoria – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "3.1 – Esiste almeno un percorso esterno fruibile da persone con ridotte/impedite capacità motorie o sensoriali?", ref: "D.M. 236/1989, Art. 3.2a" },
        { text: "3.2 – Le parti comuni dell'edificio sono accessibili?", ref: "D.M. 236/1989, Art. 3.2b" },
        { text: "3.3 – Negli edifici residenziali con NON più di 3 livelli fuori terra: è prevista la possibilità di installare servoscala in futuro?", ref: "D.M. 236/1989, Art. 3.2" },
        { text: "3.4 – L'ascensore è installato se l'accesso alla più alta unità immobiliare supera il 3° livello (compresi interrati/porticati)?", ref: "D.M. 236/1989, Art. 3.2" },
      ]},
      { title: "Art. 3.3 – Accessibilità Categorie Specifiche – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "3.5 – Almeno il 5% degli alloggi (min. 1) è accessibile nell'edilizia residenziale sovvenzionata?", ref: "D.M. 236/1989, Art. 3.3a" },
        { text: "3.6 – Gli ambienti destinati ad attività scolastiche, sanitarie, assistenziali, culturali, sportive sono accessibili?", ref: "D.M. 236/1989, Art. 3.3b" },
        { text: "3.7 – Gli edifici sedi di aziende soggette al collocamento obbligatorio rispettano le norme di accessibilità?", ref: "D.M. 236/1989, Art. 3.3c" },
      ]},
      { title: "Art. 3.4 – Visitabilità – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "3.8 – Negli edifici residenziali: soggiorno/pranzo, un servizio igienico e i percorsi interni sono accessibili?", ref: "D.M. 236/1989, Art. 3.4a" },
        { text: "3.9 – Nelle unità sedi di riunioni/spettacoli: almeno una zona pubblica e un servizio igienico sono accessibili?", ref: "D.M. 236/1989, Art. 3.4b" },
        { text: "3.10 – Nelle strutture ricettive: tutte le parti comuni e il numero prescritto di stanze sono accessibili?", ref: "D.M. 236/1989, Art. 3.4c" },
        { text: "3.11 – Nei luoghi di culto: almeno una zona per i fedeli è accessibile?", ref: "D.M. 236/1989, Art. 3.4d" },
        { text: "3.12 – Nelle unità aperte al pubblico (sup. ≥ 250 mq): spazi di relazione e almeno un servizio igienico accessibili?", ref: "D.M. 236/1989, Art. 3.4e" },
        { text: "3.13 – Nei luoghi di lavoro non aperti al pubblico e non soggetti al collocamento obbligatorio: è soddisfatto il requisito di adattabilità?", ref: "D.M. 236/1989, Art. 3.4f" },
        { text: "3.14 – Negli edifici residenziali unifamiliari o plurifamiliari privi di parti comuni: è soddisfatto il requisito di adattabilità?", ref: "D.M. 236/1989, Art. 3.4g" },
      ]},
      { title: "Art. 4.1.1 – Porte – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "4.1 – La luce netta della porta d'accesso all'edificio e alle singole unità immobiliari è ≥ 80 cm?", ref: "D.M. 236/1989, Art. 4.1.1" },
        { text: "4.2 – La luce netta delle altre porte interne è ≥ 75 cm?", ref: "D.M. 236/1989, Art. 4.1.1" },
        { text: "4.3 – Gli spazi antistanti e retrostanti la porta consentono le manovre con sedia a ruote?", ref: "D.M. 236/1989, Art. 4.1.1" },
        { text: "4.4 – Il vano porta e gli spazi antistanti/retrostanti sono complanari (salvo deroghe in ristrutturazione)?", ref: "D.M. 236/1989, Art. 4.1.1" },
        { text: "4.5 – L'altezza delle maniglie è compresa tra 85 e 95 cm (consigliata 90 cm)?", ref: "D.M. 236/1989, Art. 4.1.1" },
        { text: "4.6 – Le singole ante non superano la larghezza di 120 cm?", ref: "D.M. 236/1989, Art. 4.1.1" },
        { text: "4.7 – Gli eventuali vetri nelle porte sono collocati ad almeno 40 cm dal pavimento?", ref: "D.M. 236/1989, Art. 4.1.1" },
        { text: "4.8 – La forza necessaria ad aprire l'anta mobile non supera 8 kg?", ref: "D.M. 236/1989, Art. 4.1.1" },
        { text: "4.9 – Le porte vetrate sono dotate di segnali visibili (ad es. bande colorate)?", ref: "D.M. 236/1989, Art. 4.1.1" },
        { text: "4.10 – Sono preferite maniglie a leva opportunamente curvate e arrotondate?", ref: "D.M. 236/1989, Art. 4.1.1" },
      ]},
      { title: "Art. 4.1.2 – Pavimenti – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "4.11 – I pavimenti sono orizzontali e complanari tra loro?", ref: "D.M. 236/1989, Art. 4.1.2" },
        { text: "4.12 – Le variazioni di livello sono risolte con rampe o raccordi (max 2,5 cm con bordi arrotondati)?", ref: "D.M. 236/1989, Art. 4.1.2" },
        { text: "4.13 – Il materiale del pavimento è antisdrucciolo (resistenza allo scivolamento verificata)?", ref: "D.M. 236/1989, Art. 4.1.2" },
        { text: "4.14 – I giunti di dilatazione non superano i 5 mm?", ref: "D.M. 236/1989, Art. 4.1.2" },
        { text: "4.15 – Le griglie o le caditoie hanno maglie ≤ 2 cm?", ref: "D.M. 236/1989, Art. 4.1.2" },
      ]},
      { title: "Art. 4.1.3 – Percorsi Orizzontali – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "4.16 – I corridoi e i percorsi interni hanno larghezza ≥ 100 cm?", ref: "D.M. 236/1989, Art. 4.1.3" },
        { text: "4.17 – È previsto un allargamento a 150 cm ogni 10 m per consentire l'inversione di marcia?", ref: "D.M. 236/1989, Art. 4.1.3" },
        { text: "4.18 – I percorsi sono privi di ostacoli e sporgenze che riducano la larghezza utile?", ref: "D.M. 236/1989, Art. 4.1.3" },
      ]},
      { title: "Art. 4.1.4 – Scale – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "4.19 – Le scale comuni hanno larghezza ≥ 120 cm?", ref: "D.M. 236/1989, Art. 4.1.4" },
        { text: "4.20 – La pedata è ≥ 30 cm e l'alzata ≤ 16 cm?", ref: "D.M. 236/1989, Art. 4.1.4" },
        { text: "4.21 – Ogni rampa ha non più di 12 gradini consecutivi?", ref: "D.M. 236/1989, Art. 4.1.4" },
        { text: "4.22 – Nei pianerottoli è disponibile uno spazio di sosta per sedia a ruote?", ref: "D.M. 236/1989, Art. 4.1.4" },
        { text: "4.23 – È presente un segnale a pavimento 30 cm prima del primo e dell'ultimo scalino?", ref: "D.M. 236/1989, Art. 4.1.4" },
        { text: "4.24 – Il corrimano è continuo, bilaterale, ad altezza 90–100 cm (secondo corrimano per bambini a 75 cm)?", ref: "D.M. 236/1989, Art. 4.1.4" },
        { text: "4.25 – Il corrimano è distante dalla parete ≥ 4 cm e prolungato oltre il primo e l'ultimo gradino?", ref: "D.M. 236/1989, Art. 4.1.4" },
        { text: "4.26 – I gradini hanno profilo continuo, privi di sporgenze a naso?", ref: "D.M. 236/1989, Art. 4.1.4" },
      ]},
      { title: "Art. 4.1.5 – Rampe – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "4.27 – La pendenza longitudinale delle rampe è ≤ 8% (deroghe in adeguamento con grafico specifico)?", ref: "D.M. 236/1989, Art. 4.1.5" },
        { text: "4.28 – La larghezza della rampa è ≥ 90 cm (≥ 150 cm per incrocio)?", ref: "D.M. 236/1989, Art. 4.1.5" },
        { text: "4.29 – È presente un ripiano orizzontale ogni 10 m di sviluppo (min. 150×150 cm)?", ref: "D.M. 236/1989, Art. 4.1.5" },
        { text: "4.30 – I bordi liberi delle rampe sono protetti con cordolo ≥ 10 cm o parapetto?", ref: "D.M. 236/1989, Art. 4.1.5" },
        { text: "4.31 – È presente il corrimano su entrambi i lati della rampa?", ref: "D.M. 236/1989, Art. 4.1.5" },
      ]},
      { title: "Art. 4.1.6 – Ascensori – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "4.32 – La cabina ascensore (nuova costruzione non residenziale) è ≥ 140×110 cm?", ref: "D.M. 236/1989, Art. 4.1.6" },
        { text: "4.33 – La cabina ascensore (nuova costruzione residenziale) è ≥ 130×95 cm?", ref: "D.M. 236/1989, Art. 4.1.6" },
        { text: "4.34 – La piattaforma di manovra anteriore all'ascensore è ≥ 150×150 cm?", ref: "D.M. 236/1989, Art. 4.1.6" },
        { text: "4.35 – La porta della cabina ha luce netta ≥ 80 cm ed è di tipo scorrevole?", ref: "D.M. 236/1989, Art. 4.1.6" },
        { text: "4.36 – I pulsanti di comando sono tra 100 e 120 cm di altezza?", ref: "D.M. 236/1989, Art. 4.1.6" },
        { text: "4.37 – È presente segnalazione sonora e visiva di piano?", ref: "D.M. 236/1989, Art. 4.1.6" },
        { text: "4.38 – È presente specchio nella parete di fondo per consentire la manovra in retromarcia?", ref: "D.M. 236/1989, Art. 4.1.6" },
        { text: "4.39 – Il tempo di apertura delle porte è ≥ 8 secondi?", ref: "D.M. 236/1989, Art. 4.1.6" },
      ]},
      { title: "Art. 4.1.7 – Servizi Igienici – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "4.40 – Il locale bagno accessibile consente la rotazione di 360° (cerchio Ø 150 cm)?", ref: "D.M. 236/1989, Art. 4.1.7" },
        { text: "4.41 – L'asse del WC è a min. 40 cm dalla parete laterale?", ref: "D.M. 236/1989, Art. 4.1.7" },
        { text: "4.42 – Il bordo anteriore del WC è a 45–50 cm dalla parete frontale?", ref: "D.M. 236/1989, Art. 4.1.7" },
        { text: "4.43 – Il corrimano orizzontale è presente a 80 cm di altezza accanto al WC?", ref: "D.M. 236/1989, Art. 4.1.7" },
        { text: "4.44 – Il lavabo ha piano superiore a 80 cm, è senza colonna e con spazio frontale ≥ 80 cm?", ref: "D.M. 236/1989, Art. 4.1.7" },
        { text: "4.45 – La vasca ha spazio laterale ≥ 140 cm lungo la vasca (profondità min. 80 cm)?", ref: "D.M. 236/1989, Art. 4.1.7" },
        { text: "4.46 – Il box doccia, se presente, ha dimensioni ≥ 80×120 cm con sedile ribaltabile?", ref: "D.M. 236/1989, Art. 4.1.7" },
        { text: "4.47 – Gli accessori e i comandi del bagno sono posizionati tra 40 e 140 cm di altezza?", ref: "D.M. 236/1989, Art. 4.1.7" },
      ]},
      { title: "Art. 4.2 – Percorsi Esterni – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "4.48 – Il percorso esterno ha larghezza ≥ 90 cm?", ref: "D.M. 236/1989, Art. 4.2" },
        { text: "4.49 – La pendenza longitudinale del percorso esterno è ≤ 5%?", ref: "D.M. 236/1989, Art. 4.2" },
        { text: "4.50 – La pendenza trasversale del percorso esterno è ≤ 1%?", ref: "D.M. 236/1989, Art. 4.2" },
        { text: "4.51 – Il pavimento esterno è antisdrucciolo anche in condizioni di bagnato?", ref: "D.M. 236/1989, Art. 4.2" },
        { text: "4.52 – Sono presenti protezioni laterali (cordoli o parapetti) sui bordi liberi?", ref: "D.M. 236/1989, Art. 4.2" },
      ]},
      { title: "Art. 4.3 – Parcheggi – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "4.53 – I posti riservati ai disabili sono ≥ 1 ogni 50 posti totali (min. 1)?", ref: "D.M. 236/1989, Art. 4.3" },
        { text: "4.54 – La larghezza del posto riservato è ≥ 320 cm?", ref: "D.M. 236/1989, Art. 4.3" },
        { text: "4.55 – Il posto è posizionato in prossimità dell'ingresso accessibile e possibilmente coperto?", ref: "D.M. 236/1989, Art. 4.3" },
        { text: "4.56 – È presente il simbolo internazionale di accessibilità sul posto riservato?", ref: "D.M. 236/1989, Art. 4.3" },
      ]},
      { title: "Art. 4.4 – Terminali degli Impianti – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "4.57 – I terminali degli impianti (interruttori, campanelli, citofoni, ecc.) sono tra 40 e 140 cm di altezza?", ref: "D.M. 236/1989, Art. 4.4" },
        { text: "4.58 – Le cassette postali residenziali sono a un'altezza ≤ 140 cm?", ref: "D.M. 236/1989, Art. 4.4" },
      ]},
      { title: "Art. 4.5 – Arredi Fissi – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "4.59 – I parapetti hanno altezza ≥ 100 cm e sono inattraversabili da una sfera di Ø 10 cm?", ref: "D.M. 236/1989, Art. 4.5" },
        { text: "4.60 – Sono evitati spigoli vivi e superfici abrasive negli arredi fissi?", ref: "D.M. 236/1989, Art. 4.5" },
      ]},
      { title: "Art. 5 – Prescrizioni Tecniche per Edifici di E.R.P. – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "5.1 – Negli alloggi accessibili di ERP: lo spazio di rotazione Ø 150 cm è garantito in soggiorno, cucina, camera e bagno?", ref: "D.M. 236/1989, Art. 5.1" },
        { text: "5.2 – Negli alloggi accessibili di ERP: le porte hanno luce netta ≥ 80 cm?", ref: "D.M. 236/1989, Art. 5.1" },
        { text: "5.3 – Negli alloggi accessibili di ERP: corridoi e disimpegni hanno larghezza ≥ 100 cm?", ref: "D.M. 236/1989, Art. 5.1" },
        { text: "5.4 – Strutture ricettive: tutte le parti comuni e il numero prescritto di camere sono accessibili?", ref: "D.M. 236/1989, Art. 5.2" },
        { text: "5.5 – Strutture ricettive: le camere accessibili hanno servizio igienico accessibile annesso?", ref: "D.M. 236/1989, Art. 5.2" },
        { text: "5.6 – Edifici scolastici: aule, laboratori, palestre e servizi igienici sono accessibili?", ref: "D.M. 236/1989, Art. 5.3" },
        { text: "5.7 – Edifici per uffici aperti al pubblico: sportelli e banconi accessibili o con oblò a 80 cm?", ref: "D.M. 236/1989, Art. 5.4" },
        { text: "5.8 – Edifici aperti al pubblico (sup. > 250 mq): almeno un servizio igienico accessibile?", ref: "D.M. 236/1989, Art. 5.5" },
        { text: "5.9 – Edifici pubblici esistenti non ristrutturati: pulsante di chiamata con simbolo accessibilità all'ingresso?", ref: "D.M. 236/1989, Art. 5.7" },
      ]},
      { title: "Art. 6 – Criteri di Progettazione per l'Adattabilità – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "6.1 – L'edificio di nuova costruzione è progettato per consentire modifiche future di accessibilità a costi contenuti?", ref: "D.M. 236/1989, Art. 6" },
        { text: "6.2 – Il posizionamento e dimensionamento di servizi, disimpegni e porte è tale da consentire future trasformazioni?", ref: "D.M. 236/1989, Art. 6" },
        { text: "6.3 – Nelle unità immobiliari a più livelli: se non è possibile un servoscala, è previsto spazio per futura piattaforma elevatrice?", ref: "D.M. 236/1989, Art. 6" },
        { text: "6.4 – Negli interventi di ristrutturazione: i requisiti di adattabilità corrispondono a quelli della nuova edificazione (compatibilmente con i vincoli strutturali)?", ref: "D.M. 236/1989, Art. 6" },
        { text: "6.5 – L'eventuale installazione dell'ascensore nel vano scala non compromette la fruibilità delle rampe per l'evacuazione?", ref: "D.M. 236/1989, Art. 6" },
      ]},
      { title: "Art. 7 – Cogenza delle Prescrizioni – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "7.1 – Le specificazioni dell'Art. 8 sono rispettate, o sono state proposte soluzioni alternative documentate con relazione tecnica?", ref: "D.M. 236/1989, Art. 7" },
        { text: "7.2 – In caso di soluzioni alternative, il professionista abilitato ha certificato la conformità o equivalenza ai criteri di progettazione?", ref: "D.M. 236/1989, Art. 7" },
        { text: "7.3 – L'ufficio tecnico del Comune ha verificato la conformità del progetto prima del rilascio del titolo abilitativo?", ref: "D.M. 236/1989, Art. 7" },
        { text: "7.4 – Le eventuali deroghe (locali tecnici, ristrutturazioni con vincoli strutturali) sono state motivate e autorizzate dal Sindaco?", ref: "D.M. 236/1989, Art. 7" },
      ]},
      { title: "Art. 8 – Specifiche Dimensionali (Riepilogo) – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "8.1 – Spazio di rotazione 360° (sedia a ruote): cerchio Ø 150 cm disponibile nei punti necessari?", ref: "D.M. 236/1989, Art. 8" },
        { text: "8.2 – Spazio di rotazione 180° (inversione): area min. 140×170 cm disponibile?", ref: "D.M. 236/1989, Art. 8" },
        { text: "8.3 – Porta accesso edificio/unità immobiliare: luce netta ≥ 80 cm?", ref: "D.M. 236/1989, Art. 8" },
        { text: "8.4 – Porte interne: luce netta ≥ 75 cm?", ref: "D.M. 236/1989, Art. 8" },
        { text: "8.5 – Corridoi: larghezza ≥ 100 cm con allargamenti ogni 10 m?", ref: "D.M. 236/1989, Art. 8" },
        { text: "8.6 – Rampe: pendenza ≤ 8% (deroghe in adeguamento con grafico specifico)?", ref: "D.M. 236/1989, Art. 8" },
        { text: "8.7 – Rampe: larghezza ≥ 90 cm (sola persona) o ≥ 150 cm (incrocio)?", ref: "D.M. 236/1989, Art. 8" },
        { text: "8.8 – Rampe: ripiano orizzontale ogni 10 m di sviluppo (min. 150×150 cm)?", ref: "D.M. 236/1989, Art. 8" },
        { text: "8.9 – Scale comuni: larghezza ≥ 120 cm, pedata ≥ 30 cm, segnale a pavimento 30 cm da primo/ultimo scalino?", ref: "D.M. 236/1989, Art. 8" },
        { text: "8.10 – Corrimano: altezza 90–100 cm (secondo corrimano a 75 cm per bambini), distanza da parete ≥ 4 cm?", ref: "D.M. 236/1989, Art. 8" },
        { text: "8.11 – Ascensore (nuova costruzione non res.): cabina 140×110 cm; piattaforma anteriore 150×150 cm?", ref: "D.M. 236/1989, Art. 8" },
        { text: "8.12 – Ascensore (nuova costruzione res.): cabina 130×95 cm; piattaforma anteriore 150×150 cm?", ref: "D.M. 236/1989, Art. 8" },
        { text: "8.13 – WC: asse apparecchio a min. 40 cm dalla parete; bordo anteriore a 45–50 cm; corrimano a 80 cm h.?", ref: "D.M. 236/1989, Art. 8" },
        { text: "8.14 – Lavabo: piano superiore a 80 cm, senza colonna, spazio frontale ≥ 80 cm?", ref: "D.M. 236/1989, Art. 8" },
        { text: "8.15 – Vasca: spazio laterale ≥ 140 cm lungo la vasca, profondità min. 80 cm?", ref: "D.M. 236/1989, Art. 8" },
        { text: "8.16 – Percorso esterno: larghezza ≥ 90 cm, pendenza long. ≤ 5%, pendenza trasv. ≤ 1%?", ref: "D.M. 236/1989, Art. 8" },
        { text: "8.17 – Parcheggi: posti riservati disabili ≥ 1/50 posti, larghezza ≥ 320 cm, copertura preferibile?", ref: "D.M. 236/1989, Art. 8" },
        { text: "8.18 – Terminali impianti: posizionati tra 40 e 140 cm di altezza?", ref: "D.M. 236/1989, Art. 8" },
        { text: "8.19 – Cassette postali residenziali: altezza ≤ 140 cm?", ref: "D.M. 236/1989, Art. 8" },
        { text: "8.20 – Parapetti: altezza ≥ 100 cm, inattraversabili da sfera Ø 10 cm?", ref: "D.M. 236/1989, Art. 8" },
      ]},
      { title: "Artt. 10–11 – Elaborati Tecnici e Verifiche – D.M. 236/1989", group: "DM236_1989-Barriera architettonica", items: [
        { text: "10.1 – Gli elaborati tecnici evidenziano chiaramente le soluzioni per accessibilità, visitabilità e adattabilità?", ref: "D.M. 236/1989, Art. 10" },
        { text: "10.2 – È presente una relazione specifica con descrizione degli interventi di eliminazione barriere architettoniche?", ref: "D.M. 236/1989, Art. 10" },
        { text: "10.3 – Per l'adattabilità sono stati predisposti specifici elaborati grafici?", ref: "D.M. 236/1989, Art. 10" },
        { text: "11.1 – Il Sindaco ha verificato che le opere siano state realizzate nel rispetto della legge per il certificato di agibilità?", ref: "D.M. 236/1989, Art. 11" },
        { text: "11.2 – È stata prodotta, se richiesta, una perizia giurata da tecnico abilitato a conferma della conformità?", ref: "D.M. 236/1989, Art. 11" },
      ]},
    { title: "1. LOCALIZZAZIONE E PIANIFICAZIONE URBANISTICA", group: "DM18.12.75-Edilizia scolastica", items: [
        { text: "L'edificio scolastico è inserito in un piano urbanistico con localizzazione e dimensionamento verificati", ref: "D.M. 18/12/1975, 1.0.1" },
        { text: "L'edificio è concepito come parte di un 'continuum' educativo integrato nel contesto urbano", ref: "D.M. 18/12/1975, 1.0.2" },
        { text: "La localizzazione deriva da uno studio morfologico preliminare dell'ambiente", ref: "D.M. 18/12/1975, 1.1.1" },
        { text: "Sono stati considerati tipo di scuola, età e numero degli alunni nella scelta del sito", ref: "D.M. 18/12/1975, 1.1.1" },
        { text: "Sono rispettati i tempi/distanze massimi di percorrenza dalla residenza degli alunni (Tab. 1)", ref: "D.M. 18/12/1975, 1.1.3" },
        { text: "Il percorso casa-scuola è privo di attraversamenti pericolosi (strade ad alto traffico, ferrovie, ecc.)", ref: "D.M. 18/12/1975, 1.1.2" },
        { text: "L'ubicazione è lontana da depositi di rifiuti, acque stagnanti, industrie rumorose, cimiteri", ref: "D.M. 18/12/1975, 1.1.4 ii)" },
        { text: "L'edificio è in località aperta, possibilmente alberata, con buon soleggiamento", ref: "D.M. 18/12/1975, 1.1.4 i)" },
        { text: "L'edificio non è esposto a venti fastidiosi né sottovento a zone con esalazioni nocive", ref: "D.M. 18/12/1975, 1.1.4 iii)" },
      ]},
      { title: "2. DIMENSIONI DELL'EDIFICIO SCOLASTICO", group: "DM18.12.75-Edilizia scolastica", items: [
        { text: "La dimensione dell'edificio rientra nei limiti minimo e massimo previsti per il tipo di scuola (Tab. 1)", ref: "D.M. 18/12/1975, 1.2.2" },
        { text: "Scuola materna: min. 3 sezioni, max. 9 sezioni", ref: "D.M. 18/12/1975, 1.2.2 i)" },
        { text: "Scuola elementare: min. 5 classi, max. 25 classi", ref: "D.M. 18/12/1975, 1.2.2 ii)" },
        { text: "Scuola media: min. 6 classi, max. 24 classi", ref: "D.M. 18/12/1975, 1.2.2 iii)" },
        { text: "Scuola secondaria superiore: min. 10 classi (250 alunni), max. 60 classi (1500 alunni)", ref: "D.M. 18/12/1975, 1.2.2 iv)" },
      ]},
      { title: "3. AREA – CARATTERISTICHE E AMPIEZZA", group: "DM18.12.75-Edilizia scolastica", items: [
        { text: "L'area è di forma regolare e possibilmente pianeggiante", ref: "D.M. 18/12/1975, 2.0.1 i)" },
        { text: "Il terreno non è umido, soggetto a infiltrazioni, franoso o con caratteristiche meccaniche inadatte", ref: "D.M. 18/12/1975, 2.0.1 ii)" },
        { text: "L'area ha accessi comodi e ampi con opere stradali per perfetta viabilità", ref: "D.M. 18/12/1975, 2.0.1 iv)" },
        { text: "L'ingresso principale è arretrato rispetto al filo stradale", ref: "D.M. 18/12/1975, 2.0.1 v)" },
        { text: "L'area non ha accessi diretti da strade statali o provinciali", ref: "D.M. 18/12/1975, 2.0.1 vi)" },
        { text: "L'area non coperta è congruamente alberata, sistemata a verde e attrezzata per attività all'aperto", ref: "D.M. 18/12/1975, 2.0.2" },
        { text: "L'ampiezza minima dell'area rispetta i valori prescritti in Tabella 2", ref: "D.M. 18/12/1975, 2.1.2" },
        { text: "L'area coperta dagli edifici non supera 1/3 dell'area totale", ref: "D.M. 18/12/1975, 2.1.3" },
        { text: "Il rapporto area parcheggi/volume edificio è ≥ 1 m² per ogni 20 m³ di costruzione", ref: "D.M. 18/12/1975, 2.1.4" },
      ]},
      { title: "4. CARATTERISTICHE GENERALI DELL'OPERA", group: "DM18.12.75-Edilizia scolastica", items: [
        { text: "Il progetto prevede tutti gli impianti, servizi, arredi e sistemazione dell'area", ref: "D.M. 18/12/1975, 3.0.1" },
        { text: "Sono previsti locali per attività didattiche e parascolastiche", ref: "D.M. 18/12/1975, 3.0.2 i)" },
        { text: "Sono previsti locali per educazione fisica e sportiva", ref: "D.M. 18/12/1975, 3.0.2 ii)" },
        { text: "Sono previsti locali per medicina scolastica (D.P.R. 22/12/1967 n. 1518)", ref: "D.M. 18/12/1975, 3.0.2 iii)" },
        { text: "È previsto alloggio per il custode (se richiesto dall'ente obbligato)", ref: "D.M. 18/12/1975, 3.0.2 iv)" },
        { text: "È prevista la mensa scolastica (se non altrimenti assicurata)", ref: "D.M. 18/12/1975, 3.0.2 v)" },
        { text: "L'edificio è concepito come organismo architettonico omogeneo (non semplice addizione di spazi)", ref: "D.M. 18/12/1975, 3.0.3 i)" },
        { text: "Gli spazi scolastici garantiscono la massima flessibilità con pareti/porte scorrevoli e arredi mobili", ref: "D.M. 18/12/1975, 3.0.3 iii)" },
        { text: "Le partizioni interne sono rimovibili senza modifiche a pavimenti, soffitti e impianti", ref: "D.M. 18/12/1975, 3.0.3 iv)" },
        { text: "Le attività della scuola materna si svolgono a diretto contatto con il terreno di gioco", ref: "D.M. 18/12/1975, 3.0.4 i)" },
        { text: "Scuola elementare/media: sviluppo normalmente su 1-2 piani (ulteriori piani previa autorizzazione)", ref: "D.M. 18/12/1975, 3.0.4 ii)" },
        { text: "Scuola secondaria di 2° grado: sviluppo normalmente su 3 piani", ref: "D.M. 18/12/1975, 3.0.4 iii)" },
        { text: "I locali in piani seminterrati sono esclusivamente depositi o centrali termiche/elettriche", ref: "D.M. 18/12/1975, 3.0.6" },
        { text: "L'edificio è accessibile agli alunni con minorazione fisica (norme circolare n. 4809/1968 – ora D.P.R. 384/1978)", ref: "D.M. 18/12/1975, 3.0.7" },
        { text: "Non vi sono cortili chiusi su cui si affacciano spazi didattici (salvo verifica calcolo illuminazione)", ref: "D.M. 18/12/1975, 3.0.8" },
        { text: "La distanza libera tra finestre di spazi didattici e pareti opposte è ≥ 4/3 dell'altezza del corpo prospiciente e comunque ≥ 12 m", ref: "D.M. 18/12/1975, 3.0.8" },
        { text: "Le altezze nette di piano rispettano i valori standard prescritti in Tabella 4", ref: "D.M. 18/12/1975, 3.0.9" },
      ]},
      { title: "5. SPAZI PER L'UNITÀ PEDAGOGICA (AULE)", group: "DM18.12.75-Edilizia scolastica", items: [
        { text: "Scuola materna: max 3 sezioni condividono gli stessi spazi comuni (escluse mensa e lavanderia)", ref: "D.M. 18/12/1975, 3.1.1 i)" },
        { text: "Scuola materna: previsti spazi separati per attività ordinate, libere e pratiche", ref: "D.M. 18/12/1975, 3.1.1 ii)" },
        { text: "Scuola materna: spazio per attività ordinate serve una sola sezione", ref: "D.M. 18/12/1975, 3.1.1 iii)" },
        { text: "Scuola materna: spazio mensa previsto con cucina, dispensa e servizi", ref: "D.M. 18/12/1975, 3.1.1 vi)" },
        { text: "Scuola materna: spazi in stretta relazione con l'esterno organizzato e previsti spazi coperti aperti", ref: "D.M. 18/12/1975, 3.1.1 vii)" },
        { text: "Scuola elementare: possibile continuità spaziale tra aule dello stesso ciclo (pareti mobili)", ref: "D.M. 18/12/1975, 3.1.2 ii)" },
        { text: "Scuola elementare: aule del primo ciclo a diretto contatto con lo spazio all'aperto", ref: "D.M. 18/12/1975, 3.1.2 iii)" },
        { text: "Scuola media: flessibilità interna ed esterna degli spazi per attività individuali e di gruppo", ref: "D.M. 18/12/1975, 3.1.3 i)" },
        { text: "Scuola secondaria 2° grado: partizioni interne facilmente rimovibili, pavimento e soffitto continui", ref: "D.M. 18/12/1975, 3.1.4" },
      ]},
      { title: "6. SPAZI PER INSEGNAMENTO SPECIALIZZATO (AULE SPECIALI E LABORATORI)", group: "DM18.12.75-Edilizia scolastica", items: [
        { text: "Scuola media: previsto spazio per osservazioni scientifiche (deposito + ambiente per insegnamento)", ref: "D.M. 18/12/1975, 3.2.1 i)" },
        { text: "Scuola media: previsto spazio per applicazioni tecniche (deposito + spazio di insegnamento)", ref: "D.M. 18/12/1975, 3.2.1 ii)" },
        { text: "Scuola media: previsto spazio per educazione artistica con possibilità di mostre", ref: "D.M. 18/12/1975, 3.2.1 iii)" },
        { text: "Scuola media: previsto spazio per educazione musicale (acusticamente predisposto, con podio)", ref: "D.M. 18/12/1975, 3.2.1 iv)" },
        { text: "Scuola secondaria 2° grado: spazi speciali corredati di ambienti per preparazione, studio insegnante, magazzino", ref: "D.M. 18/12/1975, 3.2.2 i)" },
        { text: "Spazi speciali dotati di impianti flessibili (gas, elettricità, acqua, scarico, cappe aspiranti)", ref: "D.M. 18/12/1975, 3.2.2 ii)" },
        { text: "Laboratori e officine: caratteristiche definite dal Capo dell'istituto", ref: "D.M. 18/12/1975, 3.3" },
      ]},
      { title: "7. SPAZI PER COMUNICAZIONE, INFORMAZIONE E ATTIVITÀ PARASCOLASTICHE", group: "DM18.12.75-Edilizia scolastica", items: [
        { text: "Scuola elementare: previsto spazio per attività collettive flessibile (ginnastica ritmica, musica, ecc.)", ref: "D.M. 18/12/1975, 3.4.1 i)" },
        { text: "Scuola elementare: prevista biblioteca riservata agli insegnanti", ref: "D.M. 18/12/1975, 3.4.1 ii)" },
        { text: "Scuola media/sec.: previsto spazio polivalente per grandi gruppi, spettacoli, assemblee (max 500 posti)", ref: "D.M. 18/12/1975, 3.4.2 i)" },
        { text: "Auditorio: conformità norme sicurezza antincendio Ministero Interno", ref: "D.M. 18/12/1975, 3.4.2 i)" },
        { text: "Auditorio: accesso rapido dall'esterno e nucleo di servizi igienici", ref: "D.M. 18/12/1975, 3.4.2 i)" },
        { text: "Biblioteca: previsto spazio per cataloghi, personale, consultazione/lettura con scaffali accessibili", ref: "D.M. 18/12/1975, 3.4.2 ii)" },
        { text: "Previsti locali per attività degli organi collegiali (decreti delegati) e incontri scuola-famiglia", ref: "D.M. 18/12/1975, 3.4.2 iii)" },
      ]},
      { title: "8. SPAZI PER EDUCAZIONE FISICA E SPORTIVA", group: "DM18.12.75-Edilizia scolastica", items: [
        { text: "Tipo di palestra correttamente selezionato in base al tipo e numero di classi (A1/A2/B1/B2)", ref: "D.M. 18/12/1975, 3.5.1" },
        { text: "Palestra tipo A1 (200 m²): per scuole elementari 10-25 cl., medie 6-20 cl., sec. 10-14 cl.", ref: "D.M. 18/12/1975, 3.5.1" },
        { text: "Palestra tipo A2 (2×200 m²): per scuole medie 21-24 cl., sec. 15-23 cl.", ref: "D.M. 18/12/1975, 3.5.1" },
        { text: "Palestra tipo B1 (600 m² regolamentare): per scuole sec. 2° grado 24-60 cl.", ref: "D.M. 18/12/1975, 3.5.1" },
        { text: "Palestra: prevista zona insegnanti con servizi igienici e doccia", ref: "D.M. 18/12/1975, 3.5.1" },
        { text: "Palestra: previsti spogliatoi, servizi igienici e docce per allievi (accesso da spogliatoi)", ref: "D.M. 18/12/1975, 3.5.1" },
        { text: "Palestra: previsto locale per servizio sanitario e visita medica", ref: "D.M. 18/12/1975, 3.5.1" },
        { text: "Palestra: previsto deposito attrezzi e materiali", ref: "D.M. 18/12/1975, 3.5.1" },
        { text: "Palestra: accesso indipendente per uso extra-scolastico e impianti autonomi", ref: "D.M. 18/12/1975, 3.5.1" },
        { text: "Scuola media: previste aree esterne con pista 100m (4-6 corsie), salto alto/lungo, lancio disco, campo polivalente", ref: "D.M. 18/12/1975, 3.5.2 i)" },
        { text: "Scuola sec. 2° grado: previste aree esterne con pista, salto con l'asta, lancio peso/disco, campo polivalente", ref: "D.M. 18/12/1975, 3.5.2 ii)" },
      ]},
      { title: "9. SPAZI PER LA MENSA", group: "DM18.12.75-Edilizia scolastica", items: [
        { text: "La superficie della mensa (inclusi i servizi) non supera 375 m²", ref: "D.M. 18/12/1975, 3.6.1" },
        { text: "Previsto locale cucina con accesso razionale e attrezzature", ref: "D.M. 18/12/1975, 3.6.2 i)" },
        { text: "Prevista dispensa per derrate con frigorifero e accesso proprio", ref: "D.M. 18/12/1975, 3.6.2 ii)" },
        { text: "Previsti anticucina e locale per lavaggio stoviglie", ref: "D.M. 18/12/1975, 3.6.2 iii)" },
        { text: "Previsto spogliatoio, doccia e servizi igienici per il personale separati da idonei disimpegni", ref: "D.M. 18/12/1975, 3.6.2 iv)" },
        { text: "Previsto spazio con lavabi per la pulizia degli allievi", ref: "D.M. 18/12/1975, 3.6.2 v)" },
      ]},
      { title: "10. SPAZI PER L'AMMINISTRAZIONE", group: "DM18.12.75-Edilizia scolastica", items: [
        { text: "Il nucleo di direzione è ubicato possibilmente al piano terreno", ref: "D.M. 18/12/1975, 3.7.1" },
        { text: "Previsto ufficio del preside/direttore con sala di aspetto in posizione baricentrica", ref: "D.M. 18/12/1975, 3.7.1 i)" },
        { text: "Previsti locali per segreteria e archivio con sportello per il pubblico", ref: "D.M. 18/12/1975, 3.7.1 ii)" },
        { text: "Prevista sala insegnanti con scaffali e spazio per riunioni del consiglio d'istituto", ref: "D.M. 18/12/1975, 3.7.1 iii)" },
        { text: "Previsti servizi igienici e spogliatoio per presidenza e insegnanti", ref: "D.M. 18/12/1975, 3.7.1 iv)" },
      ]},
      { title: "11. SPAZI PER LA DISTRIBUZIONE (CIRCOLAZIONE)", group: "DM18.12.75-Edilizia scolastica", items: [
        { text: "In edifici a più piani: prevista almeno una scala normale e una scala di sicurezza esterna", ref: "D.M. 18/12/1975, 3.8.1" },
        { text: "Ogni scala (esclusa sicurezza) serve al max 10 aule per piano sopra il piano terreno", ref: "D.M. 18/12/1975, 3.8.1 i)" },
        { text: "Larghezza rampe scale: 0,5 cm per allievo, min. 1,20 m, max. 2 m", ref: "D.M. 18/12/1975, 3.8.1 ii)" },
        { text: "Ripiani di larghezza pari a circa 1,25 volte quella delle rampe", ref: "D.M. 18/12/1975, 3.8.1 iii)" },
        { text: "Gradini: altezza ≤ 16 cm, pedata ≥ 30 cm", ref: "D.M. 18/12/1975, 3.8.1 iv)" },
        { text: "Edifici con più di un piano: ascensore per sedia a ruote + accompagnatore (norme E.N.P.I.)", ref: "D.M. 18/12/1975, 3.8.2" },
        { text: "Corridoi di disimpegno: larghezza ≥ 2 m (≥ 2,50 m se con spogliatoi)", ref: "D.M. 18/12/1975, 3.8.3" },
      ]},
      { title: "12. SERVIZI IGIENICO-SANITARI E SPOGLIATOI", group: "DM18.12.75-Edilizia scolastica", items: [
        { text: "Scuola materna: 3 vasi per sezione; altri tipi: 1 vaso per classe + vasi supplementari", ref: "D.M. 18/12/1975, 3.9.1 i)" },
        { text: "Latrine illuminate e aerate direttamente (o con impianto di aerazione nell'antilatrina)", ref: "D.M. 18/12/1975, 3.9.1 i)" },
        { text: "Latrine separate per sesso (eccetto scuola materna)", ref: "D.M. 18/12/1975, 3.9.1 ii)" },
        { text: "Box latrine con pareti divisorie h. 2,10÷2,30 m (eccetto scuola materna)", ref: "D.M. 18/12/1975, 3.9.1 ii)" },
        { text: "Porte delle latrine apribili verso l'esterno, sollevate dal pavimento, con chiusura dall'interno apribile dall'esterno in emergenza", ref: "D.M. 18/12/1975, 3.9.1 ii)" },
        { text: "Impianti col sistema a caduta d'acqua con cassetta di lavaggio o equivalente con scarico automatico/comandato", ref: "D.M. 18/12/1975, 3.9.1 ii)" },
        { text: "Orinatoi nei locali maschi con adeguata schermatura; lavabi ad acqua grondante; fontanelle con acqua potabile a getto parabolico", ref: "D.M. 18/12/1975, 3.9.1 iii)" },
        { text: "Docce: singole, con antidoccia, miscelatore automatico caldo/freddo, soffione inclinato verso spalle", ref: "D.M. 18/12/1975, 3.9.1 v)" },
        { text: "Previsto almeno un gabinetto per piano per disabili: dim. min. 1,80×1,80 m", ref: "D.M. 18/12/1975, 3.9.2" },
        { text: "Spogliatoi (se previsti): larghezza minima 1,60 m", ref: "D.M. 18/12/1975, 3.9.3" },
      ]},
      { title: "13. ARREDAMENTO E ATTREZZATURE", group: "DM18.12.75-Edilizia scolastica", items: [
        { text: "Tutti i locali sono dotati di arredi e attrezzature per le attività didattiche previste", ref: "D.M. 18/12/1975, 4.0.1 i)" },
        { text: "Previste attrezzature per l'educazione fisica", ref: "D.M. 18/12/1975, 4.0.1 ii)" },
        { text: "Previsti sussidi audiovisivi", ref: "D.M. 18/12/1975, 4.0.1 iii)" },
        { text: "Arredi adeguati per dimensioni all'età degli alunni e al tipo di scuola (norme UNI)", ref: "D.M. 18/12/1975, 4.1.1" },
        { text: "Superfici di lavoro conformi alle norme anti-abbagliamento per riflessione (punto 5.2.4)", ref: "D.M. 18/12/1975, 4.1.2" },
      ]},
      { title: "14. CONDIZIONI ACUSTICHE", group: "DM18.12.75-Edilizia scolastica", items: [
        { text: "Potere fonoisolante pareti divisorie interne: indice I ≥ 40 dB", ref: "D.M. 18/12/1975, 5.1.2 iii)" },
        { text: "Potere fonoisolante infissi verso esterno: I ≥ 25 dB", ref: "D.M. 18/12/1975, 5.1.2 iii)" },
        { text: "Potere fonoisolante griglie/prese d'aria verso esterno: I ≥ 20 dB", ref: "D.M. 18/12/1975, 5.1.2 iii)" },
        { text: "Livello rumore di calpestio normalizzato solai: I ≤ 68 dB", ref: "D.M. 18/12/1975, 5.1.2 iii)" },
        { text: "Isolamento acustico per via aerea tra ambienti adiacenti in opera: I ≥ 40 dB", ref: "D.M. 18/12/1975, 5.1.2 v)" },
        { text: "Isolamento acustico tra ambienti sovrapposti in opera: I ≥ 42 dB", ref: "D.M. 18/12/1975, 5.1.2 v)" },
        { text: "Rumorosità servizi discontinui ≤ 50 dB(A); servizi continui ≤ 40 dB(A)", ref: "D.M. 18/12/1975, 5.1.2 vi)" },
        { text: "Tempo di riverberazione nelle aule arredate entro i valori previsti (figg. 4-5)", ref: "D.M. 18/12/1975, 5.1.1 vi)" },
      ]},
      { title: "15. CONDIZIONI DI ILLUMINAZIONE", group: "DM18.12.75-Edilizia scolastica", items: [
        { text: "Illuminamento sul piano di lavoro in spazi per disegno/cucito/lavagne: ≥ 300 lux", ref: "D.M. 18/12/1975, 5.2.2" },
        { text: "Illuminamento in spazi per lezione, studio, lettura, laboratori, uffici: ≥ 200 lux", ref: "D.M. 18/12/1975, 5.2.2" },
        { text: "Illuminamento in spazi per riunioni, ginnastica (piano a 0,60 m): ≥ 100 lux", ref: "D.M. 18/12/1975, 5.2.2" },
        { text: "Illuminamento in corridoi, scale, servizi igienici (piano a 1,00 m): ≥ 100 lux", ref: "D.M. 18/12/1975, 5.2.2" },
        { text: "Fattore medio luce diurna ambienti didattici ≥ 0,03; palestre/refettori ≥ 0,02; uffici/scale ≥ 0,01", ref: "D.M. 18/12/1975, 5.2.5" },
        { text: "Non vi sono fenomeni di abbagliamento (luminanze non superiori a 20× i valori medi nel campo visuale)", ref: "D.M. 18/12/1975, 5.2.4" },
        { text: "Integrazione tra illuminazione naturale e artificiale garantita", ref: "D.M. 18/12/1975, 5.2.3" },
        { text: "Locali didattici dotati di dispositivi per attenuare/oscurare l'illuminazione naturale (proiezioni)", ref: "D.M. 18/12/1975, 5.2.6" },
        { text: "Illuminazione artificiale con lampade/tubi fluorescenti integrati nell'impianto elettrico", ref: "D.M. 18/12/1975, 5.2.7" },
      ]},
      { title: "16. CONDIZIONI TERMOIGROMETRICHE E PUREZZA DELL'ARIA", group: "DM18.12.75-Edilizia scolastica", items: [
        { text: "Trasmittanza H pareti verticali esterne opache entro i valori prescritti per la massa M (Tab. 5.3.7)", ref: "D.M. 18/12/1975, 5.3.7" },
        { text: "Trasmittanza H coperture e solai su ambienti aperti entro i valori prescritti (Tab. 5.3.7)", ref: "D.M. 18/12/1975, 5.3.7" },
        { text: "Trasmittanza H chiusure trasparenti: ≤ 5,5 Cal/m²h°C (zona costiera/isole); ≤ 3,5 Cal/m²h°C (Nord/> 500 m)", ref: "D.M. 18/12/1975, 5.3.8" },
        { text: "Superfici trasparenti dotate di schermature esterne ventilate mobili (flusso solare ridotto a max 30%)", ref: "D.M. 18/12/1975, 5.3.10" },
        { text: "Impianto di riscaldamento garantisce temperatura interna 20°C ± 2°C in condizioni invernali di progetto", ref: "D.M. 18/12/1975, 5.3.11" },
        { text: "Umidità relativa ambienti didattici in inverno 45-55% (tramite impianto di umidificazione)", ref: "D.M. 18/12/1975, 5.3.11" },
        { text: "Coefficiente di ricambio aria: sc. materna/elementare 2,5; sc. media 3,5; sc. sec. 2° grado 5", ref: "D.M. 18/12/1975, 5.3.12 i)" },
        { text: "Coefficiente di ricambio aria: ambienti di passaggio/uffici 1,5; servizi igienici/palestre/refettori 2,5", ref: "D.M. 18/12/1975, 5.3.12 ii-iii)" },
        { text: "In nessun punto superficie interna chiusure opache la temperatura scende sotto 14°C (con T° esterna di progetto)", ref: "D.M. 18/12/1975, 5.3.16" },
        { text: "Chiusura esterna assicura tenuta all'aria (pressione statica 10 mm H₂O con ≤ 10 m³/h per m²)", ref: "D.M. 18/12/1975, 5.3.14" },
        { text: "Chiusure esterne impermeabili all'acqua (aumento peso ≤ 5% dopo 3h di prova)", ref: "D.M. 18/12/1975, 5.3.15" },
        { text: "Materiali isolanti protetti da idonee barriere antivapore contro condensazione", ref: "D.M. 18/12/1975, 5.3.17" },
      ]},
      { title: "17. CONDIZIONI DI SICUREZZA", group: "DM18.12.75-Edilizia scolastica", items: [
        { text: "Progetto e calcoli strutturali conformi a tutte le norme vigenti (generali e locali)", ref: "D.M. 18/12/1975, 5.4.2" },
        { text: "Sovraccarichi accidentali solai rispettati: coperture impraticabili 150 kg/m²; palestre 500 kg/m²; scale/terrazze 400 kg/m²; altri locali 350 kg/m²", ref: "D.M. 18/12/1975, 5.4.2 i)" },
        { text: "Verifiche azioni da vento e neve secondo norma CNR-UNI 10012-67", ref: "D.M. 18/12/1975, 5.4.2 iii)" },
        { text: "Pareti resistenti all'urto di corpo molle: ≥ 25 kgm (norme ICITE)", ref: "D.M. 18/12/1975, 5.4.2 iv)" },
        { text: "Tutti gli impianti conformi a D.P.R. 27/4/1955 n. 547 (prevenzione infortuni) e norme E.N.P.I.", ref: "D.M. 18/12/1975, 5.4.3" },
        { text: "Centrale termica conforme a L. 13/7/1966 n. 615 (inquinamento) e norme antincendio Min. Interno", ref: "D.M. 18/12/1975, 5.4.3 iii)" },
        { text: "Rispettate le disposizioni vigenti per la prevenzione incendi", ref: "D.M. 18/12/1975, 5.4.5" },
        { text: "Previsto impianto di protezione dai fulmini (parafulmine)", ref: "D.M. 18/12/1975, 5.4.6" },
        { text: "Sorgenti luminose in laboratori/officine/palestre protette da urti, vibrazioni, vapori corrosivi", ref: "D.M. 18/12/1975, 5.4.7" },
        { text: "Porte di accesso alla scuola e a tutti i locali di uso collettivo apribili verso l'esterno", ref: "D.M. 18/12/1975, 5.4.9" },
      ]},
      { title: "18. SUPERFICI LORDE E INDICI STANDARD (TABELLE)", group: "DM18.12.75-Edilizia scolastica", items: [
        { text: "Superfici lorde per alunno conformi ai valori orientativi della Tabella 3 per il tipo di scuola", ref: "D.M. 18/12/1975, Tab. 3" },
        { text: "Indici di superficie netta rispettano i valori prescritti in Tab. 5 (sc. materna)", ref: "D.M. 18/12/1975, Tab. 5" },
        { text: "Indici di superficie netta rispettano i valori prescritti in Tab. 6 (sc. elementare)", ref: "D.M. 18/12/1975, Tab. 6" },
        { text: "Indici di superficie netta rispettano i valori prescritti in Tab. 7 (sc. media)", ref: "D.M. 18/12/1975, Tab. 7" },
        { text: "Indici di superficie netta rispettano i valori prescritti in Tab. 8 (liceo classico)", ref: "D.M. 18/12/1975, Tab. 8" },
        { text: "Indici di superficie netta rispettano i valori prescritti in Tab. 9 (liceo scientifico)", ref: "D.M. 18/12/1975, Tab. 9" },
        { text: "Indici di superficie netta rispettano i valori prescritti in Tab. 10 (ist. magistrale)", ref: "D.M. 18/12/1975, Tab. 10" },
        { text: "Indici di superficie netta rispettano i valori prescritti in Tab. 11 (istituti tecnici commerciali)", ref: "D.M. 18/12/1975, Tab. 11" },
        { text: "Indici di superficie netta rispettano i valori prescritti in Tab. 12 (istituto per geometri)", ref: "D.M. 18/12/1975, Tab. 12" },
      ]},
      { title: "D.M. 236/1989 – ART. 1 – CAMPO DI APPLICAZIONE", group: "DM236_1989-Barriera architettonica", items: [
        { text: "L'edificio è di nuova costruzione privata (residenziale o non residenziale)?", ref: "D.M. 236/1989, 1.1" },
        { text: "L'edificio rientra nell'edilizia residenziale pubblica sovvenzionata/agevolata di nuova costruzione?", ref: "D.M. 236/1989, 1.2" },
        { text: "L'intervento riguarda la ristrutturazione di edifici privati (anche preesistenti)?", ref: "D.M. 236/1989, 1.3" },
        { text: "Sono compresi gli spazi esterni di pertinenza dell'edificio?", ref: "D.M. 236/1989, 1.4" },
      ]},
      { title: "D.M. 236/1989 – 3.2 – Accessibilità obbligatoria", group: "DM236_1989-Barriera architettonica", items: [
        { text: "Esiste almeno un percorso esterno fruibile da persone con ridotte/impedite capacità motorie o sensoriali (Art. 3.2a)?", ref: "D.M. 236/1989, 3.1" },
        { text: "Le parti comuni dell'edificio sono accessibili (Art. 3.2b)?", ref: "D.M. 236/1989, 3.2" },
        { text: "Negli edifici residenziali con NON più di 3 livelli fuori terra: è prevista la possibilità di installare meccanismi di accesso ai piani (servoscala) in futuro?", ref: "D.M. 236/1989, 3.3" },
        { text: "L'ascensore è installato se l'accesso alla più alta unità immobiliare supera il 3° livello (compresi interrati/porticati)?", ref: "D.M. 236/1989, 3.4" },
      ]},
      { title: "D.M. 236/1989 – 3.3 – Accessibilità di specifiche categorie", group: "DM236_1989-Barriera architettonica", items: [
        { text: "Almeno il 5% degli alloggi (min. 1) è accessibile nell'edilizia residenziale sovvenzionata (Art. 3.3a)?", ref: "D.M. 236/1989, 3.5" },
        { text: "Gli ambienti destinati ad attività scolastiche, sanitarie, assistenziali, culturali, sportive sono accessibili (Art. 3.3b)?", ref: "D.M. 236/1989, 3.6" },
        { text: "Gli edifici sedi di aziende soggette al collocamento obbligatorio rispettano le norme di accessibilità (Art. 3.3c)?", ref: "D.M. 236/1989, 3.7" },
      ]},
      { title: "D.M. 236/1989 – 3.4 – Visitabilità", group: "DM236_1989-Barriera architettonica", items: [
        { text: "Negli edifici residenziali: soggiorno/pranzo, un servizio igienico e i percorsi interni sono accessibili (Art. 3.4a)?", ref: "D.M. 236/1989, 3.8" },
        { text: "Nelle unità sedi di riunioni/spettacoli: almeno una zona pubblica e un servizio igienico sono accessibili (Art. 3.4b)?", ref: "D.M. 236/1989, 3.9" },
        { text: "Nelle strutture ricettive: tutte le parti comuni e il numero prescritto di stanze sono accessibili (Art. 3.4c)?", ref: "D.M. 236/1989, 3.10" },
        { text: "Nei luoghi di culto: almeno una zona per i fedeli è accessibile (Art. 3.4d)?", ref: "D.M. 236/1989, 3.11" },
        { text: "Nelle unità aperte al pubblico (sup. ≥ 250 mq): spazi di relazione e almeno un servizio igienico accessibili (Art. 3.4e)?", ref: "D.M. 236/1989, 3.12" },
        { text: "Nei luoghi di lavoro non aperti al pubblico e non soggetti al collocamento obbligatorio: è soddisfatto il requisito di adattabilità (Art. 3.4f)?", ref: "D.M. 236/1989, 3.13" },
        { text: "Negli edifici residenziali unifamiliari o plurifamiliari privi di parti comuni: è soddisfatto il requisito di adattabilità (Art. 3.4g)?", ref: "D.M. 236/1989, 3.14" },
      ]},
      { title: "D.M. 236/1989 – ART. 4 – CRITERI DI PROGETTAZIONE PER L'ACCESSIBILITÀ", group: "DM236_1989-Barriera architettonica", items: [
        { text: "La luce netta della porta d'accesso all'edificio e alle singole unità immobiliari è ≥ 80 cm?", ref: "D.M. 236/1989, 4.1" },
        { text: "La luce netta delle altre porte interne è ≥ 75 cm?", ref: "D.M. 236/1989, 4.2" },
        { text: "Gli spazi antistanti e retrostanti la porta consentono le manovre con sedia a ruote?", ref: "D.M. 236/1989, 4.3" },
        { text: "Il vano porta e gli spazi antistanti/retrostanti sono complanari (salvo deroghe in ristrutturazione)?", ref: "D.M. 236/1989, 4.4" },
        { text: "L'altezza delle maniglie è compresa tra 85 e 95 cm (consigliata 90 cm)?", ref: "D.M. 236/1989, 4.5" },
        { text: "Le singole ante non superano la larghezza di 120 cm?", ref: "D.M. 236/1989, 4.6" },
        { text: "Gli eventuali vetri nelle porte sono collocati ad almeno 40 cm dal pavimento?", ref: "D.M. 236/1989, 4.7" },
        { text: "La forza necessaria ad aprire l'anta mobile non supera 8 kg?", ref: "D.M. 236/1989, 4.8" },
        { text: "Le porte vetrate sono dotate di segnali visibili (ad es. bande colorate)?", ref: "D.M. 236/1989, 4.9" },
        { text: "Sono preferite maniglie a leva opportunamente curvate e arrotondate?", ref: "D.M. 236/1989, 4.10" },
        { text: "I pavimenti sono orizzontali e complanari tra loro?", ref: "D.M. 236/1989, 4.11" },
        { text: "I pavimenti nelle parti comuni e di uso pubblico sono antisdrucciolevoli?", ref: "D.M. 236/1989, 4.12" },
        { text: "Eventuali dislivelli non superano 2,5 cm e sono segnalati con variazioni cromatiche?", ref: "D.M. 236/1989, 4.13" },
        { text: "I grigliati nei calpestii hanno maglie tali da non ostacolare ruote/bastoni (vuoti < 2 cm)?", ref: "D.M. 236/1989, 4.14" },
        { text: "Gli zerbini sono incassati e le guide solidamente ancorate?", ref: "D.M. 236/1989, 4.15" },
        { text: "Nelle parti comuni è garantita una chiara individualizzazione dei percorsi (es. pavimenti differenziati)?", ref: "D.M. 236/1989, 4.16" },
        { text: "Porte, finestre e porte-finestre sono facilmente utilizzabili da persone con ridotte capacità motorie?", ref: "D.M. 236/1989, 4.17" },
        { text: "I meccanismi di apertura/chiusura sono facilmente manovrabili con lieve pressione (≤ 8 kg)?", ref: "D.M. 236/1989, 4.18" },
        { text: "L'altezza delle maniglie/dispositivi di comando è compresa tra 100 e 130 cm (consigliata 115 cm)?", ref: "D.M. 236/1989, 4.19" },
        { text: "La parte opaca del parapetto non supera 60 cm di altezza (con parapetto totale ≥ 100 cm inattraversabile da sfera Ø 10 cm)?", ref: "D.M. 236/1989, 4.20" },
        { text: "La disposizione degli arredi fissi consente il transito con sedia a ruote?", ref: "D.M. 236/1989, 4.21" },
        { text: "Le cassette postali negli edifici residenziali sono collocate ad altezza ≤ 140 cm?", ref: "D.M. 236/1989, 4.22" },
        { text: "Nei luoghi pubblici con banconi, almeno una parte del bancone ha piano d'uso a 90 cm dal calpestio?", ref: "D.M. 236/1989, 4.23" },
        { text: "I cancelletti/bussole sono dimensionati e manovrabili per consentire il passaggio di una sedia a ruote?", ref: "D.M. 236/1989, 4.24" },
        { text: "I sistemi automatici di apertura/chiusura sono temporizzati per consentire il passaggio a persone disabili?", ref: "D.M. 236/1989, 4.25" },
        { text: "Apparecchi elettrici, quadri, valvole, rubinetti d'arresto, regolatori, campanelli, citofoni sono posizionati tra 40 e 140 cm di altezza?", ref: "D.M. 236/1989, 4.26" },
        { text: "I terminali sono facilmente individuabili anche in condizioni di scarsa visibilità?", ref: "D.M. 236/1989, 4.27" },
        { text: "I terminali sono protetti dal danneggiamento per urto?", ref: "D.M. 236/1989, 4.28" },
        { text: "È garantito lo spazio per l'accostamento laterale della sedia a ruote alla tazza WC (min. 100 cm dall'asse)?", ref: "D.M. 236/1989, 4.29" },
        { text: "È garantito lo spazio per l'accostamento laterale alla vasca da bagno (min. 140 cm lungo la vasca, profondità min. 80 cm)?", ref: "D.M. 236/1989, 4.30" },
        { text: "È garantito lo spazio per l'accostamento frontale al lavabo (min. 80 cm dal bordo anteriore)?", ref: "D.M. 236/1989, 4.31" },
        { text: "Il lavabo è del tipo a mensola (senza colonna) con piano superiore a 80 cm dal calpestio?", ref: "D.M. 236/1989, 4.32" },
        { text: "Il WC/bidet è preferibilmente sospeso con asse a distanza min. 40 cm dalla parete laterale e bordo anteriore a 45-50 cm dal calpestio?", ref: "D.M. 236/1989, 4.33" },
        { text: "Sono presenti corrimano/maniglioni in prossimità della tazza WC (h. 80 cm, diametro 3-4 cm, a 5 cm dalla parete)?", ref: "D.M. 236/1989, 4.34" },
        { text: "È presente un campanello di emergenza in prossimità della tazza WC e della vasca?", ref: "D.M. 236/1989, 4.35" },
        { text: "La doccia è a pavimento, dotata di sedile ribaltabile e doccetta telefono?", ref: "D.M. 236/1989, 4.36" },
        { text: "Sono preferite porte scorrevoli o con apertura verso l'esterno?", ref: "D.M. 236/1989, 4.37" },
        { text: "Sotto il lavello e l'apparecchio di cottura è previsto uno spazio libero di almeno 70 cm di altezza per l'accostamento con sedia a ruote?", ref: "D.M. 236/1989, 4.38" },
        { text: "Gli apparecchi sono disposti sulla stessa parete o su pareti contigue?", ref: "D.M. 236/1989, 4.39" },
        { text: "La soglia tra balcone/terrazza e interno non costituisce ostacolo per la sedia a ruote?", ref: "D.M. 236/1989, 4.40" },
        { text: "Il parapetto è alto ≥ 100 cm e inattraversabile da sfera Ø 10 cm?", ref: "D.M. 236/1989, 4.41" },
        { text: "Almeno una porzione del balcone/terrazza consente la manovra di rotazione (spazio inscrivibile in cerchio Ø 140 cm)?", ref: "D.M. 236/1989, 4.42" },
        { text: "I corridoi hanno larghezza minima di 100 cm?", ref: "D.M. 236/1989, 4.43" },
        { text: "I corridoi non presentano variazioni di livello (o sono superate con rampe)?", ref: "D.M. 236/1989, 4.44" },
        { text: "In punti non eccessivamente distanti (ogni 10 m) è possibile l'inversione di marcia con sedia a ruote?", ref: "D.M. 236/1989, 4.45" },
        { text: "In corrispondenza dei percorsi verticali è prevista una piattaforma di distribuzione?", ref: "D.M. 236/1989, 4.46" },
        { text: "Le scale presentano andamento regolare e omogeneo per tutto lo sviluppo?", ref: "D.M. 236/1989, 4.47" },
        { text: "Per ogni rampa i gradini hanno la stessa alzata e pedata?", ref: "D.M. 236/1989, 4.48" },
        { text: "La pedata è minimo 30 cm (parti comuni) o 25 cm (scale private) e la somma 2×alzata + pedata = 62÷64 cm?", ref: "D.M. 236/1989, 4.49" },
        { text: "Il profilo del gradino è continuo con spigoli arrotondati e aggetto 2-2,5 cm?", ref: "D.M. 236/1989, 4.50" },
        { text: "La larghezza delle rampe comuni è ≥ 120 cm (scale private ≥ 80 cm)?", ref: "D.M. 236/1989, 4.51" },
        { text: "Sono presenti segnali a pavimento (fascia materiale diverso) a min. 30 cm dal primo e dall'ultimo scalino?", ref: "D.M. 236/1989, 4.52" },
        { text: "Il parapetto ha altezza minima di 100 cm ed è inattraversabile da sfera Ø 10 cm?", ref: "D.M. 236/1989, 4.53" },
        { text: "Il corrimano è presente su entrambi i lati (scale comuni/pubbliche) ad altezza 90-100 cm?", ref: "D.M. 236/1989, 4.54" },
        { text: "Il corrimano è prolungato di 30 cm oltre il primo e l'ultimo gradino?", ref: "D.M. 236/1989, 4.55" },
        { text: "Il corrimano è distante almeno 4 cm dalla parete?", ref: "D.M. 236/1989, 4.56" },
        { text: "Le scale consentono il passaggio di una barella con inclinazione max 15% sull'asse longitudinale?", ref: "D.M. 236/1989, 4.57" },
        { text: "Le rampe sono facilmente percepibili anche per i non vedenti?", ref: "D.M. 236/1989, 4.58" },
        { text: "La larghezza minima della rampa è ≥ 90 cm (transito singolo) o ≥ 150 cm (incrocio persone)?", ref: "D.M. 236/1989, 4.59" },
        { text: "La pendenza delle rampe non supera l'8%?", ref: "D.M. 236/1989, 4.60" },
        { text: "Ogni 10 m di lunghezza è previsto un ripiano orizzontale di riposo (min. 150×150 cm o 140×170 cm)?", ref: "D.M. 236/1989, 4.61" },
        { text: "Il dislivello superabile con rampe inclinate in successione non supera 3,20 m?", ref: "D.M. 236/1989, 4.62" },
        { text: "Dove il parapetto non è pieno, è presente un cordolo di almeno 10 cm?", ref: "D.M. 236/1989, 4.63" },
        { text: "Negli edifici non residenziali di nuova costruzione: cabina min. 140×110 cm, porta min. 80 cm, piattaforma anteriore min. 150×150 cm?", ref: "D.M. 236/1989, 4.64" },
        { text: "Negli edifici residenziali di nuova costruzione: cabina min. 130×95 cm, porta min. 80 cm, piattaforma anteriore min. 150×150 cm?", ref: "D.M. 236/1989, 4.65" },
        { text: "In caso di adeguamento di edifici preesistenti: cabina min. 120×80 cm, porta min. 75 cm, piattaforma min. 140×140 cm?", ref: "D.M. 236/1989, 4.66" },
        { text: "Le porte di cabina e di piano sono a scorrimento automatico (con rilevamento ostacoli)?", ref: "D.M. 236/1989, 4.67" },
        { text: "Le porte rimangono aperte ≥ 8 secondi e il tempo di chiusura non è inferiore a 4 sec.?", ref: "D.M. 236/1989, 4.68" },
        { text: "L'arresto ai piani avviene con autolivellamento con tolleranza max ±2 cm?", ref: "D.M. 236/1989, 4.69" },
        { text: "La bottoniera interna è su parete laterale a ≥ 35 cm dalla porta, con bottoni tra 110 e 140 cm di altezza?", ref: "D.M. 236/1989, 4.70" },
        { text: "I pulsanti hanno numerazione in rilievo e scritte in Braille?", ref: "D.M. 236/1989, 4.71" },
        { text: "In cabina sono presenti: citofono (110-130 cm), campanello d'allarme, segnale luminoso di ricezione allarme, luce d'emergenza (autonomia ≥ 3h)?", ref: "D.M. 236/1989, 4.72" },
        { text: "È prevista segnalazione sonora dell'arrivo al piano?", ref: "D.M. 236/1989, 4.73" },
        { text: "I servoscala nei luoghi pubblici/parti comuni consentono il superamento del dislivello anche a persone su sedia a ruote?", ref: "D.M. 236/1989, 4.74" },
        { text: "La piattaforma del servoscala per sedia a ruote è ≥ 70×75 cm (nei luoghi pubblici)?", ref: "D.M. 236/1989, 4.75" },
        { text: "La velocità massima del servoscala non supera 10 cm/sec?", ref: "D.M. 236/1989, 4.76" },
        { text: "I comandi (salita/discesa/chiamata) sono presenti sul mezzo e ai piani ad altezza 70-110 cm?", ref: "D.M. 236/1989, 4.77" },
        { text: "Il servoscala è dotato di limitatore di velocità, paracadute, freno (arresto in < 8 cm lungo la guida)?", ref: "D.M. 236/1989, 4.78" },
        { text: "Le piattaforme elevatrici hanno portata utile minima di 130 kg e vano corsa min. 80×120 cm?", ref: "D.M. 236/1989, 4.79" },
        { text: "Le piattaforme elevatrici hanno velocità ≤ 0,1 m/s e superano dislivelli ≤ 4 m?", ref: "D.M. 236/1989, 4.80" },
        { text: "Le autorimesse hanno collegamenti con spazi esterni e apparecchi di risalita adeguati per persone disabili?", ref: "D.M. 236/1989, 4.81" },
        { text: "Negli edifici aperti al pubblico: almeno 1 posto auto per disabili ogni 50 posti (larghezza ≥ 320 cm), con segnalazione?", ref: "D.M. 236/1989, 4.82" },
        { text: "I posti auto riservati sono ubicati in prossimità del mezzo di sollevamento?", ref: "D.M. 236/1989, 4.83" },
      ]},
      { title: "D.M. 236/1989 – 4.2 – Spazi esterni", group: "DM236_1989-Barriera architettonica", items: [
        { text: "Il percorso pedonale esterno ha larghezza minima di 90 cm?", ref: "D.M. 236/1989, 4.84" },
        { text: "Il percorso esterno è preferibilmente in piano o con pendenza longitudinale ≤ 5% (max 8% con ripiani ogni 10 m)?", ref: "D.M. 236/1989, 4.85" },
        { text: "La pendenza trasversale non supera l'1%?", ref: "D.M. 236/1989, 4.86" },
        { text: "Ogni 10 m (percorso in piano) o secondo pendenza è presente un'area di sosta/inversione di marcia?", ref: "D.M. 236/1989, 4.87" },
        { text: "Il percorso è privo di ostacoli (fino a h. 2,10 m) e differenze di livello non segnalate?", ref: "D.M. 236/1989, 4.88" },
        { text: "Dove il percorso si raccorda con il livello stradale sono presenti rampe con pendenza ≤ 15% per dislivello max 15 cm?", ref: "D.M. 236/1989, 4.89" },
        { text: "Le pavimentazioni esterne hanno coefficiente di attrito ≥ 0,40 (secco/bagnato secondo B.C.R.A.)?", ref: "D.M. 236/1989, 4.90" },
        { text: "Le intersezioni tra percorsi pedonali e zone carrabili sono segnalate anche per i non vedenti?", ref: "D.M. 236/1989, 4.91" },
      ]},
      { title: "D.M. 236/1989 – 4.3 – Segnaletica", group: "DM236_1989-Barriera architettonica", items: [
        { text: "Sono presenti cartelli di indicazione con simbolo internazionale di accessibilità nelle unità/spazi accessibili?", ref: "D.M. 236/1989, 4.92" },
        { text: "I numeri civici, le targhe e i contrassegni sono facilmente leggibili?", ref: "D.M. 236/1989, 4.93" },
        { text: "Negli edifici aperti al pubblico è predisposta segnaletica adeguata per attività principali e percorsi?", ref: "D.M. 236/1989, 4.94" },
        { text: "Per i non vedenti sono previsti dispositivi fonici o tabelle in Braille?", ref: "D.M. 236/1989, 4.95" },
        { text: "Le situazioni di pericolo sono segnalate con accorgimenti sia acustici che visivi?", ref: "D.M. 236/1989, 4.96" },
      ]},
      { title: "D.M. 236/1989 – 5.1 – Residenza", group: "DM236_1989-Barriera architettonica", items: [
        { text: "La zona soggiorno/pranzo è accessibile a persona su sedia a ruote dall'ingresso?", ref: "D.M. 236/1989, 5.1" },
        { text: "Almeno un servizio igienico è raggiungibile (tazza WC e lavabo) da persona su sedia a ruote?", ref: "D.M. 236/1989, 5.2" },
        { text: "I percorsi di collegamento interni tra le aree visibili sono accessibili?", ref: "D.M. 236/1989, 5.3" },
      ]},
      { title: "D.M. 236/1989 – 5.2 – Sale riunioni, spettacoli, ristorazione", group: "DM236_1989-Barriera architettonica", items: [
        { text: "Almeno una zona della sala è raggiungibile da persone con ridotte capacità motorie?", ref: "D.M. 236/1989, 5.4" },
        { text: "Sono previsti posti riservati a persone con ridotta capacità motoria: ≥ 2 ogni 400 posti (min. 2)?", ref: "D.M. 236/1989, 5.5" },
        { text: "Sono previsti spazi liberi per sedia a ruote su pavimento orizzontale nella stessa percentuale?", ref: "D.M. 236/1989, 5.6" },
        { text: "Almeno un servizio igienico è accessibile?", ref: "D.M. 236/1989, 5.7" },
        { text: "Nella sala di ristorazione è previsto almeno uno spazio libero per sedia a ruote?", ref: "D.M. 236/1989, 5.8" },
        { text: "Palco, palcoscenico e almeno un camerino/spogliatoio con WC sono accessibili?", ref: "D.M. 236/1989, 5.9" },
      ]},
      { title: "D.M. 236/1989 – 5.3 – Strutture ricettive", group: "DM236_1989-Barriera architettonica", items: [
        { text: "Tutte le parti e i servizi comuni della struttura ricettiva sono accessibili?", ref: "D.M. 236/1989, 5.10" },
        { text: "Il numero minimo di stanze accessibili rispetta il criterio: ≥ 2 fino a 40 stanze, + 2 ogni 40 stanze aggiuntive?", ref: "D.M. 236/1989, 5.11" },
        { text: "Le stanze accessibili hanno arredi, servizi, percorsi e spazi di manovra adeguati per sedia a ruote?", ref: "D.M. 236/1989, 5.12" },
        { text: "Se le stanze non hanno servizi igienici propri, è accessibile almeno un WC allo stesso piano nelle vicinanze?", ref: "D.M. 236/1989, 5.13" },
        { text: "Nei villaggi turistici/campeggi: almeno il 5% delle unità di soggiorno (min. 2) è accessibile?", ref: "D.M. 236/1989, 5.14" },
        { text: "Le stanze accessibili sono preferibilmente nei piani bassi, in prossimità di luogo sicuro/via di esodo?", ref: "D.M. 236/1989, 5.15" },
      ]},
      { title: "D.M. 236/1989 – 5.4 – Luoghi di culto", group: "DM236_1989-Barriera architettonica", items: [
        { text: "Almeno una zona in piano per le funzioni religiose è raggiungibile mediante percorso continuo o rampe?", ref: "D.M. 236/1989, 5.16" },
      ]},
      { title: "D.M. 236/1989 – 5.5 – Altri luoghi aperti al pubblico", group: "DM236_1989-Barriera architettonica", items: [
        { text: "Gli spazi di relazione sono accessibili?", ref: "D.M. 236/1989, 5.17" },
        { text: "Se la superficie utile è > 250 mq, è previsto almeno un servizio igienico accessibile?", ref: "D.M. 236/1989, 5.18" },
      ]},
      { title: "D.M. 236/1989 – 5.7 – Visitabilità condizionata", group: "DM236_1989-Barriera architettonica", items: [
        { text: "Negli edifici pubblici esistenti non ristrutturati: in prossimità dell'ingresso è presente un pulsante di chiamata con simbolo internazionale di accessibilità?", ref: "D.M. 236/1989, 5.19" },
      ]},
      { title: "D.M. 236/1989 – ART. 6 – CRITERI DI PROGETTAZIONE PER L'ADATTABILITÀ", group: "DM236_1989-Barriera architettonica", items: [
        { text: "L'edificio di nuova costruzione è progettato in modo che le modifiche future (senza toccare struttura portante né impianti comuni) possano renderlo accessibile a costi contenuti?", ref: "D.M. 236/1989, 6.1" },
        { text: "Il posizionamento e dimensionamento di servizi, disimpegni, porte è tale da consentire future trasformazioni in accessibilità?", ref: "D.M. 236/1989, 6.2" },
        { text: "Nelle unità immobiliari a più livelli: se non è possibile un servoscala, è previsto uno spazio idoneo per una futura piattaforma elevatrice?", ref: "D.M. 236/1989, 6.3" },
        { text: "Negli interventi di ristrutturazione: i requisiti di adattabilità corrispondono a quelli previsti per la nuova edificazione, compatibilmente con i vincoli strutturali?", ref: "D.M. 236/1989, 6.4" },
        { text: "L'eventuale installazione dell'ascensore nel vano scala non compromette la fruibilità delle rampe e dei pianerottoli per l'evacuazione?", ref: "D.M. 236/1989, 6.5" },
      ]},
      { title: "D.M. 236/1989 – ART. 7 – COGENZA DELLE PRESCRIZIONI", group: "DM236_1989-Barriera architettonica", items: [
        { text: "Le specificazioni dell'Art. 8 (prescrittive) sono rispettate, oppure sono state proposte soluzioni alternative documentate con relazione tecnica e grafici?", ref: "D.M. 236/1989, 7.1" },
        { text: "In caso di soluzioni alternative, il professionista abilitato ha certificato la conformità o l'equivalenza ai criteri di progettazione?", ref: "D.M. 236/1989, 7.2" },
        { text: "L'ufficio tecnico o tecnico incaricato dal Comune ha verificato la conformità del progetto prima del rilascio del titolo abilitativo?", ref: "D.M. 236/1989, 7.3" },
        { text: "Le eventuali deroghe (uffici specifici, locali tecnici, ristrutturazioni con vincoli strutturali) sono state motivate e autorizzate dal Sindaco?", ref: "D.M. 236/1989, 7.4" },
      ]},
      { title: "D.M. 236/1989 – ART. 8 – SPECIFICHE FUNZIONALI E DIMENSIONALI", group: "DM236_1989-Barriera architettonica", items: [
        { text: "Spazio di rotazione 360° (sedia a ruote): cerchio Ø 150 cm disponibile nei punti necessari?", ref: "D.M. 236/1989, 8.1" },
        { text: "Spazio di rotazione 180° (inversione): area min. 140×170 cm disponibile?", ref: "D.M. 236/1989, 8.2" },
        { text: "Porta accesso edificio/unità immobiliare: luce netta ≥ 80 cm?", ref: "D.M. 236/1989, 8.3" },
        { text: "Porte interne: luce netta ≥ 75 cm?", ref: "D.M. 236/1989, 8.4" },
        { text: "Corridoi: larghezza ≥ 100 cm con allargamenti ogni 10 m?", ref: "D.M. 236/1989, 8.5" },
        { text: "Rampe: pendenza ≤ 8% (deroghe in adeguamento con grafico specifico)?", ref: "D.M. 236/1989, 8.6" },
        { text: "Rampe: larghezza ≥ 90 cm (sola persona) o ≥ 150 cm (incrocio)?", ref: "D.M. 236/1989, 8.7" },
        { text: "Rampe: ripiano orizzontale ogni 10 m di sviluppo (min. 150×150 cm)?", ref: "D.M. 236/1989, 8.8" },
        { text: "Scale comuni: larghezza ≥ 120 cm, pedata ≥ 30 cm, segnale a pavimento a 30 cm da primo/ultimo scalino?", ref: "D.M. 236/1989, 8.9" },
        { text: "Corrimano: altezza 90-100 cm (secondo corrimano per bambini a 75 cm), distanza da parete ≥ 4 cm?", ref: "D.M. 236/1989, 8.10" },
        { text: "Ascensore (nuova costruzione non res.): cabina 140×110 cm; piattaforma anteriore 150×150 cm?", ref: "D.M. 236/1989, 8.11" },
        { text: "Ascensore (nuova costruzione res.): cabina 130×95 cm; piattaforma anteriore 150×150 cm?", ref: "D.M. 236/1989, 8.12" },
        { text: "WC: asse apparecchio a min. 40 cm dalla parete; bordo anteriore a 45-50 cm; corrimano a 80 cm h.?", ref: "D.M. 236/1989, 8.13" },
        { text: "Lavabo: piano superiore a 80 cm, senza colonna, spazio frontale ≥ 80 cm?", ref: "D.M. 236/1989, 8.14" },
        { text: "Vasca: spazio laterale ≥ 140 cm lungo la vasca, profondità min. 80 cm?", ref: "D.M. 236/1989, 8.15" },
        { text: "Percorso esterno: larghezza ≥ 90 cm, pendenza long. ≤ 5%, pendenza trasv. ≤ 1%?", ref: "D.M. 236/1989, 8.16" },
        { text: "Parcheggi: posti riservati disabili ≥ 1/50 posti, larghezza ≥ 320 cm, copertura preferibile?", ref: "D.M. 236/1989, 8.17" },
        { text: "Terminali impianti: posizionati tra 40 e 140 cm di altezza?", ref: "D.M. 236/1989, 8.18" },
        { text: "Cassette postali residenziali: altezza ≤ 140 cm?", ref: "D.M. 236/1989, 8.19" },
        { text: "Parapetti: altezza ≥ 100 cm, inattraversabili da sfera Ø 10 cm?", ref: "D.M. 236/1989, 8.20" },
        { text: "Gli elaborati tecnici evidenziano chiaramente le soluzioni e gli accorgimenti per accessibilità, visitabilità e adattabilità?", ref: "D.M. 236/1989, 10.1" },
        { text: "È presente una relazione specifica con descrizione delle soluzioni e degli interventi di eliminazione barriere architettoniche?", ref: "D.M. 236/1989, 10.2" },
        { text: "Per l'adattabilità sono stati predisposti specifici elaborati grafici?", ref: "D.M. 236/1989, 10.3" },
        { text: "Il Sindaco ha verificato, per il rilascio del certificato di abitabilità/agibilità, che le opere siano state realizzate nel rispetto della legge?", ref: "D.M. 236/1989, 11.1" },
        { text: "È stata prodotta, se richiesta, una perizia giurata da tecnico abilitato a conferma della conformità?", ref: "D.M. 236/1989, 11.2" },
      ]},
    ],
  },
  strutture: {
    label: "Strutture", icon: "⚙️", color: "#7EB8C4",
    sections: [
      { title: "NTC 2018 – Azioni e Combinazioni", items: [
        { text: "Classe d'uso edificio definita (I, II, III, IV)", ref: "NTC 2018, §2.4.2, Tab. 2.4.I" },
        { text: "Vita nominale VN e periodo di riferimento VR calcolati", ref: "NTC 2018, §2.4.1 e §2.4.3" },
        { text: "Carichi permanenti G1 e G2 quantificati", ref: "NTC 2018, §3.1.3 e §3.1.4" },
        { text: "Carichi variabili Q secondo categoria d'uso – Tab. 3.1.II", ref: "NTC 2018, §3.1.4, Tab. 3.1.II" },
        { text: "Azione sismica: ag, F0, TC* da mappe di pericolosità", ref: "NTC 2018, §3.2.1 e All. A" },
        { text: "Azione vento: pressione cinetica qb per zona – Tab. 3.3.I", ref: "NTC 2018, §3.3.4, Tab. 3.3.I" },
        { text: "Azione neve: carico qsk per zona altimetrica – Tab. 3.4.I", ref: "NTC 2018, §3.4.2, Tab. 3.4.I" },
        { text: "Combinazioni SLU e SLE verificate", ref: "NTC 2018, §2.5.3 e §2.5.4" },
      ]},
      { title: "NTC 2018 – Calcestruzzo Armato", items: [
        { text: "Classe esposizione XC/XD/XS/XF/XA definita (EN 206)", ref: "NTC 2018, §11.2.8; EN 206, Tab. 1" },
        { text: "Resistenza calcestruzzo ≥ C25/30 in zona sismica", ref: "NTC 2018, §7.4.6.1, c. 1" },
        { text: "Copriferro nominale adeguato alla classe di esposizione", ref: "NTC 2018, §4.1.6.1.2; EN 1992-1-1, §4.4.1" },
        { text: "Armatura minima e massima rispettata (travi e pilastri)", ref: "NTC 2018, §4.1.6.1.3 e §4.1.6.1.4" },
        { text: "Staffatura zona critica: passo ≤ min(b/4, 24Øl, 225 mm, 8Øt)", ref: "NTC 2018, §7.4.6.2.1, c. 7" },
        { text: "Lunghezze ancoraggio e sovrapposizione verificate", ref: "NTC 2018, §4.1.6.1.5; EN 1992-1-1, §8.4" },
        { text: "Duttilità CD'B' o CD'A' dichiarata e rispettata", ref: "NTC 2018, §7.2.1, Tab. 7.2.I" },
      ]},
      { title: "NTC 2018 – Fondazioni e Geotecnica", items: [
        { text: "Relazione geologica e geotecnica redatta", ref: "NTC 2018, §6.2.2, c. 1" },
        { text: "Categoria sottosuolo (A/B/C/D/E) assegnata", ref: "NTC 2018, §3.2.2, Tab. 3.2.II" },
        { text: "Categoria topografica (T1/T2/T3/T4) assegnata", ref: "NTC 2018, §3.2.3, Tab. 3.2.IV" },
        { text: "Verifica capacità portante (SLU – GEO)", ref: "NTC 2018, §6.4.2, c. 1" },
        { text: "Verifica cedimenti ammissibili (SLE)", ref: "NTC 2018, §6.4.2, c. 4" },
        { text: "Verifica liquefazione in zona sismica (se applicabile)", ref: "NTC 2018, §7.11.3.4" },
        { text: "Fondazioni continue o platea in zona sismica CD'A'", ref: "NTC 2018, §7.2.5, c. 3" },
      ]},
      { title: "NTC 2018 – Muratura", items: [
        { text: "Snellezza pilastri in muratura ≤ limiti normativi", ref: "NTC 2018, §4.5.6.2, c. 1" },
        { text: "Verifiche nel piano e fuori piano elementi in muratura", ref: "NTC 2018, §7.8.1.5 e §7.8.1.6" },
        { text: "Cordoli in c.a. ad ogni solaio e copertura", ref: "NTC 2018, §7.8.1.9, c. 1" },
        { text: "Percentuali di foratura rispettate", ref: "NTC 2018, §7.8.1.3, c. 2" },
      ]},
      { title: "NTC 2018 – Strutture in Legno (EN 1995)", items: [
        { text: "Connessioni verificate secondo UNI EN 1995", ref: "NTC 2018, §4.4; EN 1995-1-1, §8" },
        { text: "Classe di servizio legno definita (1, 2, 3)", ref: "EN 1995-1-1, §2.3.1.3" },
        { text: "Resistenza al fuoco R30/R60/R90 documentata", ref: "NTC 2018, §4.4.14; EN 1995-1-2, §2.1" },
        { text: "Verifica SLU e SLE elementi principali e secondari", ref: "EN 1995-1-1, §6.1 e §7.2" },
      ]},
      { title: "NTC 2018 – Strutture in Acciaio (EN 1993)", items: [
        { text: "Classe di sezione trasversale definita (1, 2, 3, 4)", ref: "EN 1993-1-1, §5.5" },
        { text: "Verifica resistenza e stabilità elementi compressi", ref: "EN 1993-1-1, §6.3" },
        { text: "Giunti bullonati: categoria e verifica a taglio/trazione", ref: "EN 1993-1-8, §3.4 e §3.6" },
        { text: "Giunti saldati: classe e verifica tensioni di progetto", ref: "EN 1993-1-8, §4.5" },
        { text: "Protezione dalla corrosione: classe esposizione e sistema", ref: "EN ISO 12944-2" },
      ]},
    ],
  },
  impianti: {
    label: "Impianti", icon: "⚡", color: "#A8C97E",
    sections: [
      { title: "Impianto Elettrico – CEI 64-8 / D.M. 37/2008", items: [
        { text: "Dichiarazione di Conformità (DiCo) rilasciata da installatore abilitato", ref: "D.M. 37/2008, Art. 7, c. 1" },
        { text: "Progetto firmato da tecnico abilitato (> 200 mq o luoghi particolari)", ref: "D.M. 37/2008, Art. 5, c. 1" },
        { text: "Protezione differenziale: Idn ≤ 30 mA per circuiti prese e bagni", ref: "CEI 64-8, Art. 531.2.4" },
        { text: "Protezione contro i contatti indiretti verificata", ref: "CEI 64-8, Art. 413" },
        { text: "Impianto di terra: dispersore, conduttori PE, nodo principale", ref: "CEI 64-8, Art. 542" },
        { text: "Equipotenziale supplementare nei bagni (gruppo 2)", ref: "CEI 64-8, Art. 701.415.2" },
        { text: "Protezione SPD contro le sovratensioni", ref: "CEI 64-8, Art. 534; CEI EN 62305-3" },
        { text: "Sezioni minime: 1,5 mm² illuminazione / 2,5 mm² forza motrice", ref: "CEI 64-8, Art. 524.1, Tab. 52A" },
        { text: "Quadro elettrico: etichettatura circuiti e selettività verificata", ref: "CEI 64-8, Art. 536; CEI EN 60439-1" },
      ]},
      { title: "Impianto Idrico-Sanitario – UNI 9182 / UNI EN 806", items: [
        { text: "Pressione di esercizio: 100–500 kPa", ref: "UNI EN 806-2, §5.2" },
        { text: "Portata minima garantita agli apparecchi – Tab. 1", ref: "UNI 9182, §6.2, Tab. 1" },
        { text: "Materiali tubazioni idonei per acqua potabile", ref: "D.M. 174/2004, Art. 1, c. 1" },
        { text: "Coibentazione tubazioni acqua calda e fredda", ref: "D.P.R. 412/1993, All. B, Tab. B" },
        { text: "Dispositivo antiriflusso/anticontaminazione sull'allaccio", ref: "UNI EN 1717, §4.2" },
        { text: "Scarichi: pendenza ≥ 1% e sifoni su tutti gli apparecchi", ref: "UNI EN 12056-2, §6.2" },
        { text: "Ventilazione colonne di scarico garantita", ref: "UNI EN 12056-2, §8.2" },
        { text: "DiCo impianto idrico rilasciata", ref: "D.M. 37/2008, Art. 7, c. 1" },
      ]},
      { title: "Impianto Termico – D.P.R. 74/2013 / UNI 10200", items: [
        { text: "Libretto di impianto compilato e aggiornato", ref: "D.P.R. 74/2013, Art. 7, c. 1" },
        { text: "Rendimento globale medio stagionale ≥ limiti normativi", ref: "D.P.R. 74/2013, All. A, Tab. 1" },
        { text: "Generatore con classe energetica ≥ A (direttiva ErP 2015)", ref: "Reg. UE 813/2013, All. II" },
        { text: "Valvole termostatiche sui corpi scaldanti", ref: "D.Lgs. 102/2014, Art. 9, c. 5" },
        { text: "Contabilizzazione del calore (condomini con impianto centralizzato)", ref: "D.Lgs. 102/2014, Art. 9, c. 5-bis" },
        { text: "Scarico fumi: sezione, materiale e altezza comignolo conformi", ref: "UNI 10845, §6.3" },
        { text: "Locale caldaia: aerazione, porta REI 120, cartello divieto", ref: "D.M. 12/4/1996, Art. 8, c. 1" },
      ]},
      { title: "Impianto Gas – UNI 7129 / UNI 11528", items: [
        { text: "Progetto firmato da tecnico abilitato iscritto all'albo", ref: "D.M. 37/2008, Art. 5, c. 2" },
        { text: "Prova di tenuta documentata (1 bar per 15 minuti)", ref: "UNI 7129-1, §8.2.3" },
        { text: "Dispositivo di intercettazione al contatore e ai singoli apparecchi", ref: "UNI 7129-1, §5.3.1" },
        { text: "Rivelatore gas con elettrovalvola di intercettazione automatica", ref: "UNI 7129-1, §6.5; UNI 11528, §7.4" },
        { text: "Ventilazione locale: apertura bassa (2 cm²/kW) e alta", ref: "UNI 7129-1, §6.2.2, c. 1" },
        { text: "DiCo impianto gas rilasciata", ref: "D.M. 37/2008, Art. 7, c. 1" },
      ]},
      { title: "Impianto Antincendio – UNI 10779 / UNI EN 12845", items: [
        { text: "Idranti UNI 45/70: progetto redatto secondo UNI 10779", ref: "UNI 10779, §4.1" },
        { text: "Sprinkler: progetto secondo UNI EN 12845 (se richiesto)", ref: "UNI EN 12845, §4.1" },
        { text: "Rivelazione incendio: sistema conforme UNI 9795 / EN 54", ref: "UNI 9795, §4; EN 54-1" },
        { text: "Estintori: omologati, verificati ogni 6 mesi, revisione 3 anni", ref: "D.M. 7/1/2005; UNI 9994-1, §5.2" },
        { text: "M.7 Allarme: sistema IRAI conforme UNI 9795", ref: "D.M. 3/8/2015, Sez. M.7; UNI 9795" },
      ]},
    ],
  },
  sicurezza: {
    label: "Sicurezza Cantieri", icon: "🦺", color: "#F0C060",
    sections: [
      { title: "Obblighi Committente – D.Lgs. 81/2008 Titolo IV", items: [
        { text: "Nomina CSP se previste più imprese", ref: "D.Lgs. 81/2008, Art. 90, c. 3" },
        { text: "Nomina CSE prima dell'inizio dei lavori", ref: "D.Lgs. 81/2008, Art. 90, c. 4" },
        { text: "Notifica Preliminare inviata a ASL e ITL", ref: "D.Lgs. 81/2008, Art. 99, c. 1" },
        { text: "Verifica idoneità tecnico-professionale imprese (DURC, CCIAA)", ref: "D.Lgs. 81/2008, Art. 90, c. 9, lett. a)" },
        { text: "Trasmissione PSC e Fascicolo alle imprese esecutrici", ref: "D.Lgs. 81/2008, Art. 101, c. 1" },
      ]},
      { title: "Piano di Sicurezza e Coordinamento (PSC) – All. XV", items: [
        { text: "Identificazione cantiere: natura, localizzazione, entità lavori", ref: "D.Lgs. 81/2008, All. XV, §2.1.2" },
        { text: "Individuazione rischi e misure preventive e protettive", ref: "D.Lgs. 81/2008, All. XV, §2.1.2, lett. g)" },
        { text: "Stima costi della sicurezza non soggetti a ribasso d'asta", ref: "D.Lgs. 81/2008, All. XV, §4" },
        { text: "Tavole esplicative di progetto (lay-out cantiere, recinzioni)", ref: "D.Lgs. 81/2008, All. XV, §2.3" },
        { text: "Cronoprogramma dei lavori", ref: "D.Lgs. 81/2008, All. XV, §2.1.2, lett. e)" },
        { text: "Misure di coordinamento per uso comune di attrezzature", ref: "D.Lgs. 81/2008, Art. 92, c. 1, lett. b)" },
      ]},
      { title: "Fascicolo dell'Opera – D.Lgs. 81/2008 All. XVI", items: [
        { text: "Fascicolo predisposto dal CSP in fase di progettazione", ref: "D.Lgs. 81/2008, Art. 91, c. 1, lett. b)" },
        { text: "Schede relative a materiali pericolosi presenti nell'opera", ref: "D.Lgs. 81/2008, All. XVI, §3" },
        { text: "Informazioni utili per interventi successivi (manutenzione)", ref: "D.Lgs. 81/2008, All. XVI, §1" },
        { text: "Fascicolo aggiornato a fine lavori dal CSE", ref: "D.Lgs. 81/2008, Art. 92, c. 1, lett. b)" },
      ]},
      { title: "Piano Operativo di Sicurezza (POS) – Art. 89", items: [
        { text: "POS redatto da ogni impresa esecutrice", ref: "D.Lgs. 81/2008, Art. 89, c. 1, lett. h)" },
        { text: "POS coerente con PSC, trasmesso al CSE prima dei lavori", ref: "D.Lgs. 81/2008, Art. 101, c. 3" },
        { text: "Dati identificativi impresa, personale, macchine e attrezzature", ref: "D.Lgs. 81/2008, All. XV, §3.2" },
        { text: "Procedure operative per i lavori a rischio specifico", ref: "D.Lgs. 81/2008, All. XV, §3.2, lett. g)" },
      ]},
      { title: "Gestione Operativa Cantiere – D.Lgs. 81/2008", items: [
        { text: "Recinzione perimetrale cantiere e cartellonistica conforme", ref: "D.Lgs. 81/2008, All. XVIII, §1" },
        { text: "Ponteggio: PIMUS redatto, montaggio e uso conformi al libretto", ref: "D.Lgs. 81/2008, Art. 136, c. 1 e Art. 138" },
        { text: "DPI distribuiti e utilizzo verificato dal preposto", ref: "D.Lgs. 81/2008, Art. 77 e Art. 19, c. 1, lett. a)" },
        { text: "Macchine ed attrezzature con marcatura CE e registro manutenzione", ref: "D.Lgs. 81/2008, Art. 71, c. 4, lett. a)" },
        { text: "Verbali di coordinamento CSE–imprese registrati e archiviati", ref: "D.Lgs. 81/2008, Art. 92, c. 1, lett. a)" },
        { text: "Formazione e addestramento lavoratori documentati", ref: "D.Lgs. 81/2008, Art. 37, c. 1 e c. 4" },
        { text: "Sorveglianza sanitaria: medico competente nominato (se obbligatoria)", ref: "D.Lgs. 81/2008, Art. 41, c. 1" },
      ]},
      { title: "Lavori in Quota – D.Lgs. 81/2008 Capo II Titolo IV", items: [
        { text: "Misure protezione collettiva prioritarie (parapetti, reti, impalcati)", ref: "D.Lgs. 81/2008, Art. 111, c. 1" },
        { text: "DPI anticaduta usati solo se protezioni collettive non applicabili", ref: "D.Lgs. 81/2008, Art. 115, c. 1" },
        { text: "Ponteggio metallico fisso: libretto, PIMUS, verifica periodica", ref: "D.Lgs. 81/2008, Art. 132 e Art. 136" },
        { text: "Scale a pioli: vincolo antiribaltamento, lunghezza ≤ 5 m s.d.", ref: "D.Lgs. 81/2008, Art. 113, c. 1-2" },
      ]},
      { title: "Rischio Elettrico in Cantiere – CEI 64-17", items: [
        { text: "Quadro elettrico cantiere (ASC): CEI EN 60439-4, grado IP 44", ref: "CEI 64-17, §4.3; CEI EN 60439-4" },
        { text: "Protezione differenziale Idn ≤ 30 mA su tutte le prese", ref: "CEI 64-17, §4.4.2" },
        { text: "Impianto di terra del cantiere con dispersore e PE", ref: "CEI 64-17, §4.6" },
        { text: "Distanze di sicurezza da linee elettriche aeree rispettate", ref: "D.Lgs. 81/2008, Art. 117; All. IX" },
      ]},
    ],
  },
  urbanistica: {
    label: "Urbanistica", icon: "🗺️", color: "#9B8EC4",
    sections: [
      { title: "Titoli Abilitativi – D.P.R. 380/2001 (T.U. Edilizia)", items: [
        { text: "Permesso di Costruire rilasciato (art. 10 D.P.R. 380/2001)", ref: "D.P.R. 380/2001, Art. 10, c. 1" },
        { text: "SCIA alternativa al PDC presentata (art. 22, c. 3)", ref: "D.P.R. 380/2001, Art. 22, c. 3" },
        { text: "CILA o SCIA per manutenzione straordinaria", ref: "D.P.R. 380/2001, Art. 22, c. 1" },
        { text: "CIL per attività edilizia libera (art. 6)", ref: "D.P.R. 380/2001, Art. 6, c. 2" },
        { text: "Contributo di costruzione calcolato e versato", ref: "D.P.R. 380/2001, Art. 16, c. 1" },
        { text: "Conformità al PRG/PGT vigente verificata", ref: "D.P.R. 380/2001, Art. 12, c. 1" },
      ]},
      { title: "Parametri Urbanistici – D.M. 1444/1968 e NTA locali", items: [
        { text: "Indice di fabbricabilità fondiaria (If) rispettato", ref: "D.M. 1444/1968, Art. 7, c. 1; NTA PRG locali" },
        { text: "Rapporto di copertura (Rc) rispettato", ref: "NTA PRG/PGT locali" },
        { text: "Altezza massima (Hmax) rispettata", ref: "D.M. 1444/1968, Art. 8; NTA PRG locali" },
        { text: "Distanza min. tra edifici: 10 m tra pareti finestrate (zone B+)", ref: "D.M. 1444/1968, Art. 9, c. 1, n. 2" },
        { text: "Distanza minima dal confine di proprietà (NTA locali)", ref: "NTA PRG/PGT locali; C.C., Art. 873" },
        { text: "Distanza dal ciglio stradale rispettata", ref: "D.M. 1404/1968; NTA PRG locali" },
        { text: "Parcheggi pertinenziali: 1 mq/10 mc (L. 122/1989 – Tognoli)", ref: "L. 122/1989, Art. 2, c. 2" },
      ]},
      { title: "Agibilità e Collaudo – D.P.R. 380/2001", items: [
        { text: "Segnalazione Certificata Agibilità (SCA) presentata allo S.U.E.", ref: "D.P.R. 380/2001, Art. 24, c. 1" },
        { text: "Certificato di collaudo statico depositato al Genio Civile", ref: "D.P.R. 380/2001, Art. 67, c. 1" },
        { text: "DiCo impianti allegata alla SCA (D.M. 37/2008)", ref: "D.P.R. 380/2001, Art. 24, c. 3" },
        { text: "APE allegato alla SCA", ref: "D.P.R. 380/2001, Art. 24, c. 3; D.Lgs. 192/2005, Art. 6" },
        { text: "Planimetrie as-built depositate al Catasto", ref: "R.D. 1572/1931; D.P.R. 650/1972" },
      ]},
      { title: "Vincoli e Tutele – D.Lgs. 42/2004 (Codice Beni Culturali)", items: [
        { text: "Verifica presenza vincoli paesaggistici (Part. II e III D.Lgs. 42/2004)", ref: "D.Lgs. 42/2004, Art. 136 e Art. 142" },
        { text: "Autorizzazione paesaggistica rilasciata (se necessaria)", ref: "D.Lgs. 42/2004, Art. 146, c. 1" },
        { text: "Nulla osta Soprintendenza (beni culturali vincolati)", ref: "D.Lgs. 42/2004, Art. 21, c. 4" },
        { text: "Verifica vincolo idrogeologico – R.D. 3267/1923", ref: "R.D. 3267/1923, Art. 1" },
        { text: "Verifica fascia di rispetto stradale, ferroviaria, cimiteriale", ref: "D.Lgs. 285/1992, Art. 26; D.P.R. 495/1992" },
      ]},
    ],
  },
};

/* ─── STORAGE ─── */
const PROJ_KEY  = "cnv8_projects";
const NORMS_KEY = "cnv8_norms";
const store = {
  loadProjects: () => { try { return JSON.parse(localStorage.getItem(PROJ_KEY)) || []; } catch { return []; } },
  saveProjects: p  => { try { localStorage.setItem(PROJ_KEY, JSON.stringify(p)); } catch {} },
  loadNorms:    () => { try { return JSON.parse(localStorage.getItem(NORMS_KEY)) || null; } catch { return null; } },
  saveNorms:    n  => { try { if (n) localStorage.setItem(NORMS_KEY, JSON.stringify(n)); else localStorage.removeItem(NORMS_KEY); } catch {} },
};

const mkProject = name => ({
  id: String(Date.now()),
  name: name || "Nuovo Progetto",
  inspector: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  activeSections: {},
  checklist: {},
  notes: {},
  remarks: {},
});

/* ═══════════════════════════════════
   EXPORT PDF — via finestra di stampa
   Funziona in tutti gli ambienti
   ═══════════════════════════════════ */
function exportPDF(project, disciplines, mode) {
  const date = new Date().toLocaleDateString("it-IT", { day:"2-digit", month:"long", year:"numeric" });

  const allAct = Object.entries(disciplines).flatMap(([dk,d]) =>
    d.sections.filter(s => project.activeSections[`${dk}__${s.title}`]));
  const total = allAct.reduce((a,s)=>a+s.items.length,0);
  const si = Object.values(project.checklist).filter(v=>v==="ok").length;
  const no = Object.values(project.checklist).filter(v=>v==="ko").length;
  const na = Object.values(project.checklist).filter(v=>v==="na").length;

  let rows = "";
  Object.entries(disciplines).forEach(([dk,d])=>{
    const secs = d.sections.filter(s=>project.activeSections[`${dk}__${s.title}`]);
    if(!secs.length) return;
    let hasRows = false;
    let discRows = "";
    secs.forEach(sec=>{
      let secRows = "";
      sec.items.forEach(item=>{
        const key = `${dk}__${sec.title}__${item.text}`;
        const st = project.checklist[key] !== undefined ? project.checklist[key] : (item.defaultAnswer||null);
        if(mode==="issues" && st!=="ko") return;
        const lbl = st==="ok"?"✓ Sì":st==="ko"?"✗ No":st==="na"?"N/A":"—";
        const stColor = st==="ok"?"#22863a":st==="ko"?"#c0392b":st==="na"?"#7f8c8d":"#888";
        const bgRow = st==="ko"?"#fff5f5":st==="ok"?"#f5fff8":"#fff";
        secRows += `<tr style="background:${bgRow}">
          <td style="padding:6px 10px;font-size:10px;color:#333;width:30%;border-bottom:1px solid #eee">${item.text}</td>
          <td style="padding:6px 8px;font-size:9px;color:#8B6914;font-style:italic;width:18%;border-bottom:1px solid #eee">${item.ref||"—"}</td>
          <td style="padding:6px 8px;font-size:11px;font-weight:700;color:${stColor};width:8%;text-align:center;border-bottom:1px solid #eee">${lbl}</td>
          <td style="padding:6px 8px;font-size:9px;color:#555;width:22%;border-bottom:1px solid #eee">${project.notes[key]||""}</td>
          <td style="padding:6px 8px;font-size:9px;color:#8B6914;width:22%;border-bottom:1px solid #eee">${project.remarks?.[key]||""}</td>
        </tr>`;
        hasRows = true;
      });
      if(secRows) discRows += `
        <tr><td colspan="5" style="padding:5px 10px;background:#f0f4f8;font-size:9px;font-weight:700;color:#2c3e50;border-bottom:1px solid #ddd">${sec.title}</td></tr>
        ${secRows}`;
    });
    if(hasRows) rows += `
      <tr><td colspan="5" style="padding:8px 10px;background:#2c3e50;font-size:11px;font-weight:800;color:#fff">${d.icon} ${d.label.toUpperCase()}</td></tr>
      ${discRows}`;
  });

  const html = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8">
<title>${project.name} — ${mode==="full"?"Report Completo":"Non Conformità"}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;background:#fff;font-size:11px}
  .header{background:#1a2a3a;color:white;padding:16px 20px;display:flex;justify-content:space-between;align-items:center}
  .header h1{font-size:16px;font-weight:800;color:#C8A96E;letter-spacing:1px}
  .header p{font-size:9px;color:#aaa;margin-top:3px}
  .meta{display:flex;gap:0;border-bottom:2px solid #C8A96E}
  .meta-item{flex:1;padding:8px 12px;background:#f8f9fa;border-right:1px solid #dee2e6}
  .meta-item:last-child{border-right:none}
  .meta-label{font-size:8px;color:#888;text-transform:uppercase;letter-spacing:1px}
  .meta-value{font-size:12px;font-weight:700;color:#1a2a3a;margin-top:2px}
  .stats{display:flex;gap:0;background:#fff;border-bottom:1px solid #dee2e6}
  .stat{flex:1;text-align:center;padding:10px;border-right:1px solid #dee2e6}
  .stat:last-child{border-right:none}
  .stat-val{font-size:20px;font-weight:800}
  .stat-lbl{font-size:8px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:2px}
  table{width:100%;border-collapse:collapse}
  th{background:#2c3e50;color:#fff;padding:6px 10px;font-size:9px;text-align:left;text-transform:uppercase;letter-spacing:0.5px}
  .footer{padding:8px 20px;font-size:8px;color:#999;border-top:1px solid #eee;text-align:center;margin-top:8px}
  @media print{
    @page{size:A4 landscape;margin:8mm}
    body{font-size:9px}
    .header{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    tr{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    th{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  }
</style></head><body>
<div class="header">
  <div>
    <h1>CheckList Verifiche Normative</h1>
    <p>${mode==="full"?"Report Completo":"Solo Non Conformità"} — ${date}</p>
  </div>
  <div style="text-align:right">
    <div style="font-size:11px;color:#C8A96E;font-weight:700">${project.name}</div>
    <div style="font-size:9px;color:#aaa;margin-top:2px">👤 ${project.inspector||"—"}</div>
  </div>
</div>
<div class="meta">
  <div class="meta-item"><div class="meta-label">Progetto</div><div class="meta-value">${project.name}</div></div>
  <div class="meta-item"><div class="meta-label">Ispettore</div><div class="meta-value">${project.inspector||"—"}</div></div>
  <div class="meta-item"><div class="meta-label">Data</div><div class="meta-value">${date}</div></div>
  <div class="meta-item"><div class="meta-label">Tipo report</div><div class="meta-value">${mode==="full"?"Completo":"Non Conformità"}</div></div>
</div>
<div class="stats">
  <div class="stat"><div class="stat-val" style="color:#888">${total}</div><div class="stat-lbl">Voci totali</div></div>
  <div class="stat"><div class="stat-val" style="color:#22863a">${si}</div><div class="stat-lbl">Sì ✓</div></div>
  <div class="stat"><div class="stat-val" style="color:#c0392b">${no}</div><div class="stat-lbl">No ✗</div></div>
  <div class="stat"><div class="stat-val" style="color:#7f8c8d">${na}</div><div class="stat-lbl">N/A</div></div>
  <div class="stat"><div class="stat-val" style="color:#C8A96E">${total?Math.round(si/total*100):0}%</div><div class="stat-lbl">Completamento</div></div>
</div>
<table>
  <thead><tr>
    <th style="width:30%">Voce di controllo</th>
    <th style="width:18%">Rif. normativo</th>
    <th style="width:8%;text-align:center">Stato</th>
    <th style="width:22%">Note tecniche</th>
    <th style="width:22%">Rilievo ispettore</th>
  </tr></thead>
  <tbody>${rows||`<tr><td colspan="5" style="padding:20px;text-align:center;color:#888">Nessuna voce da mostrare</td></tr>`}</tbody>
</table>
<div class="footer">Compilato da: ${project.inspector||"—"} · ${date} · Non sostituisce la verifica di un tecnico abilitato</div>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`;

  // Mostra anteprima in modal a schermo intero
  const existing = document.getElementById("pdf-report-modal");
  if(existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "pdf-report-modal";
  modal.style.cssText = "position:fixed;inset:0;z-index:9999;background:white;overflow:auto;";

  // Barra pulsanti
  const bar = document.createElement("div");
  bar.style.cssText = "position:fixed;top:10px;right:10px;z-index:10000;display:flex;gap:8px;";

  const btnDownload = document.createElement("button");
  btnDownload.textContent = "🖨️ Salva come PDF";
  btnDownload.style.cssText = "background:#1a2a3a;color:white;border:none;border-radius:8px;padding:8px 16px;font-weight:700;cursor:pointer;font-size:13px;";
  btnDownload.onclick = () => {
    // Apre il dialogo di stampa → scegli "Salva come PDF"
    const printWin = window.open("","_blank","width=1200,height=800");
    if(printWin) {
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      setTimeout(()=>printWin.print(), 800);
    }
  };

  const btnClose = document.createElement("button");
  btnClose.textContent = "✕ Chiudi";
  btnClose.style.cssText = "background:#c0392b;color:white;border:none;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer;font-size:13px;";
  btnClose.onclick = () => modal.remove();

  bar.appendChild(btnDownload);
  bar.appendChild(btnClose);
  modal.appendChild(bar);

  // Contenuto report
  const content = document.createElement("div");
  content.innerHTML = html;
  // Rimuovi lo script di auto-print dal contenuto
  content.querySelectorAll("script").forEach(s=>s.remove());
  modal.appendChild(content);

  document.body.appendChild(modal);
}

async function exportExcel(project, disciplines) {
  const XLSX = await loadXLSX();
  const wb = XLSX.utils.book_new();
  const date = new Date().toLocaleDateString("it-IT");
  const sum=[["CHECKLIST NORME TECNICHE"],["Progetto:",project.name],["Ispettore:",project.inspector||"—"],["Data:",date],[""],
    ["DISCIPLINA","SEZIONI ATTIVE","TOTALE VOCI","SÌ ✓","NO ✗","N/A","DA VERIF.","% COMPLET."]];
  Object.entries(disciplines).forEach(([dk,d])=>{
    const act=d.sections.filter(s=>project.activeSections[`${dk}__${s.title}`]);
    const tot=act.reduce((a,s)=>a+s.items.length,0);
    const si=act.reduce((a,s)=>a+s.items.filter(i=>project.checklist[`${dk}__${s.title}__${i.text}`]==="ok").length,0);
    const no=act.reduce((a,s)=>a+s.items.filter(i=>project.checklist[`${dk}__${s.title}__${i.text}`]==="ko").length,0);
    const na=act.reduce((a,s)=>a+s.items.filter(i=>project.checklist[`${dk}__${s.title}__${i.text}`]==="na").length,0);
    sum.push([d.label,act.length,tot,si,no,na,tot-si-no-na,`${tot?Math.round(si/tot*100):0}%`]);
  });
  const ws0=XLSX.utils.aoa_to_sheet(sum);
  ws0["!cols"]=[26,14,13,8,8,8,10,14].map(w=>({wch:w}));
  XLSX.utils.book_append_sheet(wb,ws0,"Riepilogo");
  Object.entries(disciplines).forEach(([dk,d])=>{
    const act=d.sections.filter(s=>project.activeSections[`${dk}__${s.title}`]);
    if(!act.length)return;
    const rows=[[`${d.label.toUpperCase()} – CHECKLIST`],["Progetto:",project.name,"","Ispettore:",project.inspector||"—","Data:",date],[""],
      ["SEZIONE","VOCE","RIF. NORMATIVO","STATO","NOTE","RILIEVO"]];
    act.forEach(sec=>sec.items.forEach(item=>{
      const key=`${dk}__${sec.title}__${item.text}`;
      const s = project.checklist[key] !== undefined ? project.checklist[key] : (item.defaultAnswer||null);
      rows.push([sec.title,item.text,item.ref,s==="ok"?"✓ Sì":s==="ko"?"✗ No":s==="na"?"N/A":"—",project.notes[key]||"",project.remarks?.[key]||""]);
    }));
    const ws=XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"]=[{wch:32},{wch:48},{wch:30},{wch:12},{wch:34},{wch:40}];
    XLSX.utils.book_append_sheet(wb,ws,d.label.slice(0,31));
  });
  XLSX.writeFile(wb,`checklist_${project.name.replace(/\s+/g,"_")}_${date.replace(/\//g,"-")}.xlsx`);
}

function exportHTML(project, disciplines) {
  const date = new Date().toLocaleDateString("it-IT",{day:"2-digit",month:"long",year:"numeric"});
  let rows="";
  Object.entries(disciplines).forEach(([dk,d])=>{
    const act=d.sections.filter(s=>project.activeSections[`${dk}__${s.title}`]);
    if(!act.length)return;
    rows+=`<tr style="background:#1a2d3d"><td colspan="5" style="padding:12px 16px;font-weight:800;font-size:14px;color:${d.color}">${d.icon} ${d.label.toUpperCase()}</td></tr>`;
    act.forEach(sec=>{
      rows+=`<tr style="background:#162230"><td colspan="5" style="padding:7px 16px;font-weight:700;font-size:11px;color:#7a9ab0">${sec.title}</td></tr>`;
      sec.items.forEach(item=>{
        const key=`${dk}__${sec.title}__${item.text}`;
        const s = project.checklist[key] !== undefined ? project.checklist[key] : (item.defaultAnswer||null);
        const [lbl,col,bg]=s==="ok"?["✓ Sì","#4caf50","#22863a18"]:s==="ko"?["✗ No","#ef5350","#cb243118"]:s==="na"?["N/A","#90a4ae","#ffffff0a"]:["—","#555","transparent"];
        rows+=`<tr style="border-bottom:1px solid #1a2d3d;background:${bg}"><td style="padding:7px 14px;font-size:11px;color:#c8d8e8;width:28%">${item.text}</td><td style="padding:7px 10px;font-size:10px;color:#C8A96E;font-style:italic;width:18%">${item.ref||""}</td><td style="padding:7px 12px;font-size:12px;color:${col};font-weight:700;width:8%">${lbl}</td><td style="padding:7px 14px;font-size:11px;color:#7a9ab0;width:22%">${project.notes[key]||""}</td><td style="padding:7px 14px;font-size:11px;color:#C8A96E;width:24%">${project.remarks?.[key]||""}</td></tr>`;
      });
    });
  });
  const tot=Object.entries(disciplines).flatMap(([dk,d])=>d.sections.filter(s=>project.activeSections[`${dk}__${s.title}`])).reduce((a,s)=>a+s.items.length,0);
  const si=Object.values(project.checklist).filter(v=>v==="ok").length;
  const no=Object.values(project.checklist).filter(v=>v==="ko").length;
  const html=`<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>${project.name}</title>
<style>*{box-sizing:border-box}body{background:#0f1923;color:#e8edf2;font-family:'Segoe UI',sans-serif;margin:0}
.hdr{background:linear-gradient(135deg,#0f1923,#1a2d3d);padding:28px 36px;border-bottom:2px solid #C8A96E}
.hdr h1{margin:0 0 4px;font-size:22px;font-weight:800;color:#C8A96E}.hdr p{margin:0;color:#7a9ab0;font-size:12px}
.meta{display:flex;gap:28px;padding:16px 36px;background:#162230;border-bottom:1px solid #1a2d3d;flex-wrap:wrap}
.meta div{font-size:11px;color:#7a9ab0}.meta strong{display:block;font-size:14px;color:#e8edf2}
.stats{display:flex;gap:14px;padding:14px 36px;flex-wrap:wrap}
.stat{text-align:center;padding:10px 20px;border-radius:8px}
.tbl{padding:20px 36px}table{width:100%;border-collapse:collapse}
th{background:#162230;color:#7a9ab0;padding:7px 14px;text-align:left;font-size:10px;letter-spacing:1px;text-transform:uppercase}
.ftr{text-align:center;padding:14px;font-size:10px;color:#3a5468;border-top:1px solid #1a2d3d}
</style></head><body>
<div class="hdr"><h1>CheckList Norme Tecniche</h1><p>Report – ${date}</p></div>
<div class="meta"><div><span>Progetto</span><strong>${project.name}</strong></div><div><span>Ispettore</span><strong>${project.inspector||"—"}</strong></div><div><span>Data</span><strong>${date}</strong></div><div><span>Voci</span><strong>${tot}</strong></div></div>
<div class="stats">
  <div class="stat" style="background:#22863a22"><strong style="font-size:22px;color:#4caf50">${si}</strong><div style="color:#4caf50;font-size:10px">Sì</div></div>
  <div class="stat" style="background:#cb243122"><strong style="font-size:22px;color:#ef5350">${no}</strong><div style="color:#ef5350;font-size:10px">No</div></div>
  <div class="stat" style="background:#1a2d3d"><strong style="font-size:22px;color:#C8A96E">${tot?Math.round(si/tot*100):0}%</strong><div style="color:#C8A96E;font-size:10px">Complet.</div></div>
</div>
<div class="tbl"><table><thead><tr><th>Voce</th><th>Rif. normativo</th><th>Stato</th><th>Note</th><th>Rilievo ispettore</th></tr></thead><tbody>${rows}</tbody></table></div>
<div class="ftr">Compilato da: ${project.inspector||"—"} – Non sostituisce la verifica di un tecnico abilitato</div>
</body></html>`;
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([html],{type:"text/html"}));
  a.download=`checklist_${project.name.replace(/\s+/g,"_")}.html`;
  a.click();
}

/* ═══════════════════════════════════
   COSTANTI
   ═══════════════════════════════════ */
const BD = "1px solid #1a2d3d";
const PALETTE = ["#C8A96E","#7EB8C4","#A8C97E","#F0C060","#9B8EC4","#E8896A","#60B8A0","#D4758A","#7EB0F0","#C4A87E"];
const ICONS   = ["🏛️","⚙️","⚡","🦺","🗺️","🔥","🏗️","📐","🔩","🌿","🏢","📋","🔬","💧","🛡️","📊"];
const STEPS   = [
  { id:"project",    label:"Progetto",      icon:"📁", desc:"Titolo del progetto" },
  { id:"inspector",  label:"Ispettore",      icon:"👤", desc:"Nome compilatore" },
  { id:"discipline", label:"Disciplina",     icon:"📚", desc:"Scegli la disciplina" },
  { id:"norms",      label:"Norme",          icon:"⚖️", desc:"Scegli le norme da analizzare" },
  { id:"checklist",  label:"Checklist",      icon:"✅", desc:"Compilazione verifiche" },
];

const SBtn = ({active,onClick,label,color}) => (
  <button onClick={onClick} style={{padding:"5px 14px",borderRadius:20,border:`2px solid ${color}`,background:active?color:"transparent",color:active?"white":color,fontWeight:700,fontSize:11,cursor:"pointer",transition:"all .15s"}}>{label}</button>
);

/* ═══════════════════════════════════
   STEP 1 — PROGETTO
   ═══════════════════════════════════ */
function StepProject({ projects, activeId, onSelect, onCreate, onDelete, onRename }) {
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const create = () => {
    if (!newName.trim()) return;
    onCreate(newName.trim());
    setNewName("");
  };

  return (
    <div style={{flex:1,overflowY:"auto",padding:"20px"}}>
      <div style={{fontSize:11,color:"#C8A96E",letterSpacing:2,textTransform:"uppercase",marginBottom:16,fontWeight:700}}>Seleziona o crea progetto</div>

      {/* Crea nuovo */}
      <div style={{background:"#162230",borderRadius:12,border:BD,padding:"14px",marginBottom:20}}>
        <div style={{fontSize:11,color:"#7a9ab0",marginBottom:8}}>Nuovo progetto</div>
        <div style={{display:"flex",gap:8}}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&create()}
            placeholder="Nome progetto…"
            style={{flex:1,background:"#0f1923",border:BD,borderRadius:8,padding:"8px 12px",color:"#e8edf2",fontSize:13,outline:"none"}}/>
          <button onClick={create} style={{background:"#C8A96E",border:"none",borderRadius:8,padding:"8px 16px",color:"#0a1520",fontWeight:800,fontSize:18,cursor:"pointer"}}>+</button>
        </div>
      </div>

      {/* Lista progetti */}
      {projects.length===0&&<div style={{textAlign:"center",color:"#3a5468",fontSize:12,marginTop:16}}>Nessun progetto ancora</div>}
      {projects.map(p=>{
        const isAct=p.id===activeId;
        return (
          <div key={p.id} onClick={()=>onSelect(p.id)}
            style={{padding:"14px 16px",borderRadius:12,marginBottom:8,cursor:"pointer",background:isAct?"#1a2d3d":"#0f1923",border:`2px solid ${isAct?"#C8A96E44":BD.split(" ")[2]}`,transition:"all .15s"}}>
            {renaming===p.id?(
              <input autoFocus defaultValue={p.name}
                onBlur={e=>{onRename(p.id,e.target.value||p.name);setRenaming(null);}}
                onKeyDown={e=>e.key==="Enter"&&e.target.blur()} onClick={e=>e.stopPropagation()}
                style={{width:"100%",background:"#0f1923",border:"1px solid #C8A96E",borderRadius:6,padding:"4px 8px",color:"#e8edf2",fontSize:13,outline:"none"}}/>
            ):(
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:isAct?700:500,color:isAct?"#e8edf2":"#7a9ab0"}}>{p.name}</div>
                  <div style={{fontSize:10,color:"#3a5468",marginTop:2}}>{new Date(p.updatedAt).toLocaleDateString("it-IT")}</div>
                </div>
                <div style={{display:"flex",gap:4}}>
                  <button onClick={e=>{e.stopPropagation();setRenaming(p.id);}} style={{background:"transparent",border:"none",color:"#3a5468",cursor:"pointer",fontSize:13,padding:"4px"}}>✏️</button>
                  <button onClick={e=>{e.stopPropagation();setConfirmDel(p);}} style={{background:"transparent",border:"none",color:"#3a5468",cursor:"pointer",fontSize:13,padding:"4px"}}>🗑️</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {confirmDel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#162230",borderRadius:14,border:"1px solid #ef535044",padding:28,maxWidth:320,width:"100%",textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:8}}>🗑️</div>
            <div style={{color:"#e8edf2",fontWeight:700,marginBottom:6}}>Eliminare il progetto?</div>
            <div style={{color:"#ef5350",fontSize:13,marginBottom:20,fontWeight:600}}>"{confirmDel.name}"</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>{onDelete(confirmDel.id);setConfirmDel(null);}} style={{background:"#ef5350",color:"white",border:"none",borderRadius:10,padding:"9px 22px",fontWeight:800,cursor:"pointer"}}>Elimina</button>
              <button onClick={()=>setConfirmDel(null)} style={{background:"#1a2d3d",color:"#c8d8e8",border:BD,borderRadius:10,padding:"9px 18px",cursor:"pointer"}}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════
   STEP 2 — ISPETTORE
   ═══════════════════════════════════ */
function StepInspector({ project, onUpdate }) {
  return (
    <div style={{padding:"20px"}}>
      <div style={{fontSize:11,color:"#C8A96E",letterSpacing:2,textTransform:"uppercase",marginBottom:16,fontWeight:700}}>Nome Ispettore / Compilatore</div>
      <div style={{background:"#162230",borderRadius:12,border:BD,padding:"16px"}}>
        <div style={{fontSize:11,color:"#7a9ab0",marginBottom:8}}>Il nome apparirà nel report di verifica</div>
        <input
          value={project.inspector||""}
          onChange={e=>onUpdate(e.target.value)}
          placeholder="Nome e cognome ispettore…"
          style={{width:"100%",background:"#0f1923",border:"1px solid #2a3f52",borderRadius:8,padding:"10px 14px",color:"#C8A96E",fontSize:14,outline:"none",fontWeight:600,boxSizing:"border-box"}}
        />
        {project.inspector&&(
          <div style={{marginTop:12,padding:"10px 14px",background:"#0f1923",borderRadius:8,border:"1px solid #C8A96E33"}}>
            <div style={{fontSize:10,color:"#7a9ab0",marginBottom:3}}>Ispettore impostato</div>
            <div style={{fontSize:15,fontWeight:700,color:"#C8A96E"}}>👤 {project.inspector}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   STEP 3 — DISCIPLINA
   Scelta della disciplina attiva per il progetto
   ═══════════════════════════════════ */
function StepDiscipline({ disciplines, project, onSelectDisc }) {
  const selected = project.selectedDisc || null;

  return (
    <div style={{flex:1,overflowY:"auto",padding:"20px"}}>
      <div style={{fontSize:11,color:"#C8A96E",letterSpacing:2,textTransform:"uppercase",marginBottom:6,fontWeight:700}}>Scegli la Disciplina</div>
      <div style={{fontSize:12,color:"#7a9ab0",marginBottom:18}}>Seleziona la disciplina da verificare. Poi sceglierai le norme applicabili.</div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {Object.entries(disciplines).map(([dk, d]) => {
          const isAct = selected === dk;
          const hasSections = d.sections.length > 0;
          return (
            <div key={dk} onClick={()=>onSelectDisc(dk)}
              style={{display:"flex",alignItems:"center",gap:16,padding:"16px 18px",background:isAct?`${d.color}18`:"#162230",border:`2px solid ${isAct?d.color:"#1a2d3d"}`,borderRadius:14,cursor:"pointer",transition:"all .15s"}}>
              <div style={{width:44,height:44,borderRadius:12,background:isAct?`${d.color}33`:"#0f1923",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                {d.icon}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:isAct?800:500,color:isAct?d.color:"#c8d8e8"}}>{d.label}</div>
                <div style={{fontSize:11,color:"#3a5468",marginTop:3}}>
                  {hasSections ? `${d.sections.length} sezioni disponibili` : "Nessuna norma — aggiungila dalla Libreria Norme"}
                </div>
              </div>
              <div style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${isAct?d.color:"#3a5468"}`,background:isAct?d.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {isAct&&<span style={{color:"#0a1520",fontSize:13,fontWeight:900}}>✓</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   STEP 4 — NORME
   Colonna sinistra: selezione sezioni da attivare
   Colonna destra:   editor libreria sempre visibile
   ═══════════════════════════════════ */
function StepNorms({ disciplines, setDisciplines, project, onToggle, onGoChecklist }) {
  const dk = project?.selectedDisc || null;
  const d  = dk ? disciplines[dk] : null;
  const activeSections = project?.activeSections || {};

  const [selSec,     setSelSec]     = useState(0);
  const [editItem,   setEditItem]   = useState(null);
  const [editText,   setEditText]   = useState("");
  const [editRef,    setEditRef]    = useState("");
  const [newSec,     setNewSec]     = useState("");
  const [newText,    setNewText]    = useState("");
  const [newRef,     setNewRef]     = useState("");
  const [confirmDel,    setConfirmDel]    = useState(null);
  const [newItemsState, setNewItemsState] = useState({});
  const [editDefault,   setEditDefault]   = useState(null);
  const [newDefault,    setNewDefault]    = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const sections = d?.sections || [];
  const sec = sections[selSec];

  const upd = fn => {
    const n = JSON.parse(JSON.stringify(disciplines));
    fn(n);
    setDisciplines(n);
    store.saveNorms(n);
  };

  const addSec   = () => { if(!newSec.trim())return; upd(n=>n[dk].sections.push({title:newSec.trim(),items:[]})); setSelSec(sections.length); setNewSec(""); };
  const addItem  = () => { if(!newText.trim())return; upd(n=>n[dk].sections[selSec].items.push({text:newText.trim(),ref:newRef.trim()})); setNewText(""); setNewRef(""); };
  const saveEdit = () => { if(!editText.trim())return; upd(n=>{n[dk].sections[editItem.si].items[editItem.ii]={text:editText.trim(),ref:editRef.trim(),defaultAnswer:editDefault||null};}); setEditItem(null); setEditDefault(null); };

  if (!dk || !d) return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:"#3a5468",padding:20}}>
      <div style={{fontSize:36}}>📚</div>
      <div style={{fontSize:14,fontWeight:700,color:"#c8d8e8"}}>Seleziona prima una disciplina</div>
      <div style={{fontSize:12}}>Torna al passo 3 e scegli la disciplina</div>
    </div>
  );

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

      {/* Intestazione */}
      <div style={{padding:"12px 20px",borderBottom:BD,background:`${d.color}10`,flexShrink:0,display:"flex",alignItems:"center",gap:12}}>
        <div style={{fontSize:26}}>{d.icon}</div>
        <div>
          <div style={{fontSize:15,fontWeight:800,color:d.color}}>{d.label}</div>
          <div style={{fontSize:11,color:"#7a9ab0",marginTop:1}}>
            Sinistra: seleziona le norme per questo progetto &nbsp;·&nbsp; Destra: gestisci la libreria
          </div>
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* ── COLONNA SINISTRA: selezione sezioni ── */}
        <div style={{flex:1,overflowY:"auto",padding:"14px 16px",borderRight:BD}}>
          <div style={{fontSize:11,color:"#C8A96E",letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>
            Seleziona norme da analizzare
          </div>

          {sections.length===0 ? (
            <div style={{textAlign:"center",color:"#3a5468",marginTop:40}}>
              <div style={{fontSize:32,marginBottom:8}}>📂</div>
              <div style={{fontSize:13,color:"#c8d8e8",fontWeight:700,marginBottom:4}}>Nessuna norma disponibile</div>
              <div style={{fontSize:11}}>Aggiungi sezioni e voci nella colonna destra →</div>
            </div>
          ) : (
            <>
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                <button onClick={()=>sections.forEach(s=>onToggle(dk,s.title,true))}
                  style={{background:`${d.color}22`,border:`1px solid ${d.color}44`,borderRadius:7,color:d.color,fontSize:11,fontWeight:700,padding:"5px 12px",cursor:"pointer"}}>✓ Tutte</button>
                <button onClick={()=>sections.forEach(s=>onToggle(dk,s.title,false))}
                  style={{background:"#162230",border:BD,borderRadius:7,color:"#7a9ab0",fontSize:11,padding:"5px 12px",cursor:"pointer"}}>✕ Nessuna</button>
              </div>

              {(() => {
                const renderedGroups = new Set();
                return sections.map((sec, si) => {
                  const secKey = `${dk}__${sec.title}`;
                  const active = !!activeSections[secKey];
                  const addText = newItemsState[si]?.text || "";
                  const addRef  = newItemsState[si]?.ref  || "";
                  const setAddText = v => setNewItemsState(p=>({...p,[si]:{...p[si],text:v}}));
                  const setAddRef  = v => setNewItemsState(p=>({...p,[si]:{...p[si],ref:v}}));
                  const grp = sec.group || null;
                  const isGroupCollapsed = grp ? !!collapsedGroups[grp] : false;
                  const showGroupHeader = grp && !renderedGroups.has(grp);
                  if (showGroupHeader) renderedGroups.add(grp);

                  // Conta sezioni attive nel gruppo per il badge
                  const groupActiveCnt = grp
                    ? sections.filter(s=>s.group===grp&&!!activeSections[`${dk}__${s.title}`]).length
                    : 0;
                  const groupTotalCnt  = grp ? sections.filter(s=>s.group===grp).length : 0;

                  return (
                    <div key={sec.title}>
                      {/* ── Intestazione di gruppo (primo elemento del gruppo) ── */}
                      {showGroupHeader && (
                        <div
                          onClick={()=>setCollapsedGroups(p=>({...p,[grp]:!p[grp]}))}
                          style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",marginBottom:6,borderRadius:10,background:"#0d1f2d",border:"2px solid #7EB8C444",cursor:"pointer",userSelect:"none"}}>
                          <span style={{fontSize:13,color:"#7EB8C4"}}>{isGroupCollapsed?"▶":"▼"}</span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,fontWeight:800,color:"#7EB8C4",letterSpacing:0.5}}>📐 {grp}</div>
                            <div style={{fontSize:10,color:"#3a5468",marginTop:1}}>{groupTotalCnt} sezioni · {groupActiveCnt} attive</div>
                          </div>
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={e=>{e.stopPropagation();sections.filter(s=>s.group===grp).forEach(s=>onToggle(dk,s.title,true));}}
                              style={{background:"#7EB8C422",border:"1px solid #7EB8C444",borderRadius:6,color:"#7EB8C4",fontSize:10,fontWeight:700,padding:"2px 8px",cursor:"pointer"}}>✓ Tutte</button>
                            <button onClick={e=>{e.stopPropagation();sections.filter(s=>s.group===grp).forEach(s=>onToggle(dk,s.title,false));}}
                              style={{background:"#162230",border:BD,borderRadius:6,color:"#7a9ab0",fontSize:10,padding:"2px 8px",cursor:"pointer"}}>✕</button>
                          </div>
                        </div>
                      )}

                      {/* ── Sezione (nascosta se il gruppo è collassato) ── */}
                      {!isGroupCollapsed && (
                        <div style={{marginBottom:10,marginLeft:grp?16:0,borderRadius:12,border:`2px solid ${active?d.color+"66":"#1a2d3d"}`,overflow:"hidden",background:active?`${d.color}0a`:"#0f1923"}}>

                          {/* Header sezione */}
                          <div onClick={()=>onToggle(dk,sec.title,!active)}
                            style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",cursor:"pointer",background:active?`${d.color}18`:"#162230"}}>
                            <div style={{width:24,height:24,borderRadius:6,border:`2px solid ${active?d.color:"#3a5468"}`,background:active?d.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                              {active&&<span style={{color:"#0a1520",fontSize:13,fontWeight:900}}>✓</span>}
                            </div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:12,fontWeight:active?700:400,color:active?"#e8edf2":"#7a9ab0"}}>{sec.title}</div>
                              <div style={{fontSize:10,color:"#3a5468",marginTop:2}}>{sec.items.length} voci</div>
                            </div>
                            {active&&<span style={{fontSize:10,color:d.color,fontWeight:700,background:`${d.color}22`,padding:"2px 9px",borderRadius:20}}>ATTIVA</span>}
                          </div>

                          {/* Voci espanse se sezione attiva */}
                          {active && (
                            <div style={{padding:"10px 14px",background:"#0a1520"}} onClick={e=>e.stopPropagation()}>
                              {sec.items.map((item, ii) => (
                                <div key={ii} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"7px 10px",background:"#162230",borderRadius:8,marginBottom:6,border:BD}}>
                                  <div style={{flex:1}}>
                                    <div style={{fontSize:11,color:"#c8d8e8",lineHeight:1.5}}>{item.text}</div>
                                    {item.ref&&<div style={{fontSize:9,color:"#C8A96E",fontStyle:"italic",marginTop:2}}>📌 {item.ref}</div>}
                                  </div>
                                  <button
                                    onClick={()=>setConfirmDel({msg:"Eliminare questa voce?",action:()=>{upd(n=>n[dk].sections[si].items.splice(ii,1));setConfirmDel(null);}})}
                                    style={{background:"transparent",border:BD,borderRadius:5,color:"#ef5350",cursor:"pointer",fontSize:11,padding:"2px 7px",flexShrink:0}}>🗑</button>
                                </div>
                              ))}
                              {sec.items.length===0&&<div style={{color:"#3a5468",fontSize:10,fontStyle:"italic",marginBottom:8,textAlign:"center"}}>Nessuna voce</div>}
                              <div style={{marginTop:8,background:"#0d1f2d",borderRadius:8,border:"1px solid #C8A96E22",padding:10}}>
                                <div style={{fontSize:9,color:"#C8A96E",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>+ Aggiungi voce</div>
                                <textarea value={addText} onChange={e=>setAddText(e.target.value)} rows={2}
                                  placeholder="Descrizione voce di controllo…"
                                  style={{width:"100%",background:"#0f1923",border:BD,borderRadius:6,padding:"5px 8px",color:"#e8edf2",fontSize:11,outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
                                <input value={addRef} onChange={e=>setAddRef(e.target.value)}
                                  placeholder="Rif. normativo (opzionale)"
                                  style={{width:"100%",marginTop:4,background:"#0f1923",border:"1px solid #C8A96E33",borderRadius:6,padding:"4px 8px",color:"#C8A96E",fontSize:10,outline:"none",boxSizing:"border-box"}}/>
                                <button onClick={()=>{
                                  if(!addText.trim())return;
                                  upd(n=>n[dk].sections[si].items.push({text:addText.trim(),ref:addRef.trim()}));
                                  setNewItemsState(p=>({...p,[si]:{text:"",ref:""}}));
                                }} style={{marginTop:6,background:"#C8A96E",color:"#0a1520",border:"none",borderRadius:6,padding:"5px 14px",fontWeight:800,fontSize:11,cursor:"pointer"}}>
                                  + Aggiungi
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </>
          )}
        </div>

        {/* ── COLONNA DESTRA: editor libreria ── */}
        <div style={{width:360,display:"flex",flexDirection:"column",background:"#0a1520",overflow:"hidden",flexShrink:0}}>

          {/* Header editor */}
          <div style={{padding:"10px 14px",borderBottom:BD,background:"#0f1923",flexShrink:0}}>
            <div style={{fontSize:11,color:"#C8A96E",letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>⚖️ Libreria Norme — {d.label}</div>
          </div>

          {/* Lista sezioni */}
          <div style={{borderBottom:BD,maxHeight:170,overflowY:"auto",flexShrink:0}}>
            {sections.length===0&&<div style={{padding:"8px 14px",fontSize:11,color:"#3a5468",fontStyle:"italic"}}>Nessuna sezione — aggiungine una ↓</div>}
            {sections.map((s,si)=>(
              <div key={si} style={{display:"flex",alignItems:"center",background:selSec===si?"#162230":"transparent"}}>
                <button onClick={()=>{setSelSec(si);setEditItem(null);}}
                  style={{flex:1,textAlign:"left",padding:"8px 14px",border:"none",background:"transparent",color:selSec===si?"#e8edf2":"#7a9ab0",cursor:"pointer",fontSize:11}}>
                  {s.title.length>30?s.title.slice(0,30)+"…":s.title}
                  <span style={{fontSize:9,color:"#3a5468",marginLeft:4}}>({s.items.length})</span>
                </button>
                <button onClick={()=>setConfirmDel({msg:`Eliminare "${s.title}"?`,action:()=>{upd(n=>n[dk].sections.splice(si,1));setSelSec(Math.max(0,si-1));setConfirmDel(null);}})}
                  style={{background:"transparent",border:"none",color:"#3a5468",cursor:"pointer",fontSize:12,padding:"0 10px 0 0"}}>🗑</button>
              </div>
            ))}
          </div>

          {/* Aggiungi sezione */}
          <div style={{padding:"8px 12px",borderBottom:BD,flexShrink:0}}>
            <div style={{fontSize:10,color:"#7a9ab0",marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>+ Nuova sezione</div>
            <div style={{display:"flex",gap:6}}>
              <input value={newSec} onChange={e=>setNewSec(e.target.value)} placeholder="Titolo sezione normativa…"
                onKeyDown={e=>e.key==="Enter"&&addSec()}
                style={{flex:1,background:"#162230",border:BD,borderRadius:6,padding:"6px 8px",color:"#e8edf2",fontSize:11,outline:"none",boxSizing:"border-box"}}/>
              <button onClick={addSec} style={{background:"#C8A96E",color:"#0a1520",border:"none",borderRadius:6,padding:"6px 12px",fontWeight:800,fontSize:13,cursor:"pointer"}}>+</button>
            </div>
          </div>

          {/* Voci della sezione selezionata */}
          <div style={{flex:1,overflowY:"auto",padding:"10px 12px"}}>
            {!sec ? (
              <div style={{color:"#3a5468",fontSize:11,textAlign:"center",marginTop:20}}>Seleziona una sezione per gestirne le voci</div>
            ) : (
              <>
                <div style={{fontSize:11,fontWeight:700,color:"#C8A96E",marginBottom:8,paddingBottom:6,borderBottom:BD}}>
                  {sec.title}
                  <span style={{fontSize:9,color:"#3a5468",fontWeight:400,marginLeft:6}}>{sec.items.length} voci</span>
                </div>

                {sec.items.length===0&&<div style={{color:"#3a5468",fontSize:10,fontStyle:"italic",marginBottom:8}}>Nessuna voce — aggiungine una ↓</div>}

                {sec.items.map((item,ii)=>(
                  <div key={ii} style={{marginBottom:8,background:"#162230",borderRadius:9,border:BD,overflow:"hidden"}}>
                    {editItem?.si===selSec&&editItem?.ii===ii ? (
                      /* ── EDIT MODE ── */
                      <div style={{padding:10}}>
                        <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={2}
                          style={{width:"100%",background:"#0f1923",border:"1px solid #C8A96E44",borderRadius:6,padding:"5px 8px",color:"#e8edf2",fontSize:11,outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
                        <input value={editRef} onChange={e=>setEditRef(e.target.value)} placeholder="Rif. normativo (es. D.Lgs. 81/2008, Art. 91)"
                          style={{width:"100%",marginTop:4,background:"#0f1923",border:"1px solid #C8A96E33",borderRadius:6,padding:"4px 8px",color:"#C8A96E",fontSize:10,outline:"none",boxSizing:"border-box"}}/>
                        {/* Risposta di default */}
                        <div style={{marginTop:8}}>
                          <div style={{fontSize:9,color:"#7a9ab0",marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>Risposta di default</div>
                          <div style={{display:"flex",gap:5}}>
                            {[["ok","✓ Sì","#22863a"],["ko","✗ No","#cb2431"],["na","N/A","#6a737d"]].map(([val,lbl,col])=>(
                              <button key={val} onClick={()=>setEditDefault(val===editDefault?null:val)}
                                style={{padding:"4px 12px",borderRadius:20,border:`2px solid ${col}`,background:editDefault===val?col:"transparent",color:editDefault===val?"white":col,fontWeight:700,fontSize:11,cursor:"pointer"}}>
                                {lbl}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={{display:"flex",gap:5,marginTop:8}}>
                          <button onClick={saveEdit} style={{background:"#22863a",color:"white",border:"none",borderRadius:6,padding:"5px 14px",fontWeight:700,fontSize:11,cursor:"pointer"}}>✓ Salva</button>
                          <button onClick={()=>setEditItem(null)} style={{background:"#1a2d3d",color:"#7a9ab0",border:BD,borderRadius:6,padding:"5px 10px",fontSize:11,cursor:"pointer"}}>Annulla</button>
                        </div>
                      </div>
                    ) : (
                      /* ── VIEW MODE ── */
                      <div style={{padding:"9px 11px"}}>
                        <div style={{display:"flex",alignItems:"flex-start",gap:6}}>
                          <div style={{flex:1}}>
                            <div style={{fontSize:11,color:"#c8d8e8",lineHeight:1.5}}>{item.text}</div>
                            <div style={{fontSize:9,color:"#C8A96E",fontStyle:"italic",marginTop:2}}>📌 {item.ref||<span style={{color:"#3a5468"}}>nessun riferimento</span>}</div>
                          </div>
                          <div style={{display:"flex",gap:2,flexShrink:0}}>
                            <button onClick={()=>{setEditItem({si:selSec,ii});setEditText(item.text);setEditRef(item.ref||"");setEditDefault(item.defaultAnswer||null);}}
                              style={{background:"#1a2d3d",color:"#7a9ab0",border:BD,borderRadius:5,padding:"3px 7px",fontSize:10,cursor:"pointer"}}>✏️</button>
                            <button onClick={()=>setConfirmDel({msg:"Eliminare questa voce?",action:()=>{upd(n=>n[dk].sections[selSec].items.splice(ii,1));setConfirmDel(null);}})}
                              style={{background:"#1a2d3d",color:"#ef5350",border:BD,borderRadius:5,padding:"3px 7px",fontSize:10,cursor:"pointer"}}>🗑</button>
                          </div>
                        </div>
                        {/* Risposta di default */}
                        <div style={{display:"flex",gap:5,marginTop:7}}>
                          {[["ok","✓ Sì","#22863a"],["ko","✗ No","#cb2431"],["na","N/A","#6a737d"]].map(([val,lbl,col])=>{
                            const isSet = item.defaultAnswer===val;
                            return (
                              <button key={val}
                                onClick={()=>upd(n=>{n[dk].sections[selSec].items[ii].defaultAnswer = isSet?null:val;})}
                                style={{padding:"3px 11px",borderRadius:20,border:`2px solid ${col}`,background:isSet?col:"transparent",color:isSet?"white":col,fontWeight:700,fontSize:10,cursor:"pointer"}}>
                                {lbl}
                              </button>
                            );
                          })}
                          {!item.defaultAnswer&&<span style={{fontSize:9,color:"#3a5468",alignSelf:"center"}}>nessun default</span>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Aggiungi nuova voce */}
                <div style={{marginTop:10,background:"#0d1f2d",borderRadius:9,border:"1px solid #C8A96E22",padding:11}}>
                  <div style={{fontSize:9,color:"#C8A96E",letterSpacing:2,textTransform:"uppercase",marginBottom:7}}>+ Nuova voce</div>
                  <textarea value={newText} onChange={e=>setNewText(e.target.value)} rows={2}
                    placeholder="Descrizione della voce di controllo…"
                    style={{width:"100%",background:"#0f1923",border:BD,borderRadius:6,padding:"5px 8px",color:"#e8edf2",fontSize:11,outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
                  <input value={newRef} onChange={e=>setNewRef(e.target.value)}
                    placeholder="Rif. normativo (es. D.M. 236/1989, Art. 8.1.1)"
                    style={{width:"100%",marginTop:4,background:"#0f1923",border:"1px solid #C8A96E33",borderRadius:6,padding:"4px 8px",color:"#C8A96E",fontSize:10,outline:"none",boxSizing:"border-box"}}/>
                  <div style={{marginTop:7}}>
                    <div style={{fontSize:9,color:"#7a9ab0",marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>Risposta di default</div>
                    <div style={{display:"flex",gap:5}}>
                      {[["ok","✓ Sì","#22863a"],["ko","✗ No","#cb2431"],["na","N/A","#6a737d"]].map(([val,lbl,col])=>(
                        <button key={val} onClick={()=>setNewDefault(newDefault===val?null:val)}
                          style={{padding:"3px 11px",borderRadius:20,border:`2px solid ${col}`,background:newDefault===val?col:"transparent",color:newDefault===val?"white":col,fontWeight:700,fontSize:10,cursor:"pointer"}}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={()=>{
                    if(!newText.trim())return;
                    upd(n=>n[dk].sections[selSec].items.push({text:newText.trim(),ref:newRef.trim(),defaultAnswer:newDefault||null}));
                    setNewText(""); setNewRef(""); setNewDefault(null);
                  }} style={{marginTop:8,background:"#C8A96E",color:"#0a1520",border:"none",borderRadius:7,padding:"6px 16px",fontWeight:800,fontSize:12,cursor:"pointer"}}>
                    + Aggiungi voce
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmDel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#162230",borderRadius:12,border:"1px solid #ef535044",padding:22,maxWidth:320,width:"100%",textAlign:"center"}}>
            <div style={{fontSize:26,marginBottom:8}}>⚠️</div>
            <div style={{color:"#e8edf2",fontWeight:700,marginBottom:14,fontSize:13}}>{confirmDel.msg}</div>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <button onClick={confirmDel.action} style={{background:"#ef5350",color:"white",border:"none",borderRadius:8,padding:"7px 18px",fontWeight:700,cursor:"pointer"}}>Elimina</button>
              <button onClick={()=>setConfirmDel(null)} style={{background:"#1a2d3d",color:"#7a9ab0",border:BD,borderRadius:8,padding:"7px 14px",cursor:"pointer"}}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════
   STEP 5 — CHECKLIST
   ═══════════════════════════════════ */
function StepChecklist({ project, disciplines, onSetStatus, onSetNote, onSetRemark }) {
  const [selDisc, setSelDisc] = useState(null);
  const [expandedSecs, setExpandedSecs] = useState({});
  const [showPDF, setShowPDF] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const activeSections = project.activeSections || {};
  const selectedDisc   = project.selectedDisc   || null;

  const getActiveSecs = dk =>
    (disciplines[dk]?.sections||[]).filter(s => activeSections[`${dk}__${s.title}`]);

  const activeDiscsKeys = Object.keys(disciplines).filter(dk => getActiveSecs(dk).length > 0);

  // Disciplina corrente: quella scelta al passo 3 (se attiva), altrimenti la prima attiva
  const preferredDisc = (selectedDisc && activeDiscsKeys.includes(selectedDisc))
    ? selectedDisc : (activeDiscsKeys[0] || null);

  // selDisc è lo stato locale per navigare tra tab; usa preferredDisc come default
  const currentDisc = (selDisc && activeDiscsKeys.includes(selDisc))
    ? selDisc : preferredDisc;

  const getProgress = dk => {
    const secs=getActiveSecs(dk);
    const total=secs.reduce((a,s)=>a+s.items.length,0);
    const done=secs.reduce((a,s)=>a+s.items.filter(i=>project.checklist[`${dk}__${s.title}__${i.text}`]).length,0);
    return {total,done,pct:total?Math.round(done/total*100):0};
  };

  const totalPct = () => {
    const total=activeDiscsKeys.flatMap(dk=>getActiveSecs(dk)).reduce((a,s)=>a+s.items.length,0);
    const si=Object.values(project.checklist).filter(v=>v==="ok").length;
    return total?Math.round(si/total*100):0;
  };

  const noCount = Object.values(project.checklist).filter(v=>v==="ko").length;
  const disc = currentDisc ? disciplines[currentDisc] : null;
  const currentSecs = currentDisc ? getActiveSecs(currentDisc) : [];

  if(activeDiscsKeys.length===0) return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:"#3a5468",padding:20}}>
      <div style={{fontSize:40}}>📋</div>
      <div style={{fontSize:15,fontWeight:700,color:"#c8d8e8",textAlign:"center"}}>Nessuna disciplina attiva</div>
      <div style={{fontSize:12,textAlign:"center"}}>Vai al passo 3 per selezionare le discipline e le sezioni normative</div>
    </div>
  );

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

      {/* Barra superiore con progress e export */}
      <div style={{padding:"10px 16px",borderBottom:BD,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:20,fontWeight:800,color:"#C8A96E"}}>{totalPct()}%</div>
          <div style={{width:80,height:4,background:"#1a2d3d",borderRadius:2}}>
            <div style={{height:"100%",width:`${totalPct()}%`,background:"#C8A96E",borderRadius:2,transition:"width .4s"}}/>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setShowPDF(true)} style={{background:"linear-gradient(135deg,#c0392b,#8b0000)",border:"none",color:"white",borderRadius:7,padding:"6px 12px",fontWeight:700,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
            📕 PDF {noCount>0&&<span style={{background:"rgba(255,255,255,0.25)",borderRadius:8,padding:"0 5px",fontSize:10}}>{noCount}✗</span>}
          </button>
          <button onClick={()=>exportHTML(project,disciplines)} style={{background:"#162230",border:BD,color:"#c8d8e8",borderRadius:7,padding:"6px 10px",fontWeight:600,fontSize:11,cursor:"pointer"}}>🌐 HTML</button>
          <button onClick={()=>exportExcel(project,disciplines)} style={{background:"linear-gradient(135deg,#C8A96E,#a07040)",border:"none",color:"white",borderRadius:7,padding:"6px 12px",fontWeight:700,fontSize:11,cursor:"pointer"}}>📊 Excel</button>
        </div>
      </div>

      {/* Tab discipline */}
      <div style={{display:"flex",gap:6,padding:"10px 16px",overflowX:"auto",borderBottom:BD,flexShrink:0}}>
        {activeDiscsKeys.map(dk=>{
          const {pct,done,total}=getProgress(dk);
          const d=disciplines[dk];
          const isAct=currentDisc===dk;
          return (
            <button key={dk} onClick={()=>setSelDisc(dk)}
              style={{flex:"0 0 auto",background:isAct?`${d.color}22`:"#162230",border:`2px solid ${isAct?d.color:"#243344"}`,borderRadius:10,padding:"9px 14px",cursor:"pointer",minWidth:130,textAlign:"left"}}>
              <div style={{fontSize:17,marginBottom:1}}>{d.icon}</div>
              <div style={{fontSize:12,fontWeight:700,color:isAct?d.color:"#c8d8e8"}}>{d.label}</div>
              <div style={{fontSize:10,color:"#7a9ab0",marginTop:1}}>{done}/{total}</div>
              <div style={{height:2,background:"#1a2d3d",borderRadius:2,marginTop:4}}><div style={{height:"100%",width:`${pct}%`,background:d.color,borderRadius:2,transition:"width .4s"}}/></div>
            </button>
          );
        })}
      </div>

      {/* Sezioni e voci */}
      <div style={{flex:1,overflowY:"auto",padding:"12px 16px 32px"}}>
        {(()=>{
          const renderedGrps = new Set();
          const [collGrps, setCollGrps] = [expandedSecs, setExpandedSecs]; // riuso state
          return currentSecs.map(sec=>{
            const grp = sec.group || null;
            const grpKey = grp ? `__grp__${grp}` : null;
            const isGrpCollapsed = grp ? collGrps[grpKey]===true : false;
            const showGrpHeader = grp && !renderedGrps.has(grp);
            if (showGrpHeader) renderedGrps.add(grp);

            const grpOkCnt  = grp ? currentSecs.filter(s=>s.group===grp).reduce((a,s)=>a+s.items.filter(i=>project.checklist[`${currentDisc}__${s.title}__${i.text}`]==="ok").length,0) : 0;
            const grpNoCnt  = grp ? currentSecs.filter(s=>s.group===grp).reduce((a,s)=>a+s.items.filter(i=>project.checklist[`${currentDisc}__${s.title}__${i.text}`]==="ko").length,0) : 0;
            const grpTotal  = grp ? currentSecs.filter(s=>s.group===grp).reduce((a,s)=>a+s.items.length,0) : 0;

            const isOpen=expandedSecs[sec.title]!==false;
            const secSi=sec.items.filter(i=>project.checklist[`${currentDisc}__${sec.title}__${i.text}`]==="ok").length;
            const secNo=sec.items.filter(i=>project.checklist[`${currentDisc}__${sec.title}__${i.text}`]==="ko").length;
            return (
              <div key={sec.title}>
                {/* ── Intestazione gruppo ── */}
                {showGrpHeader && (
                  <div
                    onClick={()=>setExpandedSecs(p=>({...p,[grpKey]:!p[grpKey]}))}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",marginBottom:8,borderRadius:10,background:"#0d1f2d",border:"2px solid #7EB8C444",cursor:"pointer",userSelect:"none"}}>
                    <span style={{fontSize:13,color:"#7EB8C4"}}>{isGrpCollapsed?"▶":"▼"}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:800,color:"#7EB8C4",letterSpacing:0.5}}>📐 {grp}</div>
                      <div style={{fontSize:10,color:"#3a5468",marginTop:1}}>{grpTotal} voci totali nel gruppo</div>
                    </div>
                    {grpOkCnt>0&&<span style={{background:"#22863a22",color:"#4caf50",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>✓{grpOkCnt}</span>}
                    {grpNoCnt>0&&<span style={{background:"#cb243122",color:"#ef5350",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>✗{grpNoCnt}</span>}
                  </div>
                )}

                {/* ── Sezione (nascosta se il gruppo è collassato) ── */}
                {!isGrpCollapsed && (
                  <div style={{marginBottom:11,marginLeft:grp?12:0,background:"#162230",borderRadius:12,border:BD,overflow:"hidden"}}>
                    <div onClick={()=>setExpandedSecs(p=>({...p,[sec.title]:!isOpen}))}
                      style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 15px",cursor:"pointer",borderBottom:isOpen?BD:"none"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
                        <div style={{width:3,height:18,background:disc?.color||"#C8A96E",borderRadius:2,flexShrink:0}}/>
                        <span style={{fontSize:12,fontWeight:700,color:"#c8d8e8"}}>{sec.title}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:9,color:"#3a5468"}}>{secSi+secNo}/{sec.items.length}</span>
                        {secSi>0&&<span style={{background:"#22863a22",color:"#4caf50",fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:20}}>✓{secSi}</span>}
                        {secNo>0&&<span style={{background:"#cb243122",color:"#ef5350",fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:20}}>✗{secNo}</span>}
                        <span style={{color:"#3a5468",fontSize:11}}>{isOpen?"▲":"▼"}</span>
                      </div>
                    </div>
                    {isOpen&&sec.items.map(item=>{
                      const key=`${currentDisc}__${sec.title}__${item.text}`;
                      const status = project.checklist[key] !== undefined
                        ? project.checklist[key]
                        : (item.defaultAnswer || undefined);
                      const bgColor = status==="ko"?"#cb243108":status==="ok"?"#22863a08":status==="na"?"#ffffff05":"transparent";
                      return (
                        <div key={item.text} style={{borderBottom:BD,padding:"10px 15px",background:bgColor}}>
                          <div style={{display:"flex",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
                            <div style={{flex:1,minWidth:160}}>
                              <div style={{fontSize:12,color:"#c8d8e8",lineHeight:1.5}}>{item.text}</div>
                              {item.ref&&<div style={{fontSize:10,color:"#C8A96E",marginTop:2,fontStyle:"italic"}}>📌 {item.ref}</div>}
                              {item.defaultAnswer&&project.checklist[key]===undefined&&(
                                <div style={{fontSize:9,color:"#7a9ab0",marginTop:3,fontStyle:"italic"}}>default libreria: {item.defaultAnswer==="ok"?"✓ Sì":item.defaultAnswer==="ko"?"✗ No":"N/A"}</div>
                              )}
                            </div>
                            <div style={{display:"flex",gap:4,flexShrink:0}}>
                              <SBtn active={status==="ok"} onClick={()=>onSetStatus(key,"ok")} label="✓ Sì" color="#22863a"/>
                              <SBtn active={status==="ko"} onClick={()=>onSetStatus(key,"ko")} label="✗ No" color="#cb2431"/>
                              <SBtn active={status==="na"} onClick={()=>onSetStatus(key,"na")} label="N/A" color="#6a737d"/>
                            </div>
                          </div>
                          <div style={{marginTop:7}}>
                            <input value={project.notes[key]||""} onChange={e=>onSetNote(key,e.target.value)} placeholder="Note tecniche…"
                              style={{width:"100%",background:"#0f1923",border:BD,borderRadius:7,padding:"5px 10px",color:"#c8d8e8",fontSize:11,outline:"none",boxSizing:"border-box"}}/>
                          </div>
                          <div style={{marginTop:5}}>
                            <div style={{fontSize:9,color:"#C8A96E",letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>📝 Rilievo ispettore</div>
                            <textarea value={project.remarks?.[key]||""} onChange={e=>onSetRemark(key,e.target.value)}
                              placeholder="Rilievo rilevato in loco dall'ispettore…" rows={2}
                              style={{width:"100%",background:"#0d1f2d",border:"1px solid #C8A96E44",borderRadius:7,padding:"5px 10px",color:"#C8A96E",fontSize:11,outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          });
        })()}
      </div>

      {/* Modal PDF */}
      {showPDF&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#0f1923",borderRadius:14,border:"1px solid #C8A96E44",width:"100%",maxWidth:420,overflow:"hidden"}}>
            <div style={{padding:"16px 20px",borderBottom:BD,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:15,fontWeight:800,color:"#e8edf2"}}>Genera PDF</div>
              <button onClick={()=>setShowPDF(false)} style={{background:"transparent",border:BD,borderRadius:7,color:"#7a9ab0",fontSize:14,padding:"3px 9px",cursor:"pointer"}}>✕</button>
            </div>
            <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:10}}>
              <div onClick={()=>{if(pdfLoading)return;setPdfLoading(true);try{exportPDF(project,disciplines,"full");}finally{setPdfLoading(false);setShowPDF(false);}}}
                style={{background:"#162230",border:"1px solid #C8A96E44",borderRadius:11,padding:"16px",cursor:pdfLoading?"wait":"pointer",opacity:pdfLoading?0.6:1,display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:28}}>📄</div>
                <div><div style={{fontSize:13,fontWeight:800,color:"#e8edf2"}}>Report Completo</div><div style={{fontSize:11,color:"#7a9ab0",marginTop:2}}>Anteprima a schermo intero + scarica file</div></div>
              </div>
              <div onClick={()=>{if(pdfLoading)return;setPdfLoading(true);try{exportPDF(project,disciplines,"issues");}finally{setPdfLoading(false);setShowPDF(false);}}}
                style={{background:"#1a0f0f",border:"1px solid #ef535044",borderRadius:11,padding:"16px",cursor:pdfLoading?"wait":"pointer",opacity:pdfLoading?0.6:1,display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:28}}>⚠️</div>
                <div><div style={{fontSize:13,fontWeight:800,color:"#ef5350"}}>Solo Non Conformità</div><div style={{fontSize:11,color:"#7a9ab0",marginTop:2}}>Voci con risposta NO <span style={{background:"#ef535022",color:"#ef5350",padding:"0 6px",borderRadius:8,fontWeight:700}}>{noCount}</span></div></div>
              </div>
              {pdfLoading&&<div style={{textAlign:"center",color:"#C8A96E",fontSize:12}}>⏳ Generazione in corso…</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   LIBRARY EDITOR — standalone
   ════════════════════════════════════════════════ */

function LibraryEditor({ disciplines, setDisciplines }) {
  const [selDisc,    setSelDisc]    = useState(Object.keys(disciplines)[0]);
  const [selSec,     setSelSec]     = useState(0);
  const [editItem,   setEditItem]   = useState(null);
  const [editText,   setEditText]   = useState("");
  const [editRef,    setEditRef]    = useState("");
  const [editDef,    setEditDef]    = useState(null);
  const [newSec,     setNewSec]     = useState("");
  const [newText,    setNewText]    = useState("");
  const [newRef,     setNewRef]     = useState("");
  const [newDef,     setNewDef]     = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [showNewDisc,setShowNewDisc]= useState(false);
  const [newDiscName,setNewDiscName]= useState("");
  const [newDiscIcon,setNewDiscIcon]= useState("📋");
  const [newDiscColor,setNewDiscColor]=useState("#C8A96E");
  const [collapsedLibGroups, setCollapsedLibGroups] = useState({});

  const disc=disciplines[selDisc]||{}; const sections=disc.sections||[]; const sec=sections[selSec];

  const upd=fn=>{const n=JSON.parse(JSON.stringify(disciplines));fn(n);setDisciplines(n);};
  const addSec=()=>{if(!newSec.trim())return;upd(n=>n[selDisc].sections.push({title:newSec.trim(),items:[]}));setSelSec(sections.length);setNewSec("");};
  const addItem=()=>{if(!newText.trim())return;upd(n=>n[selDisc].sections[selSec].items.push({text:newText.trim(),ref:newRef.trim(),defaultAnswer:newDef||null}));setNewText("");setNewRef("");setNewDef(null);};
  const saveEdit=()=>{if(!editText.trim())return;upd(n=>{n[selDisc].sections[editItem.si].items[editItem.ii]={text:editText.trim(),ref:editRef.trim(),defaultAnswer:editDef||null};});setEditItem(null);};
  const addDisc=()=>{
    if(!newDiscName.trim())return;
    const key=newDiscName.trim().toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"")+"_"+Date.now();
    upd(n=>{n[key]={label:newDiscName.trim(),icon:newDiscIcon,color:newDiscColor,sections:[]};});
    setSelDisc(key);setSelSec(0);setNewDiscName("");setShowNewDisc(false);
  };

  return (
    <div style={{display:"flex",height:"100%",overflow:"hidden"}}>
      {/* Colonna discipline + sezioni */}
      <div style={{width:220,borderRight:BD,display:"flex",flexDirection:"column",background:"#0a1520",overflowY:"auto",flexShrink:0}}>
        <div style={{padding:"8px 12px 4px",fontSize:10,color:"#C8A96E",letterSpacing:2,textTransform:"uppercase"}}>Discipline</div>
        {Object.entries(disciplines).map(([key,d])=>(
          <div key={key} style={{display:"flex",alignItems:"center",borderLeft:`3px solid ${selDisc===key?d.color:"transparent"}`}}>
            <button onClick={()=>{setSelDisc(key);setSelSec(0);setEditItem(null);}}
              style={{flex:1,textAlign:"left",padding:"8px 12px",background:selDisc===key?"#1a2d3d":"transparent",border:"none",color:selDisc===key?d.color:"#7a9ab0",cursor:"pointer",fontSize:12,fontWeight:selDisc===key?700:400}}>
              {d.icon} {d.label} <span style={{fontSize:9,color:"#3a5468"}}>({d.sections.length})</span>
            </button>
            <button onClick={()=>setConfirmDel({msg:`Eliminare "${d.label}"?`,action:()=>{const rem=Object.keys(disciplines).filter(k=>k!==key);if(!rem.length)return;upd(n=>{delete n[key];});setSelDisc(rem[0]);setSelSec(0);setConfirmDel(null);}})}
              style={{background:"transparent",border:"none",color:"#3a5468",cursor:"pointer",fontSize:11,padding:"2px 6px"}}>🗑</button>
          </div>
        ))}
        {!showNewDisc?(
          <button onClick={()=>setShowNewDisc(true)} style={{margin:"6px 10px",background:"#C8A96E14",border:"1px dashed #C8A96E44",borderRadius:7,color:"#C8A96E",fontSize:10,fontWeight:700,padding:"6px",cursor:"pointer"}}>+ Nuova disciplina</button>
        ):(
          <div style={{padding:"8px 10px",borderTop:BD,background:"#0d1520"}}>
            <input value={newDiscName} onChange={e=>setNewDiscName(e.target.value)} placeholder="Nome…" onKeyDown={e=>e.key==="Enter"&&addDisc()}
              style={{width:"100%",background:"#162230",border:BD,borderRadius:6,padding:"5px 8px",color:"#e8edf2",fontSize:11,outline:"none",boxSizing:"border-box"}}/>
            <div style={{display:"flex",flexWrap:"wrap",gap:3,marginTop:6}}>
              {ICONS.map(ic=><button key={ic} onClick={()=>setNewDiscIcon(ic)} style={{background:newDiscIcon===ic?"#C8A96E33":"#162230",border:`1px solid ${newDiscIcon===ic?"#C8A96E":BD.split(" ")[2]}`,borderRadius:5,padding:"3px 5px",cursor:"pointer",fontSize:12}}>{ic}</button>)}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>
              {PALETTE.map(c=><button key={c} onClick={()=>setNewDiscColor(c)} style={{width:20,height:20,borderRadius:"50%",background:c,border:`2px solid ${newDiscColor===c?"white":"transparent"}`,cursor:"pointer",padding:0}}/>)}
            </div>
            <div style={{display:"flex",gap:5,marginTop:8}}>
              <button onClick={addDisc} style={{flex:1,background:"#C8A96E",color:"#0a1520",border:"none",borderRadius:7,padding:"5px",fontWeight:800,fontSize:11,cursor:"pointer"}}>{newDiscIcon} Crea</button>
              <button onClick={()=>{setShowNewDisc(false);setNewDiscName("");}} style={{background:"#1a2d3d",color:"#7a9ab0",border:BD,borderRadius:7,padding:"5px 8px",fontSize:11,cursor:"pointer"}}>✕</button>
            </div>
          </div>
        )}
        <div style={{borderTop:BD,padding:"8px 12px 4px",marginTop:4,fontSize:10,color:"#C8A96E",letterSpacing:2,textTransform:"uppercase"}}>Sezioni</div>
        {sections.length===0&&<div style={{padding:"6px 12px",fontSize:10,color:"#3a5468",fontStyle:"italic"}}>Nessuna sezione</div>}
        {(()=>{
          const renderedGrps=new Set();
          return sections.map((s,si)=>{
            const grp=s.group||null;
            const isGrpCollapsed=grp?!!collapsedLibGroups[grp]:false;
            const showGrpHeader=grp&&!renderedGrps.has(grp);
            if(showGrpHeader) renderedGrps.add(grp);
            const grpCount=grp?sections.filter(x=>x.group===grp).length:0;
            return (
              <div key={si}>
                {showGrpHeader&&(
                  <div onClick={()=>setCollapsedLibGroups(p=>({...p,[grp]:!p[grp]}))}
                    style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",margin:"4px 6px 2px",borderRadius:7,background:"#0d1f2d",border:"1px solid #7EB8C433",cursor:"pointer",userSelect:"none"}}>
                    <span style={{fontSize:10,color:"#7EB8C4"}}>{isGrpCollapsed?"▶":"▼"}</span>
                    <span style={{flex:1,fontSize:10,fontWeight:800,color:"#7EB8C4",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>📐 {grp}</span>
                    <span style={{fontSize:9,color:"#3a5468",flexShrink:0}}>({grpCount})</span>
                  </div>
                )}
                {!isGrpCollapsed&&(
                  <div style={{display:"flex",alignItems:"center",paddingLeft:grp?8:0}}>
                    <button onClick={()=>{setSelSec(si);setEditItem(null);}}
                      style={{flex:1,textAlign:"left",padding:"5px 12px",background:selSec===si?"#162230":"transparent",border:"none",color:selSec===si?"#e8edf2":"#7a9ab0",cursor:"pointer",fontSize:11}}>
                      {s.title.length>24?s.title.slice(0,24)+"…":s.title} <span style={{fontSize:9,color:"#3a5468"}}>({s.items.length})</span>
                    </button>
                    <button onClick={()=>setConfirmDel({msg:"Eliminare la sezione?",action:()=>{upd(n=>n[selDisc].sections.splice(si,1));setSelSec(Math.max(0,si-1));setConfirmDel(null);}})}
                      style={{background:"transparent",border:"none",color:"#3a5468",cursor:"pointer",fontSize:11,padding:"0 8px 0 0"}}>🗑</button>
                  </div>
                )}
              </div>
            );
          });
        })()}
        <div style={{padding:"8px 10px",borderTop:BD,marginTop:4}}>
          <input value={newSec} onChange={e=>setNewSec(e.target.value)} placeholder="Titolo sezione…" onKeyDown={e=>e.key==="Enter"&&addSec()}
            style={{width:"100%",background:"#162230",border:BD,borderRadius:6,padding:"5px 8px",color:"#e8edf2",fontSize:11,outline:"none",boxSizing:"border-box"}}/>
          <button onClick={addSec} style={{marginTop:5,width:"100%",background:"#C8A96E22",color:"#C8A96E",border:"1px solid #C8A96E44",borderRadius:7,padding:"5px",fontSize:10,fontWeight:700,cursor:"pointer"}}>+ Aggiungi sezione</button>
        </div>
      </div>

      {/* Colonna voci */}
      <div style={{flex:1,overflowY:"auto",padding:"14px 16px",background:"#0f1923"}}>
        {!sec?(
          <div style={{color:"#3a5468",textAlign:"center",marginTop:40}}>
            <div style={{fontSize:32,marginBottom:8}}>📋</div>
            <div style={{fontSize:13,color:"#c8d8e8",fontWeight:700}}>Seleziona o crea una sezione</div>
          </div>
        ):(
          <>
            <div style={{fontSize:13,fontWeight:700,color:"#C8A96E",marginBottom:12,borderBottom:BD,paddingBottom:8}}>
              {sec.title} <span style={{fontSize:10,color:"#3a5468",fontWeight:400}}>· {sec.items.length} voci</span>
            </div>
            {sec.items.length===0&&<div style={{color:"#3a5468",fontSize:11,fontStyle:"italic",marginBottom:10}}>Nessuna voce — aggiungine una ↓</div>}
            {sec.items.map((item,ii)=>(
              <div key={ii} style={{marginBottom:8,background:"#162230",borderRadius:9,border:BD,overflow:"hidden"}}>
                {editItem?.si===selSec&&editItem?.ii===ii?(
                  <div style={{padding:10}}>
                    <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={2} style={{width:"100%",background:"#0f1923",border:"1px solid #C8A96E44",borderRadius:6,padding:"5px 8px",color:"#e8edf2",fontSize:11,outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
                    <input value={editRef} onChange={e=>setEditRef(e.target.value)} placeholder="Rif. normativo…" style={{width:"100%",marginTop:4,background:"#0f1923",border:"1px solid #C8A96E33",borderRadius:6,padding:"4px 8px",color:"#C8A96E",fontSize:10,outline:"none",boxSizing:"border-box"}}/>
                    <div style={{marginTop:7}}>
                      <div style={{fontSize:9,color:"#7a9ab0",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>Risposta default</div>
                      <div style={{display:"flex",gap:5}}>
                        {[["ok","✓ Sì","#22863a"],["ko","✗ No","#cb2431"],["na","N/A","#6a737d"]].map(([val,lbl,col])=>(
                          <button key={val} onClick={()=>setEditDef(editDef===val?null:val)} style={{padding:"3px 10px",borderRadius:20,border:`2px solid ${col}`,background:editDef===val?col:"transparent",color:editDef===val?"white":col,fontWeight:700,fontSize:10,cursor:"pointer"}}>{lbl}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:5,marginTop:8}}>
                      <button onClick={saveEdit} style={{background:"#22863a",color:"white",border:"none",borderRadius:6,padding:"5px 14px",fontWeight:700,fontSize:11,cursor:"pointer"}}>✓ Salva</button>
                      <button onClick={()=>setEditItem(null)} style={{background:"#1a2d3d",color:"#7a9ab0",border:BD,borderRadius:6,padding:"5px 10px",fontSize:11,cursor:"pointer"}}>Annulla</button>
                    </div>
                  </div>
                ):(
                  <div style={{padding:"9px 11px"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:6}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,color:"#c8d8e8",lineHeight:1.5}}>{item.text}</div>
                        <div style={{fontSize:9,color:"#C8A96E",fontStyle:"italic",marginTop:2}}>📌 {item.ref||<span style={{color:"#3a5468"}}>nessun riferimento</span>}</div>
                      </div>
                      <div style={{display:"flex",gap:2,flexShrink:0}}>
                        <button onClick={()=>{setEditItem({si:selSec,ii});setEditText(item.text);setEditRef(item.ref||"");setEditDef(item.defaultAnswer||null);}} style={{background:"#1a2d3d",color:"#7a9ab0",border:BD,borderRadius:5,padding:"3px 7px",fontSize:10,cursor:"pointer"}}>✏️</button>
                        <button onClick={()=>setConfirmDel({msg:"Eliminare questa voce?",action:()=>{upd(n=>n[selDisc].sections[selSec].items.splice(ii,1));setConfirmDel(null);}})} style={{background:"#1a2d3d",color:"#ef5350",border:BD,borderRadius:5,padding:"3px 7px",fontSize:10,cursor:"pointer"}}>🗑</button>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:5,marginTop:6}}>
                      {[["ok","✓ Sì","#22863a"],["ko","✗ No","#cb2431"],["na","N/A","#6a737d"]].map(([val,lbl,col])=>{
                        const isSet=item.defaultAnswer===val;
                        return <button key={val} onClick={()=>upd(n=>{n[selDisc].sections[selSec].items[ii].defaultAnswer=isSet?null:val;})} style={{padding:"2px 9px",borderRadius:20,border:`2px solid ${col}`,background:isSet?col:"transparent",color:isSet?"white":col,fontWeight:700,fontSize:9,cursor:"pointer"}}>{lbl}</button>;
                      })}
                      {!item.defaultAnswer&&<span style={{fontSize:9,color:"#3a5468",alignSelf:"center"}}>nessun default</span>}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div style={{marginTop:12,background:"#0d1f2d",borderRadius:9,border:"1px solid #C8A96E22",padding:12}}>
              <div style={{fontSize:9,color:"#C8A96E",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>+ Nuova voce</div>
              <textarea value={newText} onChange={e=>setNewText(e.target.value)} rows={2} placeholder="Descrizione voce…" style={{width:"100%",background:"#0f1923",border:BD,borderRadius:6,padding:"5px 8px",color:"#e8edf2",fontSize:11,outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
              <input value={newRef} onChange={e=>setNewRef(e.target.value)} placeholder="Rif. normativo…" style={{width:"100%",marginTop:4,background:"#0f1923",border:"1px solid #C8A96E33",borderRadius:6,padding:"4px 8px",color:"#C8A96E",fontSize:10,outline:"none",boxSizing:"border-box"}}/>
              <div style={{marginTop:7}}>
                <div style={{fontSize:9,color:"#7a9ab0",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>Risposta default</div>
                <div style={{display:"flex",gap:5}}>
                  {[["ok","✓ Sì","#22863a"],["ko","✗ No","#cb2431"],["na","N/A","#6a737d"]].map(([val,lbl,col])=>(
                    <button key={val} onClick={()=>setNewDef(newDef===val?null:val)} style={{padding:"2px 9px",borderRadius:20,border:`2px solid ${col}`,background:newDef===val?col:"transparent",color:newDef===val?"white":col,fontWeight:700,fontSize:9,cursor:"pointer"}}>{lbl}</button>
                  ))}
                </div>
              </div>
              <button onClick={addItem} style={{marginTop:8,background:"#C8A96E",color:"#0a1520",border:"none",borderRadius:7,padding:"6px 16px",fontWeight:800,fontSize:12,cursor:"pointer"}}>+ Aggiungi voce</button>
            </div>
          </>
        )}
      </div>

      {confirmDel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#162230",borderRadius:12,border:"1px solid #ef535044",padding:22,maxWidth:320,width:"100%",textAlign:"center"}}>
            <div style={{fontSize:26,marginBottom:8}}>⚠️</div>
            <div style={{color:"#e8edf2",fontWeight:700,marginBottom:14,fontSize:13}}>{confirmDel.msg}</div>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <button onClick={confirmDel.action} style={{background:"#ef5350",color:"white",border:"none",borderRadius:8,padding:"7px 18px",fontWeight:700,cursor:"pointer"}}>Elimina</button>
              <button onClick={()=>setConfirmDel(null)} style={{background:"#1a2d3d",color:"#7a9ab0",border:BD,borderRadius:8,padding:"7px 14px",cursor:"pointer"}}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   APP PRINCIPALE
   ════════════════════════════════════════════════ */
export default function App() {
  const [disciplines, setDisciplines] = useState(() => store.loadNorms() || JSON.parse(JSON.stringify(DEFAULT_DISCIPLINES)));
  const [projects,    setProjects]    = useState(store.loadProjects);
  const [activeId,    setActiveId]    = useState(null);
  const [activeStep,  setActiveStep]  = useState("project");
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => { store.saveProjects(projects); }, [projects]);

  const project = projects.find(p => p.id === activeId) || null;

  const updProj = useCallback(fn => {
    setProjects(prev => prev.map(p => {
      if (p.id !== activeId) return p;
      return { ...fn({ ...p }), updatedAt: new Date().toISOString() };
    }));
  }, [activeId]);

  const createProject = name => {
    const p = mkProject(name);
    setProjects(prev => [...prev, p]);
    setActiveId(p.id);
    setActiveStep("inspector");
  };

  const selectProject = id => {
    setActiveId(id);
    setActiveStep("inspector");
  };

  const renameProject = (id, name) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p));
  };

  const deleteProject = id => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeId === id) { setActiveId(null); setActiveStep("project"); }
  };

  const toggleSection = useCallback((dKey, secTitle, force) => {
    const key = `${dKey}__${secTitle}`;
    setProjects(prev => prev.map(p => {
      if (p.id !== activeId) return p;
      const newVal = force !== undefined ? !!force : !p.activeSections?.[key];
      // Se si sta attivando una sezione, naviga alla checklist
      if (newVal) setActiveStep("checklist");
      return { ...p, updatedAt: new Date().toISOString(), activeSections: { ...p.activeSections, [key]: newVal } };
    }));
  }, [activeId]);

  const selectDisc = useCallback(dk => {
    setProjects(prev => prev.map(p =>
      p.id !== activeId ? p : { ...p, selectedDisc: dk, updatedAt: new Date().toISOString() }
    ));
  }, [activeId]);
  const setStatus  = (key,val) => updProj(p=>({...p,checklist:{...p.checklist,[key]:p.checklist[key]===val?undefined:val}}));
  const setNote    = (key,val) => updProj(p=>({...p,notes:{...p.notes,[key]:val}}));
  const setRemark  = (key,val) => updProj(p=>({...p,remarks:{...(p.remarks||{}),[key]:val}}));

  // Calcola completamento totale per badge sidebar
  const getCompletionBadge = () => {
    if (!project) return null;
    const activeDiscsKeys = Object.keys(disciplines).filter(dk =>
      disciplines[dk]?.sections.some(s => project.activeSections?.[`${dk}__${s.title}`]));
    const total = activeDiscsKeys.flatMap(dk =>
      disciplines[dk].sections.filter(s => project.activeSections[`${dk}__${s.title}`]))
      .reduce((a,s) => a+s.items.length, 0);
    const si = Object.values(project.checklist).filter(v=>v==="ok").length;
    return total ? `${Math.round(si/total*100)}%` : null;
  };

  // Stato completamento step per badge
  const stepStatus = {
    project:    activeId ? "done" : "empty",
    inspector:  project?.inspector ? "done" : activeId ? "pending" : "empty",
    discipline: project?.selectedDisc ? "done" : activeId ? "pending" : "empty",
    norms:      project?.selectedDisc && Object.values(project.activeSections||{}).some(Boolean) ? "done" : activeId ? "pending" : "empty",
    checklist:  "always",
  };

  const stepColor = s => s==="done"?"#22863a":s==="pending"?"#C8A96E":"#3a5468";
  const stepBadge = s => s==="done"?"✓":s==="pending"?"→":null;

  return (
    <div style={{display:"flex",height:"100vh",background:"#0f1923",fontFamily:"'Segoe UI',sans-serif",color:"#e8edf2",overflow:"hidden"}}>

      {/* ══ SIDEBAR NAVIGAZIONE ══ */}
      <div style={{width:220,background:"#0a1520",borderRight:BD,display:"flex",flexDirection:"column",flexShrink:0}}>

        {/* Logo */}
        <div style={{padding:"16px 16px 12px",borderBottom:BD}}>
          <div style={{fontSize:9,letterSpacing:3,color:"#C8A96E",textTransform:"uppercase",marginBottom:2}}>Piattaforma</div>
          <div style={{fontSize:14,fontWeight:800,color:"#e8edf2",lineHeight:1.2}}>Verifiche<br/>Normative</div>
        </div>

        {/* Progetto attivo */}
        {project&&(
          <div style={{padding:"10px 16px",borderBottom:BD,background:"#162230"}}>
            <div style={{fontSize:9,color:"#7a9ab0",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Progetto attivo</div>
            <div style={{fontSize:13,fontWeight:700,color:"#e8edf2",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{project.name}</div>
            {project.inspector&&<div style={{fontSize:11,color:"#7a9ab0",marginTop:1}}>👤 {project.inspector}</div>}
            {getCompletionBadge()&&<div style={{fontSize:11,color:"#C8A96E",fontWeight:700,marginTop:2}}>Completamento: {getCompletionBadge()}</div>}
          </div>
        )}

        {/* Step navigation */}
        <div style={{flex:1,overflowY:"auto",padding:"10px 0"}}>
          {STEPS.map((step,idx)=>{
            const isAct=activeStep===step.id;
            const status=stepStatus[step.id];
            const disabled=step.id!=="project"&&!activeId;
            return (
              <button key={step.id}
                onClick={()=>!disabled&&setActiveStep(step.id)}
                style={{width:"100%",textAlign:"left",padding:"12px 16px",background:isAct?"#1a2d3d":"transparent",border:"none",borderLeft:`3px solid ${isAct?"#C8A96E":"transparent"}`,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.4:1,display:"flex",alignItems:"center",gap:12,transition:"all .15s"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:isAct?"#C8A96E22":status==="done"?"#22863a22":"#162230",border:`2px solid ${isAct?"#C8A96E":stepColor(status)}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:14}}>{stepBadge(status)?<span style={{fontSize:11,fontWeight:800,color:stepColor(status)}}>{stepBadge(status)}</span>:step.icon}</span>
                </div>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:9,color:"#3a5468",fontWeight:600}}>{idx+1}.</span>
                    <span style={{fontSize:13,fontWeight:isAct?700:500,color:isAct?"#e8edf2":"#7a9ab0"}}>{step.label}</span>
                  </div>
                  <div style={{fontSize:10,color:"#3a5468",marginTop:1}}>{step.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottone avanti */}
        {activeStep!=="checklist"&&activeId&&(
          <div style={{padding:"12px 16px",borderTop:BD}}>
            <button onClick={()=>{
              const idx=STEPS.findIndex(s=>s.id===activeStep);
              if(idx<STEPS.length-1)setActiveStep(STEPS[idx+1].id);
            }} style={{width:"100%",background:"linear-gradient(135deg,#C8A96E,#a07040)",border:"none",borderRadius:10,color:"white",fontWeight:800,fontSize:13,padding:"10px",cursor:"pointer"}}>
              Avanti →
            </button>
          </div>
        )}

        {/* Pulsante Libreria Norme */}
        <div style={{padding:"10px 12px",borderTop:BD}}>
          <button onClick={()=>setShowLibrary(true)}
            style={{width:"100%",background:"#162230",border:BD,borderRadius:8,padding:"9px 12px",cursor:"pointer",textAlign:"left",color:"#7EB8C4",fontSize:12,fontWeight:700}}>
            ⚖️ Libreria Norme
          </button>
        </div>
      </div>

      {/* ══ AREA CONTENUTO ══ */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* Header step */}
        <div style={{padding:"14px 24px",borderBottom:BD,background:"linear-gradient(135deg,#0f1923,#162230)",flexShrink:0}}>
          {STEPS.map(s=>s.id===activeStep&&(
            <div key={s.id}>
              <div style={{fontSize:9,color:"#C8A96E",letterSpacing:3,textTransform:"uppercase"}}>
                {STEPS.findIndex(x=>x.id===s.id)+1} di {STEPS.length}
              </div>
              <div style={{fontSize:20,fontWeight:800,color:"#e8edf2"}}>{s.icon} {s.label}</div>
              <div style={{fontSize:12,color:"#7a9ab0",marginTop:2}}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Contenuto step */}
        <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          {activeStep==="project" && (
            <StepProject
              projects={projects} activeId={activeId}
              onSelect={selectProject} onCreate={createProject}
              onDelete={deleteProject} onRename={renameProject}
            />
          )}
          {activeStep==="inspector" && project && (
            <StepInspector project={project} onUpdate={val=>updProj(p=>({...p,inspector:val}))}/>
          )}
          {activeStep==="discipline" && project && (
            <StepDiscipline disciplines={disciplines} project={project} onSelectDisc={selectDisc}/>
          )}
          {activeStep==="norms" && project && (
            <StepNorms disciplines={disciplines} setDisciplines={setDisciplines} project={project} onToggle={toggleSection} onGoChecklist={()=>setActiveStep("checklist")}/>
          )}
          {activeStep==="checklist" && project && (
            <StepChecklist
              project={project} disciplines={disciplines}
              onSetStatus={setStatus} onSetNote={setNote} onSetRemark={setRemark}
            />
          )}
          {(activeStep==="inspector"||activeStep==="discipline"||activeStep==="norms"||activeStep==="checklist")&&!project&&(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:"#3a5468"}}>
              <div style={{fontSize:36}}>📁</div>
              <div style={{fontSize:14,fontWeight:700}}>Seleziona prima un progetto</div>
              <button onClick={()=>setActiveStep("project")} style={{background:"#C8A96E",border:"none",borderRadius:10,color:"#0a1520",fontWeight:800,fontSize:13,padding:"9px 22px",cursor:"pointer",marginTop:4}}>→ Vai a Progetto</button>
            </div>
          )}
        </div>
      </div>

      {/* ── LIBRERIA NORME MODAL ── */}
      {showLibrary&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:5000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#0f1923",borderRadius:16,border:"1px solid #7EB8C444",width:"100%",maxWidth:960,height:"90vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"14px 20px",borderBottom:BD,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <div>
                <div style={{fontSize:10,color:"#7EB8C4",letterSpacing:3,textTransform:"uppercase"}}>Gestione</div>
                <div style={{fontSize:17,fontWeight:800,color:"#e8edf2"}}>⚖️ Libreria Norme</div>
                <div style={{fontSize:11,color:"#7a9ab0",marginTop:2}}>Aggiungi, modifica ed elimina discipline, sezioni e voci normative</div>
              </div>
              <button onClick={()=>setShowLibrary(false)}
                style={{background:"#C8A96E",border:"none",borderRadius:8,color:"#0a1520",fontSize:15,fontWeight:800,padding:"6px 14px",cursor:"pointer"}}>✕ Chiudi</button>
            </div>
            <div style={{flex:1,overflow:"hidden"}}>
              <LibraryEditor disciplines={disciplines} setDisciplines={d=>{setDisciplines(d);store.saveNorms(d);}}/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
