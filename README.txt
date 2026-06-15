APP: Álbum Mundial 2026 - Tracker compartido de figuritas
=========================================================

Qué incluye esta carpeta
------------------------
1. index.html
   La app principal. Esta es la que se publica en GitHub Pages.

2. manifest.webmanifest
   Permite instalar la app como aplicación en celular/PC.

3. sw.js
   Permite que la app cargue más rápido y tenga comportamiento tipo app.

4. icon.svg
   Ícono de la app.

5. google_apps_script_code.gs
   Código que debes pegar en Google Apps Script para conectar la app a una Google Sheet.

6. sample_stickers_import.csv
   Ejemplo de importación de figuritas con columnas code, section, name.


Arquitectura sencilla
---------------------
- GitHub Pages = publica la app.
- Google Sheet = guarda la lista compartida de figuritas.
- Google Apps Script = permite que la app lea/guarde datos en la Google Sheet.

Sin Google Sheet, la app funciona, pero solo guarda datos en el dispositivo donde la usas.
Con Google Sheet, tú y otras personas pueden ver lo mismo. Quien tenga el PIN puede editar.


PARTE A - Subir la app a GitHub Pages
-------------------------------------
1. Entra a https://github.com/
2. Haz clic en el botón + arriba a la derecha.
3. Selecciona New repository.
4. Nombre recomendado:
   mundial-2026-album-tracker
5. Selecciona Public.
6. Haz clic en Create repository.
7. En el repositorio nuevo, haz clic en Add file > Upload files.
8. Sube estos archivos sueltos, NO la carpeta completa:
   - index.html
   - manifest.webmanifest
   - sw.js
   - icon.svg
   - google_apps_script_code.gs
   - sample_stickers_import.csv
   - README.txt
9. Haz clic en Commit changes.
10. Entra a Settings > Pages.
11. En Source selecciona Deploy from a branch.
12. En Branch selecciona main.
13. En carpeta selecciona / root.
14. Haz clic en Save.
15. GitHub te dará una URL parecida a:
   https://TU-USUARIO.github.io/mundial-2026-album-tracker/

Esa es la URL de tu app.


PARTE B - Crear la Google Sheet compartida
------------------------------------------
1. Entra a https://sheets.google.com/
2. Crea una hoja nueva en blanco.
3. Ponle nombre, por ejemplo:
   Album Mundial 2026 Tracker
4. Dentro de la hoja, ve a Extensions > Apps Script.
5. Borra el código que aparece por defecto.
6. Abre el archivo google_apps_script_code.gs de esta carpeta.
7. Copia todo el contenido.
8. Pégalo en Apps Script.
9. Busca esta línea:
   const EDIT_PIN = 'CHANGE_THIS_PIN_2026';
10. Cámbiala por un PIN tuyo, por ejemplo:
   const EDIT_PIN = '1234';
11. Haz clic en Save.


PARTE C - Publicar el Apps Script como Web App
----------------------------------------------
1. En Apps Script, arriba a la derecha, haz clic en Deploy.
2. Selecciona New deployment.
3. En Select type, selecciona Web app.
4. En Description escribe:
   Album Mundial 2026 API
5. En Execute as selecciona:
   Me
6. En Who has access selecciona:
   Anyone
7. Haz clic en Deploy.
8. Google puede pedir permisos.
9. Acepta permisos usando tu cuenta.
10. Si aparece una pantalla de advertencia, entra a Advanced y continúa.
11. Copia la Web App URL. Debe parecerse a:
   https://script.google.com/macros/s/AKfycb.../exec


PARTE D - Conectar la app con la Google Sheet
---------------------------------------------
1. Abre tu app publicada en GitHub Pages.
2. Entra a la pestaña Sync.
3. Pega la Web App URL del Apps Script.
4. Escribe tu PIN de edición.
5. Escribe tu nombre, por ejemplo Juan.
6. Presiona Guardar conexión.
7. Presiona Subir todo a Google Sheet.
8. Después presiona Cargar desde Google Sheet para verificar.

Listo. Ya tienes una base compartida.


PARTE E - Compartir con otras personas
--------------------------------------
En la pestaña Sync, la app te genera un link de solo lectura.
Comparte ese link con tus amigos/familiares.

Para que alguien pueda editar:
- Le compartes el mismo link.
- Le das el PIN por WhatsApp, mensaje o verbalmente.
- Esa persona entra a Sync, pega el PIN y guarda conexión.

Para solo ver:
- No le des el PIN.


PARTE F - Exportar PDF
----------------------
1. Entra a la pestaña PDF.
2. Escoge qué quieres exportar:
   - Lo que me falta
   - Lo que tengo repetido
   - Lo que ya tengo pegado
   - Todo el álbum
3. Presiona Preparar reporte.
4. Presiona Guardar / imprimir PDF.
5. En PC selecciona Microsoft Print to PDF.
6. En celular selecciona Guardar como PDF si tu navegador lo permite.


PARTE G - Importar lista oficial o personalizada
------------------------------------------------
La app trae una lista genérica del 001 al 980.
Si consigues una lista más detallada con equipos/nombres, puedes importarla en CSV.

Formato del CSV:
code,section,name
001,Intro,Logo oficial
ARG01,Argentina,Escudo
ARG02,Argentina,Jugador 1

Columnas requeridas:
- code

Columnas opcionales:
- section
- name

Importante: importar el CSV no borra las pegadas/repetidas si el código ya existe.
Actualiza la sección y el nombre.


Limitaciones importantes
------------------------
1. Esta app no es una base de datos empresarial. Es una solución sencilla para familia/amigos.
2. Si dos personas editan exactamente la misma figurita al mismo tiempo, puede quedar el último cambio guardado.
3. La seguridad es básica: quien tenga el PIN puede editar.
4. La app no incluye nombres oficiales de todas las figuritas porque eso depende de la lista exacta del álbum que tengas. Puedes importarla por CSV.

