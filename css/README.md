# Sistema de Componentes CSS

Este sistema de componentes CSS está diseñado para ser modular, reutilizable y fácil de personalizar mediante variables CSS.

## Estructura de Archivos

```
css/
├── variables.css          # Variables globales del sistema
├── typography.css         # Sistema de tipografía
├── nav-link.css          # Componente nav-link personalizable
├── button.css            # Componente button personalizable
├── colors-backgrounds.css # Colores y backgrounds
├── articles-sections.css  # Articles y sections
├── responsive.css        # Sistema responsive
├── components.css        # Archivo principal que importa todo
├── style.css            # Archivo principal del proyecto
└── README.md            # Esta documentación
```

## Variables CSS Personalizables

### Variables Globales (`variables.css`)

- **Fuentes**: `--font-base`, `--font-heading`, `--font-mono`
- **Tamaños**: `--font-size-xs` a `--font-size-5xl`
- **Pesos**: `--font-weight-light` a `--font-weight-black`
- **Colores**: Paleta completa inspirada en tránsito urbano
- **Espaciado**: Los estudiantes definen manualmente margin y padding
- **Breakpoints**: `--breakpoint-mobile`, `--breakpoint-tablet`, `--breakpoint-desktop`

### Componente Nav-Link (`nav-link.css`)

Variables personalizables:
```css
.nav-link {
    --nav-link-bg: var(--color-primary);
    --nav-link-color: var(--color-text);
    --nav-link-hover-bg: var(--color-secondary);
    --nav-link-hover-color: var(--color-white);
    --nav-link-padding: 0;
    --nav-link-gap: 0.25em;
    --nav-link-width: 20%;
    --nav-link-aspect-ratio: 1 / 1;
    --nav-link-font-size: var(--font-size-2xl);
    --nav-link-icon-size: 2.5rem;
    /* ... más variables */
}
```

### Componente Button (`button.css`)

Variables personalizables:
```css
.button {
    --button-bg: var(--color-asfalto);
    --button-color: var(--color-text);
    --button-hover-bg: var(--color-taxi-rosa);
    --button-hover-color: var(--color-asfalto);
    --button-padding-x: 1em;
    --button-padding-y: 0.25em;
    --button-min-width: 120px;
    --button-font-size: var(--font-size-lg);
    /* ... más variables */
}
```

## Uso de Componentes

### Nav-Link

```html
<!-- Básico -->
<a href="#" class="nav-link">
    <i class="icon"></i>
    <span class="nav-text">Texto</span>
</a>

<!-- Con variante de color -->
<a href="#" class="nav-link" data-variant="home">
    <i class="icon"></i>
    <span class="nav-text">Inicio</span>
</a>

<!-- Con utilidades -->
<a href="#" class="nav-link compact rounded animate-scale">
    <i class="icon"></i>
    <span class="nav-text">Compacto</span>
</a>
```

### Button

```html
<!-- Básico -->
<button class="button">Botón</button>

<!-- Con variante de color -->
<button class="button button-primary">Primario</button>
<button class="button button-secondary">Secundario</button>

<!-- Con variante de estilo -->
<button class="button button-outline">Outline</button>
<button class="button button-ghost">Ghost</button>

<!-- Con tamaño -->
<button class="button button-sm">Pequeño</button>
<button class="button button-lg">Grande</button>

<!-- Con animación -->
<button class="button button-animate-scale">Con animación</button>
```

### Colores y Backgrounds

```html
<!-- Colores de texto -->
<p class="text-primary">Texto primario</p>
<p class="text-secondary">Texto secundario</p>
<p class="text-metro-naranja">Texto naranja metro</p>

<!-- Backgrounds -->
<div class="bg-primary">Fondo primario</div>
<div class="bg-gradient-primary">Gradiente primario</div>

<!-- Strokes -->
<h1 class="stroke-primary">Título con contorno</h1>
```

### Articles y Sections

```html
<!-- Card básica -->
<div class="card">
    <h3>Título</h3>
    <p>Contenido</p>
</div>

<!-- Hero section -->
<section class="hero">
    <h1>Título principal</h1>
    <p>Descripción</p>
</section>

<!-- Evaluation card -->
<div class="evaluation-card excelente">
    <h4>Excelente</h4>
    <p>Descripción del nivel</p>
</div>
```

## Sistema Responsive

El sistema incluye breakpoints automáticos:

- **Mobile**: 0px - 767px
- **Tablet**: 768px - 1023px  
- **Desktop**: 1024px+
- **Wide**: 1280px+

### Utilidades Responsive

```html
<!-- Mostrar solo en móvil -->
<div class="mobile-only">Solo móvil</div>

<!-- Ocultar en tablet -->
<div class="tablet-hidden">No en tablet</div>

<!-- Grid responsive -->
<div class="grid grid-cols-2 grid-cols-3 grid-cols-4">
    <div>Item 1</div>
    <div>Item 2</div>
    <div>Item 3</div>
</div>
```

## Personalización

### Cambiar colores del tema

```css
:root {
    --color-primary: #tu-color-primario;
    --color-secondary: #tu-color-secundario;
    --color-accent: #tu-color-accent;
}
```

### Personalizar componente nav-link

```css
.nav-link {
    --nav-link-bg: #tu-color-fondo;
    --nav-link-color: #tu-color-texto;
    --nav-link-hover-bg: #tu-color-hover;
    --nav-link-font-size: 1.5rem;
    --nav-link-width: 25%;
}
```

### Personalizar componente button

```css
.button {
    --button-bg: #tu-color-fondo;
    --button-color: #tu-color-texto;
    --button-padding-x: 1.5em;
    --button-padding-y: 0.5em;
    --button-border-radius: 8px;
}
```

## Modo Oscuro

El sistema incluye soporte automático para modo oscuro:

```css
@media (prefers-color-scheme: dark) {
    :root {
        --color-bg: var(--color-asfalto);
        --color-text: var(--color-white);
        /* ... más variables */
    }
}
```

## Accesibilidad

- Soporte para `prefers-reduced-motion`
- Soporte para `prefers-contrast: high`
- Focus visible automático
- Contraste adecuado en todos los colores

## Compatibilidad

- Navegadores modernos (Chrome, Firefox, Safari, Edge)
- Soporte para CSS Grid y Flexbox
- Fallbacks para navegadores antiguos
- Print styles incluidos
