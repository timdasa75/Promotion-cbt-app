export function setToolbarIcon(target, svgMarkup) {
  if (!target) return;
  target.innerHTML = svgMarkup;
}
