/* eslint-env browser */
const form = document.getElementById("configForm");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let uploadedImage = null;

// Dynamic scaling based on frame size
function calculateScale(frameWidth, frameHeight) {
  const BASE_SCALE = 38;
  const MAX_WIDTH = 1600;
  const MAX_HEIGHT = 800;
  const thickness = parseFloat(document.getElementById("frameThickness").value) || 0.75;
  const totalWidth = frameWidth + thickness * 2;
  const totalHeight = frameHeight + thickness * 2;

  if (frameWidth > 9 || frameHeight > 12) {
    const scaleByWidth = (MAX_WIDTH - 80) / totalWidth;
    const scaleByHeight = (MAX_HEIGHT - 80) / totalHeight;
    return Math.min(BASE_SCALE, scaleByWidth, scaleByHeight);
  }

  return BASE_SCALE;
}

// Frame size presets
const frameSizePreset = document.getElementById('frameSizePreset');
frameSizePreset.addEventListener('change', () => {
  const [width, height] = frameSizePreset.value.split('x').map(Number);
  if (width && height) {
    document.getElementById('frameWidth').value = width;
    document.getElementById('frameHeight').value = height;
    applyAutoOrientationToFrame();
    updateMatSizeToFit();
    renderCanvas();
  }
});

// Show/hide frame custom inputs
function updateFrameCustomVisibility() {
  const frameCustom = document.getElementById('frameCustomInputs');
  frameCustom.style.display = frameSizePreset.value === '' ? 'block' : 'none';
}
frameSizePreset.addEventListener('change', updateFrameCustomVisibility);

// Mat border presets
const matBorderPreset = document.getElementById('matBorderPreset');
matBorderPreset.addEventListener('change', () => {
  if (!matBorderPreset.value) return;

  const border = parseFloat(matBorderPreset.value);
  const frameWidth = parseFloat(document.getElementById('frameWidth').value);
  const frameHeight = parseFloat(document.getElementById('frameHeight').value);
  const smallestDim = Math.min(frameWidth, frameHeight);
  let effectiveBorder = border;

  if (smallestDim <= 6) effectiveBorder = Math.max(0.5, border * 0.5);
  else if (smallestDim <= 12) effectiveBorder = Math.max(0.75, border * 0.75);

  effectiveBorder = Math.min(effectiveBorder, smallestDim / 2 - 0.125);

  document.getElementById('matWidth').value = Math.max(0, frameWidth - effectiveBorder * 2);
  document.getElementById('matHeight').value = Math.max(0, frameHeight - effectiveBorder * 2);

  renderCanvas();
});

// Show/hide mat custom inputs
function updateMatCustomVisibility() {
  const matCustom = document.getElementById('matCustomInputs');
  matCustom.style.display = matBorderPreset.value === '' ? 'block' : 'none';
}
matBorderPreset.addEventListener('change', updateMatCustomVisibility);

// Show/hide mat inputs
const showMatCheckbox = document.getElementById('showMat');
const matOptionsContainer = document.getElementById('matOptions'); // wrap all mat inputs in this div

function updateMatOptionsVisibility() {
  if (showMatCheckbox.checked) {
    matOptionsContainer.style.display = 'block';
  } else {
    matOptionsContainer.style.display = 'none';
  }
  renderCanvas();
}

// Run on page load
updateMatOptionsVisibility();

// Add listener
showMatCheckbox.addEventListener('change', updateMatOptionsVisibility);

// Update mat size to fit within frame
function updateMatSizeToFit() {
  const frameWidth = parseFloat(document.getElementById('frameWidth').value);
  const frameHeight = parseFloat(document.getElementById('frameHeight').value);

  if (matBorderPreset.value) {
    const border = parseFloat(matBorderPreset.value);
    const smallestDim = Math.min(frameWidth, frameHeight);
    let effectiveBorder = border;

    if (smallestDim <= 6) effectiveBorder = Math.max(0.5, border * 0.5);
    else if (smallestDim <= 12) effectiveBorder = Math.max(0.75, border * 0.75);

    effectiveBorder = Math.min(effectiveBorder, smallestDim / 2 - 0.125);
    document.getElementById('matWidth').value = Math.max(0, frameWidth - effectiveBorder * 2);
    document.getElementById('matHeight').value = Math.max(0, frameHeight - effectiveBorder * 2);
  } else {
    const matWidth = Math.min(parseFloat(document.getElementById('matWidth').value), frameWidth);
    const matHeight = Math.min(parseFloat(document.getElementById('matHeight').value), frameHeight);
    document.getElementById('matWidth').value = matWidth;
    document.getElementById('matHeight').value = matHeight;
  }
}

document.getElementById('frameWidth').addEventListener('change', () => {
  frameSizePreset.value = '';
  updateFrameCustomVisibility();
  applyAutoOrientationToFrame();
  updateMatSizeToFit();
  renderCanvas();
});
document.getElementById('frameHeight').addEventListener('change', () => {
  frameSizePreset.value = '';
  updateFrameCustomVisibility();
  applyAutoOrientationToFrame();
  updateMatSizeToFit();
  renderCanvas();
});

