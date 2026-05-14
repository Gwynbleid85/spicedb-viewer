# Theme Contract

Edit the app theme in [`src/styles.css`](../src/styles.css).

The intended authoring surface is:

- Color families:
  - `--primary-color-{50,100,300,500,700,900}`
  - `--secondary-color-{50,100,300,500,700,900}`
  - `--neutral-color-{50,100,300,500,700,900}`
  - `--success-color-{50,100,300,500,700,900}`
  - `--warning-color-{50,100,300,500,700,900}`
  - `--danger-color-{50,100,300,500,700,900}`
- Typography:
  - `--font-brand-sans`
  - `--font-brand-heading`
  - `--font-brand-mono`
- Shape:
  - `--radius-sm`
  - `--radius-md`
  - `--radius-lg`
  - `--radius-xl`
  - `--radius-2xl`
  - `--radius-3xl`
  - `--radius-4xl`
  - `--radius-5xl`
  - `--radius-6xl`
  - `--radius-7xl`
  - `--radius-control-lg`
- Elevation:
  - `--shadow-brand-sm`
  - `--shadow-brand-md`
  - `--shadow-brand-lg`
  - `--shadow-brand-header`
  - `--shadow-brand-hero`
  - `--shadow-brand-glow`
- Data visualization:
  - `--chart-{1,2,3,4,5,6,7,8,9,10}`

The most commonly reused semantic tokens exported for Tailwind utilities are:

- Text:
  - `text-text-heading`
  - `text-text-caption`
  - `text-text-kicker`
  - `text-text-on-strong`
  - `text-text-on-strong-soft`
  - `text-text-on-strong-muted`
- Surfaces:
  - `bg-surface-panel`
  - `bg-surface-header`
  - `bg-surface-chip`
  - `bg-surface-elevated`
  - `bg-surface-overlay-subtle`
  - `bg-surface-overlay-soft`
  - `bg-surface-overlay-muted`
  - `bg-surface-overlay-footer`
  - `bg-surface-strong`
  - `bg-surface-strong-hover`
  - `bg-surface-link-hover`
- Focus and state:
  - `ring-focus-ring`
  - `ring-danger-ring`

The rest of the variables in that file are app-level semantic tokens derived from those values for surfaces, text, borders, focus, and page atmosphere.

To rebrand quickly:

1. Change the six semantic color families.
2. Change `--font-brand-sans` and `--font-brand-heading` if needed.
3. Change the `--radius-*` tokens.
4. Adjust the dark-mode block with the same token names.

Do not add raw one-off tokens like `--sea-ink` or `--lagoon`. Keep the contract semantic.
