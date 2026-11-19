# Patagonia 2027

Plan del viaje: 27/12/2026 → 10/01/2027. Itinerario día por día, mapa, casas, autos, gastos y pesca.

Sitio estático, sin build: Vercel publica `main` tal cual.

- **Cambiar el plan:** editar `js/datos.js` (es el único archivo con datos del viaje).
- **Publicar un cambio:** subir `VERSION` en `sw.js` (así los celulares reemplazan la copia guardada) y hacer commit.
- **Probar en la PC sin instalar nada (Windows):** `powershell -ExecutionPolicy Bypass -File tools\servidor.ps1` y abrir http://localhost:8080/
- Contexto, estructura y reglas: `CLAUDE.md`. Versiones guardadas: `CHECKPOINTS.md`.
