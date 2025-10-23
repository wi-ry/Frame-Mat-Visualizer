const form = document.getElementById("configForm");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let uploadedImage = null;

// Dynamic scaling based on frame size
function calculateScale(frameWidth, frameHeight) {
  // Start at 40% of standard 96 PPI for comfortable default size
  const BASE_SCALE = 38; // ~40% of 96 PPI
  
  // Maximum dimensions we want to allow on screen (accounting for padding)
  const MAX_WIDTH = 1600; // Comfortable fit for 1080p
  const MAX_HEIGHT = 800; // Leaves room for UI elements
  
  // Calculate total frame size including thickness
  const thickness = parseFloat(document.getElementById("frameThickness").value) || 0.75;
  const totalWidth = frameWidth + (thickness * 2);
  const totalHeight = frameHeight + (thickness * 2);
  
  // If frame is larger than 9x12, calculate a reduced scale
  if (frameWidth > 9 || frameHeight > 12) {
    // Calculate scales that would fit width and height
    const scaleByWidth = (MAX_WIDTH - 80) / totalWidth; // 80px for padding
    const scaleByHeight = (MAX_HEIGHT - 80) / totalHeight;
    
    // Use the smaller scale to ensure entire frame fits
    return Math.min(BASE_SCALE, scaleByWidth, scaleByHeight);
  }
  
  return BASE_SCALE;
}

// Handle frame size presets
const frameSizePreset = document.getElementById('frameSizePreset');
frameSizePreset.addEventListener('change', () => {
  const [width, height] = frameSizePreset.value.split('x').map(Number);
  if (width && height) {
    document.getElementById('frameWidth').value = width;
    document.getElementById('frameHeight').value = height;
    // Check if we need to swap dimensions based on orientation
    applyAutoOrientationToFrame();
    // Reset mat size to ensure it fits within new frame size
    updateMatSizeToFit();
    renderCanvas();
  }
});

// Show/hide frame custom inputs based on preset selection
function updateFrameCustomVisibility() {
  const frameCustom = document.getElementById('frameCustomInputs');
  if (frameSizePreset.value === '') {
    frameCustom.style.display = 'block';
  } else {
    frameCustom.style.display = 'none';
  }
}
frameSizePreset.addEventListener('change', updateFrameCustomVisibility);

// Handle mat border presets
const matBorderPreset = document.getElementById('matBorderPreset');
matBorderPreset.addEventListener('change', () => {
  if (matBorderPreset.value) {
    const border = parseFloat(matBorderPreset.value);
    const frameWidth = parseFloat(document.getElementById('frameWidth').value);
    const frameHeight = parseFloat(document.getElementById('frameHeight').value);
    
    // Calculate appropriate border size based on frame dimensions
    // Use simple buckets so presets produce sensible results:
    // - Small frames (<=6" smallest side): use ~50% of selected preset (but at least 0.5")
    // - Medium frames (>6" and <=12"): use ~75% of selected preset
    // - Large frames (>12"): use the full selected preset
    let effectiveBorder = border;
    const smallestDim = Math.min(frameWidth, frameHeight);

    if (smallestDim <= 6) {
      effectiveBorder = Math.max(0.5, border * 0.5);
    } else if (smallestDim <= 12) {
      effectiveBorder = Math.max(0.75, border * 0.75);
    } else {
      effectiveBorder = border; // full preset for large frames
    }

    // Ensure border does not exceed half the smallest frame dimension
    effectiveBorder = Math.min(effectiveBorder, smallestDim / 2 - 0.125);

    document.getElementById('matWidth').value = Math.max(0, frameWidth - (effectiveBorder * 2));
    document.getElementById('matHeight').value = Math.max(0, frameHeight - (effectiveBorder * 2));
    renderCanvas();
  }
});

// Show/hide mat custom inputs based on preset selection
function updateMatCustomVisibility() {
  const matCustom = document.getElementById('matCustomInputs');
  if (matBorderPreset.value === '') {
    matCustom.style.display = 'block';
  } else {
    matCustom.style.display = 'none';
  }
}
matBorderPreset.addEventListener('change', updateMatCustomVisibility);

