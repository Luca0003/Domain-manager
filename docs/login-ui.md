# Login UI

La Login desktop è composta da tre aree reali:

- rail laterale con branding e navigazione illustrativa;
- hero centrale con mini dashboard, grafico, orbite e badge TLD costruiti in HTML/CSS/SVG;
- card di autenticazione con input e controlli reali.

Non è presente alcun artwork raster usato come sfondo della Login.

## v48 — Crisp adaptive fullscreen

La Login continua a riempire la viewport senza deformare i componenti, ma non applica più `transform: scale(...)` all'intera scena.

Il ridimensionamento desktop usa `zoom` di layout con un unico fattore uniforme. In questo modo Chromium esegue il layout e il rendering dei caratteri alla dimensione finale invece di ridimensionare una superficie già rasterizzata dal compositor. Testi, SVG e bordi risultano quindi più nitidi soprattutto sui viewport che richiedono fattori frazionari.

Per preservare l'aspetto futuristico senza sfocare il contenuto:

- la mini-dashboard non viene più ruotata come contenitore; ruota soltanto il suo pannello decorativo di sfondo;
- i badge `.Com` e `.net` mantengono il testo non trasformato e ruotano solo il fondale;
- SVG e tracciati usano `shape-rendering: geometricPrecision`;
- la pagina non usa immagini raster per logo, dashboard o decorazioni della Login.

Sotto i 901 px resta attivo il layout mobile dedicato, senza zoom.
