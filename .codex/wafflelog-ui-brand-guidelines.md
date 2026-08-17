# Wafflelog UI brand guidelines

## Direction

Wafflelog is a practical trip-planning utility. The interface should feel warm,
organised and collaborative without presenting itself as a social network or an
AI-first product.

The visual metaphor is a waffle with colourful condiments:

- Golden yellow is the recognisable Wafflelog brand colour.
- Cream is the quieter extension of yellow used for the welcoming auth canvas.
- White creates clear, readable content surfaces.
- Charcoal and gray carry most text and controls.
- Vibrant colours are contextual accents, not competing primary brands.

## Palette roles

| Role | Colour | Usage |
| --- | --- | --- |
| Brand and primary action | Golden yellow `#FFB300` | Primary buttons, FABs and active selections |
| App canvas | White `#FFFFFF` | Authenticated screens, navigation headers and drawers |
| Auth canvas | Waffle cream `#FFF9E8` | Login and registration backgrounds |
| Surface | White `#FFFFFF` | Cards, dialogs, inputs and focused content areas |
| Primary text | Charcoal `#323232` | Headings, body text and content on yellow |
| Secondary text | Gray `#646464` | Supporting copy, metadata and inactive controls |
| Planning accent | Purple `#52489C` | Inspiration, planning, notes and selected contextual tools |
| Activity accent | Turquoise `#2AB7CA` | Notifications, invitations and live/activity states |
| Destructive state | Red `#FE4A49` | Delete actions and errors |
| Additional accents | Orange, blue and pine green | Categories and feature-specific meaning |

The semantic roles live in `constants/theme.ts`. Components should prefer these
roles over repeating raw colours when styling common canvas, surface, text,
divider or primary-action states.

## Application rules

1. Use white for authenticated app screens, navigation and content surfaces.
   Reserve cream for the login and registration experience.
2. Use golden yellow for the default primary action. Put charcoal text and icons
   on yellow; white does not provide enough contrast.
3. Use purple, turquoise and the remaining condiment colours only when the
   colour communicates a feature or state. They should not replace yellow as the
   app-wide call-to-action colour.
4. Use charcoal for primary text and gray for supporting text. Avoid colouring
   normal headings solely for decoration.
5. Use a subtle yellow divider where branded navigation meets content. Use a
   neutral divider inside cards and forms.
6. Keep destructive actions red and visually separate from the primary action.
7. Preserve travel photography as immersive content. Text over photography must
   retain a strong overlay or shadow so it remains readable.

## Protected visual areas

- The homepage travel photograph remains the hero and may become a rotating set
  of holiday images later.
- The AI trip planner keeps its approved internal visual language. Purple remains
  appropriate there because it identifies planning and inspiration.
- Maps, photographs and embedded web pages keep their content-specific canvases.
- Contextual category colours remain intact when they communicate useful meaning.

## Review checklist

Before merging a new screen or component, check that:

- the outer canvas, surface and action colours use semantic roles;
- yellow controls use charcoal content;
- accent colour has a clear contextual purpose;
- destructive actions remain distinct;
- photography and rich content retain their intended content-specific canvas;
- text and controls remain readable in loading, disabled and selected states.