// Function to update mat size to fit within frame
function updateMatSizeToFit() {
  const frameWidth = parseFloat(document.getElementById('frameWidth').value);
  const frameHeight = parseFloat(document.getElementById('frameHeight').value);
  
  // If there's a mat border preset selected, use that to calculate mat size
  if (matBorderPreset.value) {
    const border = parseFloat(matBorderPreset.value);
    // Calculate border based on frame size (same logic as in preset change handler)
    const smallestDim = Math.min(frameWidth, frameHeight);
    let effectiveBorder = border;
    
    if (smallestDim <= 6) {
      effectiveBorder = Math.max(0.5, border * 0.5);
    } else if (smallestDim <= 12) {
      effectiveBorder = Math.max(0.75, border * 0.75);
    }
    
    // Ensure border doesn't exceed half the smallest frame dimension
    effectiveBorder = Math.min(effectiveBorder, smallestDim / 2 - 0.125);
    
    // Set mat dimensions based on border
    document.getElementById('matWidth').value = Math.max(0, frameWidth - (effectiveBorder * 2));
    document.getElementById('matHeight').value = Math.max(0, frameHeight - (effectiveBorder * 2));
  } else {
    // No preset - just ensure mat fits within frame
    const matWidth = Math.min(parseFloat(document.getElementById('matWidth').value), frameWidth);
    const matHeight = Math.min(parseFloat(document.getElementById('matHeight').value), frameHeight);
    
    document.getElementById('matWidth').value = matWidth;
    document.getElementById('matHeight').value = matHeight;
  }
}

document.getElementById('frameWidth').addEventListener('change', updateMatSizeToFit);
document.getElementById('frameHeight').addEventListener('change', updateMatSizeToFit);
// Add event listeners for frame size changes to update mat constraints
document.getElementById('frameWidth').addEventListener('change', () => {
  // mark frame preset as custom when user edits sizes manually
  frameSizePreset.value = '';
  updateFrameCustomVisibility();
  applyAutoOrientationToFrame(); // Re-check orientation when dimensions change
  updateMatSizeToFit();
  renderCanvas();
});
document.getElementById('frameHeight').addEventListener('change', () => {
  frameSizePreset.value = '';
  updateFrameCustomVisibility();
  applyAutoOrientationToFrame(); // Re-check orientation when dimensions change
  updateMatSizeToFit();
  renderCanvas();
});

// Handle mat size changes to ensure they stay within frame bounds
document.getElementById('matWidth').addEventListener('change', updateMatSizeToFit);
document.getElementById('matHeight').addEventListener('change', updateMatSizeToFit);

// Render initial frame when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Initialize visibility for custom inputs
  updateFrameCustomVisibility();
  updateMatCustomVisibility();
  // If a frame preset is selected by default, apply its values
  if (frameSizePreset && frameSizePreset.value) {
    frameSizePreset.dispatchEvent(new Event('change'));
  }
  renderCanvas();
});

// Handle file selection with in-memory processing
document.getElementById("imageUpload").addEventListener("change", (e) => {
const file = e.target.files[0];
if (!file) return;
// Update file name display
const fileName = document.querySelector(".file-name");
fileName.textContent = file.name;
// Create FileReader for in-memory processing
const reader = new FileReader();
reader.onload = (event) => {
uploadedImage = new Image();
uploadedImage.src = event.target.result;
uploadedImage.onload = () => {
// Check if we need to auto-rotate the image to landscape
const isLandscape = uploadedImage.width > uploadedImage.height;
const frameWidth = parseFloat(document.getElementById('frameWidth').value);
const frameHeight = parseFloat(document.getElementById('frameHeight').value);
const frameIsLandscape = frameWidth > frameHeight;
// Check if orientation change is needed
if (isLandscape !== frameIsLandscape) {
// Swap frame dimensions
document.getElementById('frameWidth').value = frameHeight;
document.getElementById('frameHeight').value = frameWidth;
// Reset frame preset since we modified dimensions
document.getElementById('frameSizePreset').value = '';
updateFrameCustomVisibility();
// Hide orientation controls since image forced an orientation
if (orientationSelect) {
orientationSelect.closest('.form-group').style.display = 'none';
}
} else {
// Show orientation controls if no forced change was needed
if (orientationSelect) {
orientationSelect.closest('.form-group').style.display = 'block';
orientationSelect.value = 'auto';
}
}
updateRotationInfo(false);
updateMatSizeToFit(); // Ensure mat still fits after any frame changes
// Force a re-render after a small delay to ensure image is ready
    setTimeout(() => {
        updateRotationInfo();
        updateMatSizeToFit();
        renderCanvas();
    }, 10);
};
};

  reader.onerror = (error) => {
    alert("Error reading file: " + error);
    console.error(error);
  };

  // Read the file as a data URL
  reader.readAsDataURL(file);
});

