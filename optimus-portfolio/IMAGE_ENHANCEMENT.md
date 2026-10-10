# QuadMorph photo enhancement

- Date: October 10, 2026.
- Requested operation: non-destructive upscale and deblocking of the supplied low-resolution robot photo.
- Mode: built-in `image_gen` edit. No CLI/API fallback used.
- Input: the robot photograph supplied in this chat as `codex-clipboard-d2d65909-bca4-4216-b9fc-f7ed8de76c88.png`.
- Saved output: `optimus-portfolio/public/assets/quadmorph/quadmorph-rolling-enhanced.png`.
- The source photo remains unchanged at `optimus-portfolio/public/assets/quadmorph/quadmorph-rolling.png`.
- Visual review: the overall robot pose, four-wheel arrangement and occlusion, outer-ring/three-spoke wheel configuration, body silhouette, gray link arrangement, prominent motors, cable loops, electronics location, workshop floor, and fabric background are substantially retained. The output reconstructs sharper fine details (screws, printed texture, wire braid pattern, electronics markings, spoke highlights, background creases); these cannot be verified from the blurry source. This is an AI-enhanced presentation image, not a new hardware photograph or a reliable source for engineering detail. Label it as enhanced if used publicly; retain the original for documentation.

## Exact prompt

- Use case: precise-object-edit.
  Asset type: engineering portfolio photograph, conservative restoration of an actual research robot.
  Input image 1 is the sole edit target.
  Primary request: Upscale this exact low-resolution photo to a high-resolution image approximately 2560 pixels wide, retaining its current aspect ratio, crop, camera position and scene. Reduce blocky compression artifacts and gently improve clarity without redesigning anything.
  Strict invariants: preserve the EXACT robot silhouette, pose, proportions, every existing wheel and its visible occlusion, all circular black outer rings and orange three-spoke internal structures, gray link shapes, motor housings, screws, cable routing and cable colors, electronics placement, gray fabric backdrop and workshop floor. Maintain every component in precisely the same location and size relative to the original. Preserve the central open space under the robot. Preserve natural lighting and original colors.
  This is a photo restoration, not a new product rendering. Do not add, remove, simplify, reconnect, or invent any hardware detail. Do not make the robot symmetrical. Do not recompose, change background, stylize, add text, labels, watermark, gloss, or extra lighting. When source details are uncertain, preserve their ambiguity instead of hallucinating detail. Geometry fidelity takes absolute priority over sharpness.
