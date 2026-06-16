VERSION v4 - Corrige cache/service worker y restaura estructura oficial 000/FWC/COL/CC.

APP: Album Mundial 2026 Tracker v3

QUE CAMBIO EN ESTA VERSION
- Ya no usa lista generica 001-980.
- Usa codigos reales/mixtos del album:
  - 000
  - FWC1 a FWC19
  - Equipos con codigo de 3 letras, por ejemplo ARG17, USA5, MEX10
  - Coca-Cola CC1 a CC12 como bonus
- La completicion principal se calcula sobre el album base de 980.
- Coca-Cola aparece como bonus separado, para no dañar el porcentaje base.
- Puedes escribir codigos con espacios: FWC 1, COL 17, ARG 17, CC 1. Tambien puedes buscar 000 o 00.
- Puedes agregar codigos especiales manualmente si aparecen variaciones regionales.

ARCHIVOS
- index.html: la app principal.
- manifest.webmanifest: permite instalarla como app.
- sw.js: cache basico para modo app.
- icon.svg: icono.
- google_apps_script_code.gs: backend para Google Sheets.
- sample_stickers_import.csv: ejemplo pequeno para importar.
- official_stickers_template.csv: plantilla base con 000, FWC1-FWC19, equipos y CC1-CC12.

COMO ACTUALIZAR EN GITHUB PAGES SI YA TIENES LA VERSION ANTERIOR
1. Descomprime este ZIP.
2. Entra a la carpeta wc26_album_tracker.
3. Abre tu repositorio en GitHub.
4. Entra donde estan los archivos index.html, manifest.webmanifest, sw.js, icon.svg, etc.
5. Haz clic en Add file > Upload files.
6. Arrastra TODOS los archivos de esta carpeta.
7. GitHub te va a decir que algunos archivos se reemplazan. Esta bien.
8. Baja y presiona Commit changes.
9. Espera 1 o 2 minutos.
10. Abre de nuevo tu link de GitHub Pages.

IMPORTANTE SOBRE DATOS ANTERIORES
Esta version usa una memoria local nueva para evitar mezclar la lista vieja 001-980 con los codigos reales.
Si ya habias registrado muchas figuritas en la version vieja, exporta CSV/JSON antes y revisa manualmente porque 001 no equivale directamente al codigo real del album.

COMO CONFIGURAR GOOGLE SHEETS
1. Crea una Google Sheet nueva.
2. Ve a Extensions > Apps Script.
3. Borra el codigo que aparece.
4. Pega todo el contenido de google_apps_script_code.gs.
5. Cambia esta linea:
   const EDIT_PIN = 'CHANGE_THIS_PIN_2026';
   Por ejemplo:
   const EDIT_PIN = '1234';
6. Presiona Save.
7. Ve a Deploy > New deployment.
8. Tipo: Web app.
9. Execute as: Me.
10. Who has access: Anyone.
11. Deploy.
12. Copia la URL que termina en /exec.
13. En la app, ve a Sync y pega esa URL.
14. Escribe el PIN si quieres editar.
15. Presiona Guardar conexion.
16. Presiona Subir todo a Google Sheet.

COMO COMPARTIR
- Para solo lectura: comparte el link que aparece en Sync.
- Para que alguien pueda editar: comparte el mismo link y dale el PIN por aparte.

COMO EXPORTAR PDF
1. Ve a PDF.
2. Escoge: faltantes, repetidas, pegadas o todo.
3. Escoge una seccion o todas.
4. Presiona Preparar reporte.
5. Presiona Guardar / imprimir PDF.
6. En Windows usa Microsoft Print to PDF.
7. En iPhone/Android usa la opcion Guardar como PDF si aparece.

CODIGOS QUE RECONOCE
- 000: Panini Logo. Si escribes 00 o 0, la app lo interpreta como 000.
- FWC1-FWC8: intro / especiales del torneo.
- FWC9-FWC19: FIFA World Cup History / FIFA Museum.
- ARG17, USA5, MEX10, etc.: equipo + numero.
- CC1-CC12: Coca-Cola USA bonus.
- Tambien reconoce codigos que empiecen por CC como bonus, por si tienes una variante regional.