// Add real-time updates for all inputs
const inputs = form.querySelectorAll("input");
inputs.forEach(input => {
  input.addEventListener("input", renderCanvas);
});

// Ensure the new checkbox also triggers rendering (it is part of inputs, but ensure explicit hookup if needed)
const fillCheckbox = document.getElementById('fillImage');
if (fillCheckbox) fillCheckbox.addEventListener('change', renderCanvas);

// Orientation selector
const orientationSelect = document.getElementById('orientationSelect');
if (orientationSelect) orientationSelect.addEventListener('change', () => {
  const lastFrameW = document.getElementById('frameWidth').value;
  const lastFrameH = document.getElementById('frameHeight').value;
  
  // Apply orientation change
  applyAutoOrientationToFrame();
  
  // Check if dimensions actually changed
  const newFrameW = document.getElementById('frameWidth').value;
  const newFrameH = document.getElementById('frameHeight').value;
  
  if (lastFrameW !== newFrameW || lastFrameH !== newFrameH) {
    // Only update mat and render if frame dimensions changed
    updateMatSizeToFit();
  }
  
  updateRotationInfo();
  renderCanvas();
});

const rotationInfoEl = document.getElementById('rotationInfo');

function updateRotationInfo() {
  if (!rotationInfoEl) return;
  const frameWidth = parseFloat(document.getElementById('frameWidth').value);
  const frameHeight = parseFloat(document.getElementById('frameHeight').value);
  const frameOrientation = frameWidth > frameHeight ? 'landscape' : 'portrait';
  let text = `Frame: ${frameOrientation}`;
  if (uploadedImage) {
    const imgOrientation = uploadedImage.width > uploadedImage.height ? 'landscape' : 'portrait';
    text += ` | Image: ${imgOrientation}`;
    if (orientationSelect && orientationSelect.value !== 'auto') {
      text += ` (${orientationSelect.value} mode)`;
    }
  }
  rotationInfoEl.textContent = text;
}

/*** Rotation handling was moved to earlier event listeners ***/

// Adjust frame dimensions to match desired orientation
function applyAutoOrientationToFrame() {
  if (!orientationSelect) return;
  
  // Get current frame dimensions
  const frameWInput = document.getElementById('frameWidth');
  const frameHInput = document.getElementById('frameHeight');
  const fw = parseFloat(frameWInput.value);
  const fh = parseFloat(frameHInput.value);
  
  // Always use the larger dimension as the reference
  const largerDim = Math.max(fw, fh);
  const smallerDim = Math.min(fw, fh);
  const orientation = orientationSelect.value;
  
  // Determine if we need to swap dimensions
  let needsRotation = false;
  
  if (orientation === 'auto' && uploadedImage) {
    // In auto mode, frame should match image orientation if an image is uploaded
    const imgIsLandscape = uploadedImage.width > uploadedImage.height;
    const frameIsLandscape = fw > fh;
    needsRotation = imgIsLandscape !== frameIsLandscape;
  } else if (orientation === 'portrait') {
    // In portrait mode, height should be larger
    needsRotation = fw > fh;
  } else if (orientation === 'landscape') {
    // In landscape mode, width should be larger
    needsRotation = fh > fw;
  }
  
  // Apply rotation if needed
  if (needsRotation) {
    // Determine which dimension should be larger based on orientation
    if (orientation === 'portrait') {
      // In portrait, height should be larger
      frameWInput.value = smallerDim;
      frameHInput.value = largerDim;
    } else {
      // In landscape or auto, width should be larger
      frameWInput.value = largerDim;
      frameHInput.value = smallerDim;
    }
    
    // Clear preset since dimensions changed
    frameSizePreset.value = '';
    updateFrameCustomVisibility();
    
    // Update mat border to maintain proportions
    const currentPreset = matBorderPreset.value;
    if (currentPreset) {
      matBorderPreset.dispatchEvent(new Event('change'));
    } else {
      updateMatSizeToFit();
    }
  }
}

