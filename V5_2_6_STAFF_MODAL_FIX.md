# V5.2.6 — Staff profile modal fix

Fixes the expanded staff profile in Operations → Personalregister.

- Replaces translucent `--card` / `--surface` modal backgrounds with a solid theme-aware admin surface.
- Adds a proper dimmed + blurred viewport backdrop so cards behind the modal no longer bleed through.
- Gives the profile dialog a stronger border/shadow and keeps header, content and footer opaque.
- Makes the avatar lightbox use an intentionally dark opaque backdrop.
- Improves section/inset contrast while keeping the existing monochrome Operations design.

No database migration is required.
