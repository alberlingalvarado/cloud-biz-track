# Cloud Biz Track

Holis, necesito Quiero convertir esta aplicación en una app web con inicio de sesión y base de datos en la nube. Usa el archivo adjunto como base: mantén exactamente la misma lógica, cálculos, pestañas, textos y diseño. No cambies reglas de negocio.

Cambios que necesito:

1. Inicio de sesión con correo y contraseña. Cada usuario ve solo sus propios datos.

2. Guarda todos los datos (errores, calificados, cierres, cierres perdidos, llamadas entrantes, llamadas realizadas, metas y reglas de comisión) en una base de datos en la nube (usa Supabase), asociados al usuario.

3. Al iniciar sesión, carga los datos de ese usuario. Cada cambio se guarda automáticamente.

4. Quita la función de "Crear/Abrir archivo" y el guardado en el navegador, porque ya no serán necesarios.

5. Mantén los botones de Excel (día, semana y completo), el resumen del día, el respaldo .json y la opción de restaurar desde .json.

6. Agrega la opción de importar un respaldo .json al primer inicio de sesión, para cargar el historial anterior.

Antes de dar por terminado, verifica que el cálculo de comisiones coincida con el ejemplo: un cierre anual de 15 con 10% de descuento da monto final 13,50, y con el acelerador de 1,5% el valor comisionable es 13,70.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cloud-biz-track.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5a507f05-49db-4d4a-bb8e-b53336cf673a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
