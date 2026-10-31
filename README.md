# GimnasioMike 🔥
**Tu entrenador personal.** Te organiza la semana, te calienta, te registra cada serie y te mete caña.

> Boceto v0.1: una web app sin dependencias. Abre `index.html` en el navegador y listo.

## Cómo usarla
- **En el ordenador:** doble clic en `index.html`.
- **En el móvil (recomendado para el gimnasio):** sirve la carpeta (por ejemplo `python3 -m http.server 8000`) y abre `http://<ip-del-ordenador>:8000` desde el móvil. Con "Añadir a pantalla de inicio" se instala como app.
- ¿Quieres ver cómo quedan las gráficas sin haber entrenado? **Ajustes → Datos de ejemplo**.

## Qué hace
| Pantalla | Funciones |
|---|---|
| **Hoy** | Mensaje del coach según tu constancia (te riñe si llevas 3 días o más sin entrenar), semana en curso, racha de semanas, próximo entrenamiento de la rotación. |
| **Sesión** | Calentamiento general + **específico por grupo muscular del día** + series de aproximación calculadas con tu peso de trabajo. Registro de kg/reps por serie con la marca anterior al lado, **sugerencia de sobrecarga progresiva**, temporizador de descanso con sonido y vibración, y frases del coach en cada serie. |
| **Plan** | Eliges **3, 4 o 5 días** y la app monta el programa: Superior / Inferior / Full body (3), Torso / Pierna ×2 (4), o Empuje / Tirón / Pierna + Full body / Pierna (5). Gráfica de **equilibrio semanal** (series por grupo frente al rango recomendado). Puedes editar series y repeticiones, cambiar, añadir, quitar y reordenar ejercicios. |
| **Progreso** | 1RM estimado por ejercicio (Epley), volumen semanal, equilibrio real de los últimos 7 días y un mapa de constancia de 20 semanas. Cada gráfica tiene su tabla de datos. |
| **Historial** | Todas tus sesiones con detalle de series, récords (PR) y notas. |
| **Ajustes** | Nombre, peso, **nivel de caña** (Motivador / Duro / Sin piedad), sonido, exportar e importar una copia en JSON, y borrar los datos. |

## Estructura
```
index.html        Contenedor de la app
css/styles.css    Estilos (modo oscuro, pensado primero para el móvil)
js/data.js        Ejercicios, grupos, calentamientos, plantillas y programas  ← edítalo para personalizar
js/store.js       Persistencia (localStorage) y analítica: PRs, sugerencias, balance
js/coach.js       Frases del coach por momento y nivel de intensidad
js/charts.js      Gráficas en canvas (sin librerías)
js/app.js         Vistas y eventos
```

## Ideas para la siguiente iteración
- Service worker para usarla sin conexión, y empaquetarla como app nativa (Capacitor).
- Sincronización en la nube o entre dispositivos.
- Periodización (semanas de descarga automáticas) y RPE/RIR por serie.
- Vídeos o GIFs de técnica por ejercicio.
- Medidas corporales y fotos de progreso.
