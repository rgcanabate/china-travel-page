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

## Coses a tenir en compte

- **Des de la Xina**: `github.io` s'ha bloquejat de manera intermitent allà. Amb la
  VPN de la eSIM hauria d'anar, però val la pena provar-ho el primer dia i tenir una
  còpia offline al mòbil (desa la pàgina desbloquejada com a PDF) per si de cas.
- **Les fotos** de la galeria apunten a Wikimedia. Si algun dia es trenquen, és que
  han mogut el fitxer allà.
