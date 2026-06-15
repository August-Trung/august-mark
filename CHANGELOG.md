# Changelog

All notable changes to the August Mark project will be documented in this file.

## [0.1.0] - 2026-06-16

This is the initial MVP release of **August Mark**, a lightweight offline-first review and annotation tool.

### Added
- **Project & Session Management**: Organize review sessions within distinct project scopes.
- **Screen Capture Engine**: Multi-monitor screen capture (`xcap` crate) targeting the monitor currently containing the mouse cursor.
- **Transparent Annotation Overlay**: A fullscreen transparent overlay displaying the screenshot for annotation.
- **Markup Drawing Tools**:
  - **Marker (1)**: Place sequential numbered circles to flag issue hotspots.
  - **Rectangle (2)**: Frame regions of interest.
  - **Arrow (3)**: Point to specific focus elements.
  - **Text (4)**: Add custom comment bubbles directly onto the screen.
- **Keyboard Shortcuts (Overlay)**: Switch tools using `1`, `2`, `3`, `4` keys. Close forms or dismiss the overlay using `Esc`.
- **Global Capture Triggers**: 
  - Hotkey combination `Ctrl + Shift + M`.
  - Global hardware **Middle Mouse Hold** (hold >= 1 second) to trigger screenshot overlay.
- **Feedback Form Panel**: Sliding sidebar in overlay to enter issue metadata (title, description, severity, category) immediately upon marking.
- **Centered Image Crops**: Automated 400x400 PNG crops centered around markers for clean issue thumbnails (e.g. centering mid-rect, arrowheads, text).
- **Global Toast Alerts & Loading Overlays**: Pinia-backed `uiStore` to manage loading overlays during saves/exports and display notification alerts.
- **Rename & Reopen Sessions**: Option to rename sessions and toggle session status between "completed" (archived) and "active" (reopened).
- **Offline HTML Exporter**: Bundles entire review sessions (including embedded base64 screenshots and crop previews) into a single standalone HTML report for sharing.

### Fixed
- **Canvas Tainting & Missing Text**: Merged background screenshot and drawing canvas client-side to output clean base64 data URLs, preserving annotations in crops and avoiding CORS exceptions.
- **Midnight File Path Rollover**: Derives annotated paths directly from original screenshot paths, preventing folder mismatch errors during midnight rollovers.
- **Orphaned Screenshot Cleanup**: Automatically deletes uncommitted screenshots from disk and database when the overlay is canceled, closed, or when the application restarts.
- **High-DPI Coordinate Alignment**: Scaled logical coordinate points to physical coordinates using monitor scale factor for correct placement on High-DPI screens.