document.getElementById('matWidth').addEventListener('change', updateMatSizeToFit);
document.getElementById('matHeight').addEventListener('change', updateMatSizeToFit);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateFrameCustomVisibility();
  updateMatCustomVisibility();
  if (frameSizePreset && frameSizePreset.value) frameSizePreset.dispatchEvent(new Event('change'));
  renderCanvas();
});

// Handle image upload
document.getElementById("imageUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fileName = document.querySelector(".file-name");
  fileName.textContent = file.name;

  const reader = new FileReader();
  reader.onload = (event) => {
    uploadedImage = new Image();
    uploadedImage.src = event.target.result;
    uploadedImage.onload = () => {
      const isLandscape = uploadedImage.width > uploadedImage.height;
      const frameWidth = parseFloat(document.getElementById('frameWidth').value);
      const frameHeight = parseFloat(document.getElementById('frameHeight').value);
      const frameIsLandscape = frameWidth > frameHeight;

      if (isLandscape !== frameIsLandscape) {
        document.getElementById('frameWidth').value = frameHeight;
        document.getElementById('frameHeight').value = frameWidth;
        frameSizePreset.value = '';
        updateFrameCustomVisibility();
      }

      updateMatSizeToFit();
      renderCanvas();
    };
  };
  reader.readAsDataURL(file);
});

// Fill image checkbox
const fillCheckbox = document.getElementById('fillImage');
if (fillCheckbox) fillCheckbox.addEventListener('change', renderCanvas);

// Show mat checkbox
if (showMatCheckbox) showMatCheckbox.addEventListener('change', renderCanvas);

// Orientation handling
const orientationSelect = document.getElementById('orientationSelect');
function applyAutoOrientationToFrame() {
  if (!orientationSelect) return;

  const frameWInput = document.getElementById('frameWidth');
  const frameHInput = document.getElementById('frameHeight');
  const fw = parseFloat(frameWInput.value);
  const fh = parseFloat(frameHInput.value);
  const largerDim = Math.max(fw, fh);
  const smallerDim = Math.min(fw, fh);
  const orientation = orientationSelect.value;
  let needsRotation = false;

  if (orientation === 'auto' && uploadedImage) {
    const imgIsLandscape = uploadedImage.width > uploadedImage.height;
    const frameIsLandscape = fw > fh;
    needsRotation = imgIsLandscape !== frameIsLandscape;
  } else if (orientation === 'portrait') needsRotation = fw > fh;
  else if (orientation === 'landscape') needsRotation = fh > fw;

  if (needsRotation) {
    if (orientation === 'portrait') {
      frameWInput.value = smallerDim;
      frameHInput.value = largerDim;
    } else {
      frameWInput.value = largerDim;
      frameHInput.value = smallerDim;
    }

    frameSizePreset.value = '';
    updateFrameCustomVisibility();

    const currentPreset = matBorderPreset.value;
    if (currentPreset) matBorderPreset.dispatchEvent(new Event('change'));
    else updateMatSizeToFit();
  }
}

orientationSelect?.addEventListener('change', () => {
  const lastFrameW = document.getElementById('frameWidth').value;
  const lastFrameH = document.getElementById('frameHeight').value;
  applyAutoOrientationToFrame();
  const newFrameW = document.getElementById('frameWidth').value;
  const newFrameH = document.getElementById('frameHeight').value;
  if (lastFrameW !== newFrameW || lastFrameH !== newFrameH) updateMatSizeToFit();
  renderCanvas();
});

// Color selectors
function wireColorInputs(selectId, inputId) {
  const select = document.getElementById(selectId);
  const input = document.getElementById(inputId);
  if (!select || !input) return;

  select.addEventListener('change', () => { input.value = select.value; renderCanvas(); });
  input.addEventListener('input', () => { select.value = input.value; renderCanvas(); });

  // Apply swatches
  select.querySelectorAll('option[data-color]').forEach(option => {
    const color = option.getAttribute('data-color');
    option.style.backgroundColor = color;
    const rgb = parseInt(color.slice(1), 16);
    const brightness = ((rgb >> 16 & 0xff) * 0.299 + ((rgb >> 8) & 0xff) * 0.587 + (rgb & 0xff) * 0.114);
    option.style.color = brightness > 186 ? '#000' : '#fff';
    option.style.padding = '5px 5px 5px 25px';
  });
}
wireColorInputs('frameColorSelect', 'frameColor');
wireColorInputs('matColorSelect', 'matColor');
wireColorInputs('wallColorSelect', 'wallColor');

