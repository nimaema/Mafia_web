---
name: Persian Mafia Management System
colors:
  surface: '#fdf7ff'
  surface-dim: '#ded8e0'
  surface-bright: '#fdf7ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f2fa'
  surface-container: '#f2ecf4'
  surface-container-high: '#ece6ee'
  surface-container-highest: '#e6e0e9'
  on-surface: '#1d1b20'
  on-surface-variant: '#494551'
  inverse-surface: '#322f35'
  inverse-on-surface: '#f5eff7'
  outline: '#7a7582'
  outline-variant: '#cbc4d2'
  surface-tint: '#6750a4'
  primary: '#4f378a'
  on-primary: '#ffffff'
  primary-container: '#6750a4'
  on-primary-container: '#e0d2ff'
  inverse-primary: '#cfbcff'
  secondary: '#63597c'
  on-secondary: '#ffffff'
  secondary-container: '#e1d4fd'
  on-secondary-container: '#645a7d'
  tertiary: '#765b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9a74d'
  on-tertiary-container: '#503d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#cfbcff'
  on-primary-fixed: '#22005d'
  on-primary-fixed-variant: '#4f378a'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#cdc0e9'
  on-secondary-fixed: '#1f1635'
  on-secondary-fixed-variant: '#4b4263'
  tertiary-fixed: '#ffdf93'
  tertiary-fixed-dim: '#e7c365'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#fdf7ff'
  on-background: '#1d1b20'
  surface-variant: '#e6e0e9'
typography:
  display:
    fontSize: 2.25rem
    fontWeight: '800'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  h1:
    fontSize: 1.875rem
    fontWeight: '700'
    lineHeight: 2.25rem
  h2:
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
  body-lg:
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-caps:
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  container-padding: 1.5rem
  gutter: 1rem
  section-gap: 2rem
  stack-gap: 0.75rem
---

## Brand & Style

This design system is built for the high-stakes, analytical environment of Mafia game management. The aesthetic is **Sleek Minimalism**, prioritizing clarity, rapid information processing, and a professional "game master" atmosphere. 

The UI evokes a sense of calculated control. By utilizing heavy whitespace and a restricted color palette, the system ensures that the complex logic of player roles, voting tallies, and game phases remains the primary focus. The transition between light and dark modes reflects the thematic shift between the "Day" and "Night" phases of the game, using distinct levels of lime green to maintain high visibility and energy across both states.

## Colors

The palette is anchored by high-utility neutrals and a singular, vibrant accent. 

- **Light Theme (Day Phase):** Uses a crisp `bg-gray-50` background to provide a soft canvas. Cards are solid white to pop against the subtle grey. The primary lime green is used at a slightly higher contrast (`text-lime-600`) for text and `bg-lime-500` for interactive surfaces to ensure legibility against light backgrounds.
- **Dark Theme (Night Phase):** Deep `bg-zinc-950` provides a near-black foundation, with cards elevated to `bg-zinc-900`. The accent shifts to a more luminous `lime-400` to pierce through the darkness, signifying active states and critical game actions.

## Typography

This design system exclusively employs **Vazirmatn**, a typeface optimized for Persian script legibility and modern digital interfaces. 

The typographic hierarchy is structured to support Right-to-Left (RTL) reading patterns. Bold weights are reserved for player names and role titles, while medium weights handle the technical game metadata. Line heights are slightly increased compared to Latin standards to accommodate the taller ascenders and descenders of the Persian script, ensuring text-heavy logs remain readable during intense sessions.

## Layout & Spacing

The system follows a 12-column fluid grid that adapts to tablet and desktop views, crucial for the "Moderator Dashboard." 

Spacing is governed by an 8px (0.5rem) rhythm. In the RTL layout, the sidebar or primary navigation sits on the right, with content flowing to the left. Cards use a consistent `p-6` (1.5rem) internal padding to maintain a spacious, uncluttered look. Elements within a card—such as player lists or action buttons—utilize a tighter `gap-3` (0.75rem) to signify structural relationships.

## Elevation & Depth

Depth is conveyed through **Tonal Layers** rather than heavy shadows, preserving the minimalist ethos.

- **Level 0 (Background):** `bg-gray-50` (Light) or `bg-zinc-950` (Dark).
- **Level 1 (Cards):** Solid white or `bg-zinc-900`. These carry a very subtle, diffused shadow: `shadow-sm` with a low-opacity neutral tint to ground the element.
- **Level 2 (Modals/Popovers):** Higher elevation using `shadow-xl` with a 10% opacity black tint, ensuring these elements float clearly above the game board.
- **Interactive States:** Buttons use a slight vertical translation (1px lift) on hover rather than an increase in shadow depth, reinforcing the tactile but digital nature of the system.

## Shapes

The design system utilizes **rounded-2xl** corners (1rem to 1.5rem) as its signature geometric trait. This soft rounding counteracts the "aggressive" nature of the Mafia game theme, making the management experience feel more fluid and less industrial.

Buttons and input fields use a slightly tighter radius (`rounded-xl`) to maintain a distinct "active component" feel, while player profile containers and game logs utilize the full `rounded-2xl` curvature.

## Components

### Buttons
Primary buttons use the Lime Green accent. In light mode, they feature `bg-lime-500` with white text. In dark mode, they use `bg-lime-400` with `text-zinc-950` for maximum punch. They are always `rounded-xl` with a medium font weight.

### Player Cards
The central component of the system. These are `rounded-2xl` containers with a subtle `border-zinc-100` (light) or `border-zinc-800` (dark). They include a status indicator (Alive/Dead) in the top-left (RTL-aware) and an action menu in the top-right.

### Action Chips
Used for game roles (e.g., "Doctor", "Godfather"). These are pill-shaped with low-opacity background tints of the primary color, keeping them identifiable without competing with main buttons.

### Game Log
A vertical list component using alternating tonal backgrounds (zebra striping) for readability. Each entry is separated by a 1px hairline border.

### Logic Toggles
Switch components utilize the Lime Green accent for the 'on' state. The physical track of the switch is `bg-zinc-200` in light mode and `bg-zinc-800` in dark mode, maintaining a low-profile aesthetic.
