# Planificación Semanal de Contenedores

Sistema web para que los supervisores registren y hagan seguimiento de los contenedores planificados e inspeccionados por finca, semana a semana.

---

## Estructura del proyecto

```
planificacion-banano/
├── server.js          ← Servidor Node.js/Express
├── package.json       ← Dependencias
├── data/              ← Datos guardados (JSON, generado automáticamente)
│   ├── config.json    ← Exportadoras y fincas
│   └── semanas.json   ← Datos semanales
└── public/
    └── index.html     ← App completa (frontend)
```

---

## Despliegue en Railway

### 1. Sube el código a GitHub
```bash
git init
git add .
git commit -m "primera version"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/planificacion-banano.git
git push -u origin main
```

### 2. Crea el proyecto en Railway
1. Ve a [railway.app](https://railway.app) e inicia sesión
2. Clic en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Elige tu repositorio `planificacion-banano`
5. Railway detecta Node.js automáticamente y despliega

### 3. (Importante) Agrega un volumen para persistir los datos
Por defecto, los datos en `data/` se pierden cuando Railway reinicia el servicio. Para que sean permanentes:

1. En tu proyecto Railway → pestaña **"Volumes"**
2. Clic en **"Add Volume"**
3. Mount Path: `/app/data`
4. Guarda y redeploya

### 4. Obtén tu URL
Railway genera una URL tipo `https://planificacion-banano-production.up.railway.app`. Compártela con los supervisores.

---

## Correr localmente (para pruebas)

```bash
# Instalar dependencias
npm install

# Iniciar servidor
npm start

# Abrir en el navegador
http://localhost:3000
```

---

## Funcionalidades

- **Semanas**: Crea semanas nuevas, ingresa contenedores planificados e inspeccionados por finca/día, registra motivos cuando no se inspeccionó
- **Fincas**: Administra el catálogo de exportadoras y fincas (agregar, eliminar)
- **Resumen**: Vista histórica acumulada de todas las semanas con totales y porcentajes

---

## Notas técnicas

- Los datos se guardan en archivos JSON en la carpeta `data/`
- El frontend es React (cargado desde CDN), sin proceso de build necesario
- Sin base de datos externa — todo en el servidor con archivos JSON
- Puerto configurado por variable de entorno `PORT` (Railway lo asigna automáticamente)