// Initialize color swatches in dropdowns
document.querySelectorAll('select option[data-color]').forEach(option => {
  const color = option.getAttribute('data-color');
  option.style.backgroundColor = color;
  // Add contrast for better readability
  const rgb = parseInt(color.slice(1), 16);
  const brightness = (
    ((rgb >> 16) & 0xff) * 0.299 +
    ((rgb >> 8) & 0xff) * 0.587 +
    (rgb & 0xff) * 0.114
  );
  option.style.color = brightness > 186 ? '#000000' : '#FFFFFF';
  option.style.padding = '5px 5px 5px 25px';  // Add space for the color preview
});

// Wire up color preset selects to update color inputs
const frameColorSelect = document.getElementById('frameColorSelect');
const frameColorInput = document.getElementById('frameColor');
if (frameColorSelect && frameColorInput) {
  frameColorSelect.addEventListener('change', () => {
    frameColorInput.value = frameColorSelect.value;
    renderCanvas();
  });
  frameColorInput.addEventListener('input', () => {
    frameColorSelect.value = frameColorInput.value;
    renderCanvas();
  });
}

const matColorSelect = document.getElementById('matColorSelect');
const matColorInput = document.getElementById('matColor');
if (matColorSelect && matColorInput) {
  matColorSelect.addEventListener('change', () => {
    matColorInput.value = matColorSelect.value;
    renderCanvas();
  });
  matColorInput.addEventListener('input', () => {
    matColorSelect.value = matColorInput.value;
    renderCanvas();
  });
}

// Wall color wiring
const wallColorSelect = document.getElementById('wallColorSelect');
const wallColorInput = document.getElementById('wallColor');
if (wallColorSelect && wallColorInput) {
  wallColorSelect.addEventListener('change', () => {
    wallColorInput.value = wallColorSelect.value;
    renderCanvas();
  });
  wallColorInput.addEventListener('input', () => {
    wallColorSelect.value = wallColorInput.value;
    renderCanvas();
  });
}

function drawFrame(x, y, width, height, frameThickness, frameColor) {
  // Draw outer frame
  ctx.fillStyle = frameColor;
  ctx.fillRect(x, y, width, height);

  // Draw inner opening (cutout)
  const innerX = x + frameThickness;
  const innerY = y + frameThickness;
  const innerW = Math.max(0, width - frameThickness * 2);
  const innerH = Math.max(0, height - frameThickness * 2);
  ctx.fillStyle = 'white'; // inner opening (artwork area)
  ctx.fillRect(innerX, innerY, innerW, innerH);

  // Add subtle bevel/outline so light frames remain visible against page background
  const strokeW = Math.max(1, Math.round(frameThickness * 0.06));

  // Outer outline (slightly darker)
  ctx.lineWidth = strokeW;
  ctx.strokeStyle = adjustColor(frameColor, -24);
  ctx.strokeRect(x + strokeW / 2, y + strokeW / 2, width - strokeW, height - strokeW);

  // Inner outline (slightly lighter) to separate frame from inner opening
  ctx.lineWidth = Math.max(1, Math.floor(strokeW));
  ctx.strokeStyle = adjustColor(frameColor, 24);
  if (innerW > 0 && innerH > 0) {
    ctx.strokeRect(innerX + 0.5, innerY + 0.5, innerW - 1, innerH - 1);
  }
}

