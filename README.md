# Viatge a la Xina · Setembre 2026

Pàgina del viatge: **https://rgcanabate.github.io/china-travel-page/**

Una sola pàgina, sense dependències ni servidor. Es publica sola amb GitHub Pages
a cada `git push` a `main` (triga un minut a refrescar-se).

## Zona privada

La pàgina és pública, però hotels, vols, pressupost i documents viuen en una
**zona xifrada** dins del mateix `index.html`. Sense la contrasenya del grup, al
codi font només hi ha text xifrat: no és un cartell de "no passar", és xifratge
real (AES-256-GCM, clau derivada amb PBKDF2-SHA256 i 300.000 iteracions).

El navegador desxifra en local quan algú escriu la contrasenya, i la recorda en
aquell dispositiu perquè no calgui tornar-la a teclejar. Hi ha un botó per
oblidar-la.

### Editar el contingut privat

```bash
node tools/xina-crypt.mjs decrypt    # recupera private/privat.html (demana contrasenya)
$EDITOR private/privat.html          # edita hotels, vols, pressupost, documents…
node tools/xina-crypt.mjs encrypt    # torna a xifrar dins index.html
git commit -am "Actualitza zona privada" && git push
```

`private/` està al `.gitignore`: el text en clar no surt mai d'aquest ordinador.
Si perds la carpeta, la recuperes amb `decrypt` sempre que recordis la contrasenya.

### Canviar la contrasenya

`decrypt`, i després `encrypt` amb la nova. Compte: les versions xifrades amb la
contrasenya antiga queden a l'historial de git, així que si la vella s'ha filtrat,
canviar-la no esborra el passat — caldria reescriure l'historial.

## Idees i curiositats (llista compartida)

La secció **Idees** és un mur obert: qualsevol de la família escriu una cosa per
veure, menjar o comprar (i pot adjuntar una captura de pantalla) i la resta ho
veu. Sense contrasenya i sense comptes: només el nom que hi posen.

Les idees viuen en una **Realtime Database de Firebase**, que la pàgina llegeix i
escriu per API REST — sense SDK, així que segueix sense dependències. Mentre no
estigui configurada, la secció funciona en local (només al navegador de qui
escriu) i ho avisa amb un cartell.

Ja està connectada al projecte de Firebase `laxina-42a93` (base de dades a
europe-west1) amb les regles de `firebase-regles.json` publicades i verificades.
Els passos de sota són per si algun dia cal tornar-la a muntar o canviar-la de
projecte.

### Posar-la en marxa (un sol cop, ~5 minuts)

1. A [console.firebase.google.com](https://console.firebase.google.com) → **Crear
   un proyecto** (nom: `xina-idees`, pots dir no a Analytics).
2. Dins el projecte: **Build → Realtime Database → Crear base de datos**,
   ubicació **europe-west1 (Bèlgica)**, i tria *empezar en modo bloqueado*.
3. Copia la URL que et dona a dalt, de la forma
   `https://xina-idees-default-rtdb.europe-west1.firebasedatabase.app`.
4. Pestanya **Reglas** → esborra el que hi ha i enganxa el contingut de
   [`firebase-regles.json`](firebase-regles.json) → **Publicar**.
5. A `index.html`, busca `const IDEES_DB` i posa-hi la URL del pas 3.
6. `git commit -am "Connecta la llista d'idees" && git push`.

Al pegar les regles a la consola, fes `Cmd+A` dins l'editor i enganxa a sobre:
si les afegeixes enmig, l'editor tanca claus sol i pot reniuar blocs sencers
sense que el JSON deixi de ser vàlid (ens va passar: `idees` funcionava i els
cors i les captures quedaven denegats). Després de publicar, val la pena provar
d'escriure una idea i un cor de veritat abans de donar-ho per bo.

Pla gratuït (Spark): 1 GB desats i 10 GB/mes de descàrrega. Amb text i captures
reduïdes d'una família no s'hi arriba ni de broma, i no hi ha targeta associada:
si algun dia es passés, deixaria de servir, no cobraria.

### Què fan les regles

- Qualsevol pot **llegir** i **afegir** una idea, però ningú pot **modificar** una
  ja escrita (només crear-la o esborrar-la), i cada camp té un límit de mida.
- El camp de data el posa el **rellotge del servidor**, no el mòbil de cada un.
- Les captures es guarden a `/imatges`, separades de la llista: obrir la pàgina
  només baixa el text, i cada imatge arriba quan la seva targeta apareix a la
  pantalla.
- Al navegador es recorda quines idees has escrit tu, i només aquestes et
  deixen la paperera. És per comoditat, no és una tanca: qui sàpiga la URL de la
  base de dades hi pot esborrar coses. Per a una pàgina familiar va bé; si
  algun dia hi ha soroll, es canvia la URL de la base de dades.

### Captures de pantalla

Es poden adjuntar directament: el navegador les redueix a 1300 px i ~190 kB
abans d'enviar-les, i es veuen a la targeta (clic per obrir-les a pantalla
completa). Si el que hi ha a la captura és text, a l'iPhone es pot **seleccionar
i copiar el text de dins la imatge** i enganxar-lo al camp de detalls: així
queda cercable. No hi ha cap OCR ni cap IA pel mig — ni cal clau de cap API.

## Coses a tenir en compte

- **Des de la Xina**: `github.io` s'ha bloquejat de manera intermitent allà. Amb la
  VPN de la eSIM hauria d'anar, però val la pena provar-ho el primer dia i tenir una
  còpia offline al mòbil (desa la pàgina desbloquejada com a PDF) per si de cas.
- **Les fotos** de la galeria apunten a Wikimedia. Si algun dia es trenquen, és que
  han mogut el fitxer allà.
- **Firebase des de la Xina**: és de Google, o sigui que allà cal la VPN de l'eSIM
  engegada per apuntar o veure idees noves. Si no connecta, la pàgina ho diu clar.
