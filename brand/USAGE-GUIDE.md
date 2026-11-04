# Net GUI — Logo usage guide

**Idea:** A network port punched into an app tile, lit from inside like a port's link light.
The tile is the app; the light means it's connected.

## Colours
| Name | HEX | RGB | Use |
|---|---|---|---|
| Rack | #0E1420 | 14 20 32 | App tile, wordmark on light, dark UI |
| Link Mint | #2EE6A6 | 46 230 166 | Port light, primary accent, buttons |
| Paper | #F4F6F9 | 244 246 249 | Light backgrounds |
| Night (dark bg) | #070A12 | 7 10 18 | Behind the glow icon and dark lockup |

## Files
- `netgui-symbol.svg`: master symbol (flat: Rack tile + Mint port)
- `netgui-symbol-cutout.svg`: one-colour master (the port is a real hole)
- `netgui-horizontal.svg`, `netgui-horizontal-dark.svg`, `netgui-stacked.svg`: lockups
- `netgui-app-icon-glow.svg`: the glowing app icon (the **only** place gradients and glow are used)
- `variants/`: black, white, Rack and Mint one-colour versions, square avatar
- `png/`: symbol and glow icon at 1024 px, lockup PNGs
- `web/`: favicon.ico (16/32/48), favicon.svg, favicon PNGs, apple-touch-icon, icon-192/512, site.webmanifest, head-snippet.html

## Rules
- **Clear space:** keep space equal to the port tab's width (about 1/6 of the tile) around the logo.
- **Minimum size:** symbol 16 px; horizontal lockup 100 px wide.
- **Glow:** use it only on dark backgrounds (app icon, dock, splash, hero). Everywhere else, use the flat master.
- **Don't:** recolour the port, rotate or stretch the tile, add shadows or outlines to the flat logo, or retype "Net GUI" in a font. The wordmark is custom-drawn.

## Notes
- The wordmark is built from rounded strokes, so no font licence is needed.
- Get a professional trademark search before you register the mark.
