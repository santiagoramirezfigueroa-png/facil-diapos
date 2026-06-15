# Manual de Usuario: Cómo usar Fácil Diapos en macOS

Este manual proporciona las instrucciones detalladas para instalar, ejecutar y solucionar advertencias de seguridad al abrir la aplicación de escritorio **Fácil Diapos** en sistemas operativos **macOS (Apple)**.

---

## 1. Descarga e Instalación

Una vez que se compila la versión de macOS (por ejemplo, a través de las descargas en GitHub Actions o compilada directamente en una Mac), obtendrás uno de los siguientes archivos:

### Opción A: Archivo `.dmg` (Instalador estándar)
1. Haz doble clic sobre el archivo descargado (ej: `Fácil Diapos-0.0.0.dmg`).
2. Se abrirá una ventana flotante. **Arrastra y suelta** el icono de **Fácil Diapos** dentro de la carpeta **Aplicaciones** (Applications).
3. Ya puedes expulsar el disco virtual del instalador de tu escritorio.

### Opción B: Archivo `.zip` (Aplicación comprimida)
1. Haz doble clic sobre el archivo `.zip` para descomprimirlo.
2. Extraerá un archivo llamado **Fácil Diapos** (con extensión `.app` oculta).
3. Mueve este archivo a tu carpeta de **Aplicaciones** en el Finder para tenerlo ordenado.

---

## 2. Omisión de Gatekeeper (Advertencia de Seguridad)

> [!IMPORTANT]
> **¿Por qué aparece una advertencia?**
> macOS incluye un sistema de seguridad llamado Gatekeeper que bloquea por defecto cualquier aplicación que no haya sido descargada del Mac App Store o firmada con un certificado de desarrollador de Apple pago. Dado que esta compilación se genera de forma gratuita y local, macOS te mostrará un mensaje indicando que **"Fácil Diapos no se puede abrir porque no proviene de un desarrollador identificado"**.

Para abrir la aplicación por primera vez, sigue cualquiera de estos dos métodos sencillos:

### Método 1: Clic Derecho (El más rápido)
1. Abre tu carpeta de **Aplicaciones** en el Finder (no lo hagas desde el Launchpad).
2. Busca la aplicación **Fácil Diapos**.
3. Mantén pulsada la tecla **Control (Ctrl)** de tu teclado y haz **clic izquierdo** sobre el icono (o haz **clic derecho** con el mouse/trackpad).
4. En el menú contextual que aparece, selecciona **Abrir** (Open).
5. Se abrirá una ventana de advertencia diferente que ahora incluye un botón que dice **"Abrir"**. Haz clic en **Abrir**.
6. ¡Listo! macOS guardará la excepción para siempre y la aplicación se abrirá directamente la próxima vez que hagas doble clic.

### Método 2: Ajustes del Sistema
Si el método anterior no funciona o no te da la opción:
1. Intenta abrir la aplicación con doble clic normal (se cerrará con la advertencia).
2. Ve al menú de Apple (esquina superior izquierda de la pantalla) y selecciona **Ajustes del Sistema** (System Settings).
3. Dirígete a la sección **Privacidad y seguridad** (Privacy & Security) en la barra lateral izquierda.
4. Desplázate hacia abajo hasta encontrar el apartado **Seguridad**.
5. Verás un mensaje que dice: *"Se bloqueó la apertura de Fácil Diapos porque no proviene de un desarrollador identificado"*.
6. Haz clic en el botón **"Abrir de todos modos"** (Open Anyway).
7. macOS te solicitará introducir tu contraseña de usuario o usar Touch ID para confirmar.
8. En el mensaje de confirmación, selecciona **"Abrir"**.

---

## 3. Instrucciones para Desarrolladores en Mac

Si tienes acceso a una computadora Mac y deseas ejecutar el entorno de desarrollo o compilar el instalador nativamente en ella, sigue estos comandos en la **Terminal**:

### Requisitos Previos
Debes tener instalado **Node.js** (versión 18 o superior) y **git** (si clonas desde un repositorio).

### Ejecutar en Desarrollo
1. Abre la **Terminal**.
2. Navega hasta la carpeta del proyecto:
   ```bash
   cd "/ruta/a/tu/proyecto/Crear diapositivas"
   ```
3. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```
4. Inicia la aplicación en modo desarrollo (se abrirá la ventana de escritorio de Electron automáticamente):
   ```bash
   npm run electron:dev
   ```

### Compilar e Instalar Nativamente
Para empaquetar la aplicación localmente en macOS y generar los instaladores `.dmg` y `.zip`:
1. Ejecuta el comando de compilación:
   ```bash
   npm run dist:mac
   ```
2. Una vez finalizado el comando, los archivos de instalación nativos de macOS se guardarán en la carpeta:
   `/release` dentro de tu proyecto.

---

## 4. Alternativa sin Instalación: Uso en Navegadores

Si un usuario de macOS no desea instalar la aplicación de escritorio o no puede saltar las restricciones de Gatekeeper de su equipo de trabajo:
* **Uso Local:** Puede simplemente compilar el código web ejecutando `npm run build` y hacer doble clic sobre el archivo [dist/index.html](file:///j:/Crear%20diapositivas/dist/index.html). Se abrirá instantáneamente en **Safari**, **Google Chrome** o **Firefox** como una pestaña normal, y contará con el 100% de las funcionalidades del editor y las descargas de PowerPoint.