function adjustColor(color, amount) {
  const hex = color.replace("#", "");
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function renderCanvas() {
  // User-specified frameWidth/frameHeight are the inner opening (visible artwork area)
  const frameInnerWidth = parseFloat(document.getElementById("frameWidth").value);
  const frameInnerHeight = parseFloat(document.getElementById("frameHeight").value);
  const frameThickness = Math.max(0, parseFloat(document.getElementById("frameThickness").value));
  const frameColor = document.getElementById("frameColor").value;
  // Mat must fit inside the inner opening (in inches)
  const matWidthIn = Math.min(parseFloat(document.getElementById("matWidth").value), frameInnerWidth || 0);
  const matHeightIn = Math.min(parseFloat(document.getElementById("matHeight").value), frameInnerHeight || 0);
  const matColor = document.getElementById("matColor").value;
  const bgColor = document.getElementById("bgColor").value;

  // Calculate appropriate scale for current frame size
  const scale = calculateScale(frameInnerWidth, frameInnerHeight);
  
  // Update scale info display
  const scaleInfo = document.getElementById('scaleInfo');
  const scalePercent = ((scale / 96) * 100).toFixed(0);
  scaleInfo.textContent = `Scale: 1 inch = ${scale.toFixed(1)} pixels (${scalePercent}% of actual size)`;

  // Reflect constrained mat sizes back into the inputs
  document.getElementById("matWidth").value = matWidthIn;
  document.getElementById("matHeight").value = matHeightIn;

  // Convert inches to pixels using dynamic scale
  const innerWpx = (frameInnerWidth || 0) * scale;
  const innerHpx = (frameInnerHeight || 0) * scale;
  const thicknessPx = frameThickness * scale;
  const outerWpx = innerWpx + thicknessPx * 2;
  const outerHpx = innerHpx + thicknessPx * 2;
  const matWpx = matWidthIn * scale;
  const matHpx = matHeightIn * scale;

  // Set canvas size with padding
  const padding = 40;
  // Use wall color as canvas background if provided
  const wallColor = (document.getElementById('wallColor') && document.getElementById('wallColor').value) || '#FBFBFB';
  canvas.width = Math.max(outerWpx + padding * 2, 200);
  canvas.height = Math.max(outerHpx + padding * 2, 200);
  // Set style background for visual background
  canvas.style.background = wallColor;
  // Clear drawing surface
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw outer frame (outerWpx/outerHpx) where frameThickness is outside the inner opening
  drawFrame(padding, padding, outerWpx, outerHpx, thicknessPx, frameColor);

  // Calculate top-left of inner opening (where artwork/mat sit)
  const innerX = padding + thicknessPx;
  const innerY = padding + thicknessPx;

  // Calculate mat position centered within inner opening
  // matWpx/matHpx represent the opening in the mat where the image shows
  // The mat itself is the border area between the inner opening and the image opening.
  const matX = innerX + Math.max(0, (innerWpx - matWpx) / 2);
  const matY = innerY + Math.max(0, (innerHpx - matHpx) / 2);

  // Draw the mat (fill the inner opening first with mat color)
  ctx.fillStyle = matColor;
  ctx.fillRect(innerX, innerY, innerWpx, innerHpx);

  // Draw image area (inside the mat) using bgColor as the image background
  // and clip so any image parts outside the mat opening are hidden
  ctx.save();
  ctx.beginPath();
  ctx.rect(matX, matY, matWpx, matHpx);
  ctx.clip();

  // fill background inside the clipped area
  ctx.fillStyle = bgColor;
  ctx.fillRect(matX, matY, matWpx, matHpx);

    // Draw uploaded image, either contain (fit) or cover (fill) based on checkbox
  if (uploadedImage) {
    const fill = fillCheckbox && fillCheckbox.checked;
    
    // Use original image directly - no rotation needed since we handle orientation through frame dimensions
    const sourceImage = uploadedImage;
    
    // Get image aspect ratio
    const imageAspect = sourceImage.width / sourceImage.height;
    console.log('Drawing image:', {
      sourceWidth: sourceImage.width,
      sourceHeight: sourceImage.height,
      aspect: imageAspect,
      matSize: { w: matWpx, h: matHpx }
    });    // Calculate dimensions to fit or fill
    const finalAspect = sourceImage.width / sourceImage.height;
    let finalW, finalH;

    if (fill) {
      // Cover: fill the mat area and crop overflow
      if (matWpx / matHpx > finalAspect) {
        // mat is wider than image -> match width
        finalW = matWpx;
        finalH = matWpx / finalAspect;
      } else {
        // mat is taller than image -> match height
        finalH = matHpx;
        finalW = matHpx * finalAspect;
      }
    } else {
      // Contain: fit inside mat area
      if (matWpx / matHpx > finalAspect) {
        // mat is wider than image -> match height
        finalH = matHpx;
        finalW = matHpx * finalAspect;
      } else {
        // mat is taller than image -> match width
        finalW = matWpx;
        finalH = matWpx / finalAspect;
      }
    }

    // Center the image in the mat opening
    const finalX = matX + (matWpx - finalW) / 2;
    const finalY = matY + (matHpx - finalH) / 2;

    // Draw the final image and update rotation info
    updateRotationInfo();
    ctx.drawImage(sourceImage, finalX, finalY, finalW, finalH);
  }

  // restore to remove clip before drawing borders
  ctx.restore();

  // Optional thin border around image area for clarity
  ctx.strokeStyle = adjustColor(matColor, -20);
  ctx.lineWidth = Math.max(1, scale * 0.01);
  ctx.strokeRect(matX + 0.5, matY + 0.5, matWpx - 1, matHpx - 1);
}