// Draw frame
function drawFrame(x, y, width, height, frameThickness, frameColor) {
  ctx.fillStyle = frameColor;
  ctx.fillRect(x, y, width, height);

  const innerX = x + frameThickness;
  const innerY = y + frameThickness;
  const innerW = Math.max(0, width - frameThickness * 2);
  const innerH = Math.max(0, height - frameThickness * 2);
  ctx.fillStyle = 'white';
  ctx.fillRect(innerX, innerY, innerW, innerH);

  const strokeW = Math.max(1, Math.round(frameThickness * 0.06));
  ctx.lineWidth = strokeW;
  ctx.strokeStyle = adjustColor(frameColor, -24);
  ctx.strokeRect(x + strokeW / 2, y + strokeW / 2, width - strokeW, height - strokeW);

  ctx.lineWidth = Math.max(1, Math.floor(strokeW));
  ctx.strokeStyle = adjustColor(frameColor, 24);
  if (innerW > 0 && innerH > 0) ctx.strokeRect(innerX + 0.5, innerY + 0.5, innerW - 1, innerH - 1);
}

// Color adjust helper
function adjustColor(color, amount) {
  const hex = color.replace("#", "");
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// Render canvas
function renderCanvas() {
  const frameInnerWidth = parseFloat(document.getElementById("frameWidth").value);
  const frameInnerHeight = parseFloat(document.getElementById("frameHeight").value);
  const frameThickness = Math.max(0, parseFloat(document.getElementById("frameThickness").value));
  const frameColor = document.getElementById("frameColor").value;
  const matWidthIn = Math.min(parseFloat(document.getElementById("matWidth").value), frameInnerWidth);
  const matHeightIn = Math.min(parseFloat(document.getElementById("matHeight").value), frameInnerHeight);
  const matColor = document.getElementById("matColor").value;
  const bgColor = document.getElementById("bgColor").value;
  const showMat = showMatCheckbox?.checked ?? true;
  const scale = calculateScale(frameInnerWidth, frameInnerHeight);

  const scaleInfo = document.getElementById('scaleInfo');
  if (scaleInfo) {
    const scalePercent = ((scale / 96) * 100).toFixed(0);
    scaleInfo.textContent = `Scale: 1 inch = ${scale.toFixed(1)} pixels (${scalePercent}% of actual size)`;
  }

  document.getElementById("matWidth").value = matWidthIn;
  document.getElementById("matHeight").value = matHeightIn;

  const innerWpx = frameInnerWidth * scale;
  const innerHpx = frameInnerHeight * scale;
  const thicknessPx = frameThickness * scale;
  const outerWpx = innerWpx + thicknessPx * 2;
  const outerHpx = innerHpx + thicknessPx * 2;
  const matWpx = matWidthIn * scale;
  const matHpx = matHeightIn * scale;

  const padding = 40;
  const wallColor = document.getElementById('wallColor')?.value || '#FBFBFB';
  canvas.width = Math.max(outerWpx + padding * 2, 200);
  canvas.height = Math.max(outerHpx + padding * 2, 200);
  canvas.style.background = wallColor;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawFrame(padding, padding, outerWpx, outerHpx, thicknessPx, frameColor);

  const innerX = padding + thicknessPx;
  const innerY = padding + thicknessPx;
  const matX = innerX + Math.max(0, (innerWpx - matWpx) / 2);
  const matY = innerY + Math.max(0, (innerHpx - matHpx) / 2);

  if (showMat) {
    ctx.fillStyle = matColor;
    ctx.fillRect(innerX, innerY, innerWpx, innerHpx);
    ctx.save();
    ctx.beginPath();
    ctx.rect(matX, matY, matWpx, matHpx);
    ctx.clip();
    ctx.fillStyle = bgColor;
    ctx.fillRect(matX, matY, matWpx, matHpx);
    drawImageInMat(matX, matY, matWpx, matHpx);
    ctx.restore();
    ctx.strokeStyle = adjustColor(matColor, -20);
    ctx.lineWidth = Math.max(1, scale * 0.01);
    ctx.strokeRect(matX + 0.5, matY + 0.5, matWpx - 1, matHpx - 1);
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.rect(innerX, innerY, innerWpx, innerHpx);
    ctx.clip();
    ctx.fillStyle = bgColor;
    ctx.fillRect(innerX, innerY, innerWpx, innerHpx);
    drawImageInMat(innerX, innerY, innerWpx, innerHpx);
    ctx.restore();
  }
}

function drawImageInMat(finalX, finalY, finalW, finalH) {
  if (!uploadedImage) return;
  const fill = fillCheckbox?.checked ?? false;
  const sourceImage = uploadedImage;
  const aspect = sourceImage.width / sourceImage.height;
  let drawW, drawH;

  if (fill) {
    if (finalW / finalH > aspect) {
      drawW = finalW;
      drawH = finalW / aspect;
    } else {
      drawH = finalH;
      drawW = finalH * aspect;
    }
  } else {
    if (finalW / finalH > aspect) {
      drawH = finalH;
      drawW = finalH * aspect;
    } else {
      drawW = finalW;
      drawH = finalW / aspect;
    }
  }

  ctx.drawImage(sourceImage, finalX + (finalW - drawW) / 2, finalY + (finalH - drawH) / 2, drawW, drawH);
}
