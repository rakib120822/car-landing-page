# Velocity Motors

Landing page for an online car shop, with a 3D animated hero, scroll animations, a navbar and a footer. It is plain HTML, CSS and JavaScript with no build step.

## Run it

The 3D model is loaded over HTTP, so opening `index.html` directly from disk won't work. Serve the folder instead:

```bash
python3 -m http.server 8000
# or
npx serve .
```

Then open http://localhost:8000.

## Project structure

```
index.html                  Page markup and import map
css/style.css               Design tokens, layout, responsive styles
js/hero3d.js                Three.js hero scene (ES module)
js/animations.js            Navbar, filters, counters and GSAP scroll effects
assets/models/ferrari.glb   Car model (Three.js example model, MIT license)
```

## Features

- **3D hero:** a glTF car with an intro drive-in, spinning wheels, slow auto-rotation, mouse parallax, and a camera that orbits and pulls back as you scroll. It pauses when offscreen and falls back to a static photo if WebGL is unavailable.
- **Scroll animations:** fade/slide reveals (`data-animate="fade-up|fade-left|fade-right|zoom"`), animated stat counters, a pinned three-panel showcase, a self-drawing timeline, a brand marquee and a parallax call-to-action background.
- **Navbar:** transparent over the hero, solid after scrolling, hides on scroll down and shows on scroll up, with a slide-in menu on mobile.
- **Inventory:** six car cards with filters (All, SUV, Sedan, Sports, EV).
- **Footer:** link columns, social icons and contact details.
- **Accessibility:** skip link, semantic landmarks, visible focus styles, and `prefers-reduced-motion` support that shows all content immediately.

## Libraries (loaded from CDN)

- [Three.js](https://threejs.org/) 0.160.0, including GLTFLoader, DRACOLoader and RoomEnvironment
- [GSAP](https://gsap.com/) 3.12.5 with ScrollTrigger, with SRI hashes in `index.html`
- Google Fonts: Orbitron and Inter

## Customizing

- **Colors and spacing:** edit the CSS custom properties at the top of `css/style.css`.
- **Car color:** change `ACCENT` in `js/hero3d.js`.
- **Cars and prices:** edit the `.car-card` articles in `index.html`. Set `data-type` to `suv`, `sedan`, `sports` or `ev` so the filters work.
- **Animations:** add `data-animate="..."` to any element to reveal it on scroll.

## Before going live

- Car photos are hotlinked from Unsplash, and some don't match their listing. Replace them with your own images.
- The brand name, prices, reviews and contact details are placeholders.
- The search, newsletter and "View" buttons don't send or open anything yet. Connect them to a backend or inventory pages.
- The Ferrari model is a Three.js example asset. Swap in a model you have rights to for production, and update the mesh names in `js/hero3d.js` if the new model names its parts differently.
