# GimnasioMike 🔥
**Tu entrenador personal.** Te organiza la semana, te calienta, te registra cada serie y te mete caña.

> v0.3: app web instalable (PWA) que **funciona sin conexión**, con **animaciones de técnica** para cada ejercicio y calentamiento, y **temas** a elegir. Sin dependencias ni compilación.

## 📱 Instalarla en el móvil

### 1. Publicarla gratis con GitHub Pages (una sola vez)
Para instalar la app y usarla sin conexión hace falta HTTPS, y GitHub Pages lo da gratis.
1. En GitHub: **Settings → Pages**.
2. En *Build and deployment*: **Source = Deploy from a branch**, **Branch = `main`**, carpeta **`/ (root)`** y **Save**.
3. En 1-2 minutos estará en **https://bodelao.github.io/GimnasioMike/**

### 2. Instalarla
- **Android (Chrome):** abre la dirección y pulsa **Instalar** en la tarjeta de la pantalla *Hoy* o en *Ajustes*. Si no aparece, usa el menú ⋮ → *Instalar aplicación*.
- **iPhone (Safari):** botón **Compartir** ⬆︎ → **Añadir a pantalla de inicio**.

Desde ese momento se abre a pantalla completa desde su icono y **funciona sin cobertura**: rutinas, registro de series, gráficas e historial.

### Cómo funciona sin conexión
- `sw.js` (service worker) guarda la app entera en el móvil la primera vez que la abres con conexión.
- Tus entrenamientos se guardan en el propio móvil (`localStorage`) y se pide al navegador almacenamiento persistente para que no los borre.
- Durante el entrenamiento **la pantalla no se apaga** (Wake Lock).
- Cuando publiques cambios, la app muestra **"Nueva versión disponible → Actualizar"**.

> ⚠️ **Al cambiar cualquier archivo, sube `VERSION` en `sw.js`** (por ejemplo `gm-v0.3.1`). Si no, los móviles seguirán usando la versión guardada.

### Probar en local
```bash
python3 -m http.server 8000   # y abre http://localhost:8000
```
(Abrir `index.html` con doble clic funciona, pero sin modo offline ni instalación).

¿Quieres ver las gráficas sin haber entrenado? **Ajustes → Datos de ejemplo**.

## Qué hace
| Pantalla | Funciones |
|---|---|
| **Hoy** | Mensaje del coach según tu constancia (te riñe si llevas 3 días o más sin entrenar), semana en curso, racha de semanas, próximo entrenamiento de la rotación. |
| **Sesión** | Calentamiento general + **específico por grupo muscular del día** + series de aproximación calculadas con tu peso de trabajo. Registro de kg/reps por serie con la marca anterior al lado, **sugerencia de sobrecarga progresiva**, temporizador de descanso con sonido y vibración, y frases del coach en cada serie. |
| **Plan** | Eliges **3, 4 o 5 días** y la app monta el programa: Superior / Inferior / Full body (3), Torso / Pierna ×2 (4), o Empuje / Tirón / Pierna + Full body / Pierna (5). Gráfica de **equilibrio semanal** (series por grupo frente al rango recomendado). Puedes editar series y repeticiones, cambiar, añadir, quitar y reordenar ejercicios. |
| **Progreso** | 1RM estimado por ejercicio (Epley), volumen semanal, equilibrio real de los últimos 7 días y un mapa de constancia de 20 semanas. Cada gráfica tiene su tabla de datos. |
| **Historial** | Todas tus sesiones con detalle de series, récords (PR) y notas. |
| **Técnica** | Cada ejercicio y cada ejercicio de calentamiento tiene una **animación** que muestra el movimiento y resalta el músculo que trabaja. Pulsa la animación para verla en grande. El botón **Ver vídeo** busca vídeos de técnica en YouTube (necesita conexión). |
| **Ajustes** | **Tema** (oscuro, claro o automático + 6 colores de acento), nombre, peso, **nivel de caña** (Motivador / Duro / Sin piedad), sonido, exportar e importar una copia en JSON, borrar los datos, instalar la app y ver su estado (instalada, lista sin conexión, datos protegidos). |

## Estructura
```
index.html        Contenedor de la app
manifest.json     Nombre, iconos y colores de la app instalada
sw.js             Service worker: caché offline y actualizaciones
icons/            Iconos PNG (Android, iOS, maskable)
css/styles.css    Estilos (modo oscuro, pensado primero para el móvil)
js/data.js        Ejercicios, grupos, calentamientos, plantillas y programas  ← edítalo para personalizar
js/store.js       Persistencia (localStorage) y analítica: PRs, sugerencias, balance
js/coach.js       Frases del coach por momento y nivel de intensidad
js/charts.js      Gráficas en canvas (sin librerías), con los colores del tema
js/anim.js        Animaciones de técnica: figura articulada en SVG y poses de cada ejercicio
js/theme.js       Temas: modo oscuro/claro/automático y color de acento
js/pwa.js         Instalación, actualizaciones, pantalla encendida, almacenamiento persistente
js/app.js         Vistas y eventos
```

## Ideas para la siguiente iteración
- Empaquetarla como app nativa para las tiendas (Capacitor / TWA) y avisos de fin de descanso con la pantalla bloqueada.
- Sincronización en la nube o entre dispositivos.
- Periodización (semanas de descarga automáticas) y RPE/RIR por serie.
- Vídeos propios grabados en el gimnasio para los ejercicios clave.
- Medidas corporales y fotos de progreso.
