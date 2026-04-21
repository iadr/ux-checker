// Global state
let currentImage = null;
let analysisMode = 'single';
let selectedDisabilities = ['protanopia'];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check which analysis mode is selected in the DOM
    const checkedAnalysisType = document.querySelector('input[name="analysisType"]:checked');
    if (checkedAnalysisType) {
        analysisMode = checkedAnalysisType.value;
    }
    
    initializeEventListeners();
    updateDisabilityOptions();
});

// Event Listeners
function initializeEventListeners() {
    // File input
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    
    // Analysis type radio buttons
    document.querySelectorAll('input[name="analysisType"]').forEach(radio => {
        radio.addEventListener('change', handleAnalysisTypeChange);
    });
    
    // Disability checkboxes - use event delegation on parent
    const disabilityContainer = document.getElementById('disabilityOptions');
    disabilityContainer.addEventListener('change', (e) => {
        if (e.target.matches('input[type="checkbox"], input[type="radio"]')) {
            handleDisabilityChange(e);
        }
    });
    
    // Slider comparison toggle
    document.getElementById('sliderComparison').addEventListener('change', handleSliderToggle);
    
    // Action buttons
    document.getElementById('analyzeButton').addEventListener('click', performAnalysis);
    document.getElementById('resetButton').addEventListener('click', resetApp);
    
    // Knowledge Base button and modal
    document.getElementById('knowledgeBaseButton').addEventListener('click', openKnowledgeBase);
    document.getElementById('closeModalButton').addEventListener('click', closeKnowledgeBase);
    
    // Knowledge Base navigation - use event delegation
    document.querySelector('.kb-navigation').addEventListener('click', (e) => {
        if (e.target.classList.contains('kb-nav-btn')) {
            handleKnowledgeBaseNav(e);
        }
    });
    
    // Close modal when clicking outside
    document.getElementById('knowledgeBaseModal').addEventListener('click', (e) => {
        if (e.target.id === 'knowledgeBaseModal') {
            closeKnowledgeBase();
        }
    });
    
    // Image slider
    document.getElementById('imageSlider').addEventListener('input', handleSliderMove);
}

// File handling
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
}

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            
            // Make drop zone compact
            const dropZone = document.getElementById('dropZone');
            dropZone.classList.add('compact');
            
            // Show preview
            const preview = document.getElementById('imagePreview');
            const previewCanvas = document.getElementById('previewCanvas');
            const previewFilename = document.getElementById('previewFilename');
            
            preview.style.display = 'flex';
            previewFilename.textContent = file.name;
            
            // Render thumbnail
            const ctx = previewCanvas.getContext('2d');
            const maxWidth = 120;
            const maxHeight = 80;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }
            
            previewCanvas.width = width;
            previewCanvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Show uploaded image in results area immediately
            showUploadedImage();
            
            document.getElementById('analyzeButton').disabled = false;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function showUploadedImage() {
    const resultsContainer = document.getElementById('resultsContainer');
    const singleResult = document.getElementById('singleResult');
    const completeResult = document.getElementById('completeResult');
    
    resultsContainer.style.display = 'block';
    
    if (analysisMode === 'single') {
        singleResult.style.display = 'block';
        completeResult.style.display = 'none';
        
        // Show original image only
        const processedCanvas = document.getElementById('processedCanvas');
        renderOriginal(currentImage, processedCanvas);
        
        const originalCanvasSmall = document.getElementById('originalCanvasSmall');
        renderOriginal(currentImage, originalCanvasSmall);
        
        // Hide slider initially
        document.getElementById('sliderContainer').style.display = 'none';
        document.querySelector('.comparison-wrapper').style.display = 'flex';
    } else {
        singleResult.style.display = 'none';
        completeResult.style.display = 'block';
        
        // Show original image in grid
        const grid = document.querySelector('.analysis-grid');
        grid.innerHTML = '';
        const originalItem = createAnalysisItem('Original', currentImage, null);
        grid.appendChild(originalItem);
    }
    
    // Clear previous report
    document.getElementById('reportContent').innerHTML = '<p style="color: var(--text-secondary); font-style: italic;">Click "Analyze Image" to generate accessibility report.</p>';
}

// Analysis type handling
function handleAnalysisTypeChange(e) {
    analysisMode = e.target.value;
    updateDisabilityOptions();
}

function updateDisabilityOptions() {
    const checkboxes = document.querySelectorAll('input[name="disability"], input[name="disabilitySingle"]');
    
    if (analysisMode === 'single') {
        // Single mode: only one disability can be selected
        const currentValue = selectedDisabilities[0] || checkboxes[0]?.value;
        checkboxes.forEach(cb => {
            cb.type = 'radio';
            cb.name = 'disabilitySingle';
            cb.checked = (cb.value === currentValue);
        });
        selectedDisabilities = [currentValue];
    } else {
        // Complete mode: multiple disabilities can be selected
        // Preserve checked state when switching from single mode
        const wasChecked = new Set();
        checkboxes.forEach(cb => {
            if (cb.checked) wasChecked.add(cb.value);
        });
        
        checkboxes.forEach(cb => {
            cb.type = 'checkbox';
            cb.name = 'disability';
            // Keep current selection (allow none)
            cb.checked = wasChecked.has(cb.value);
        });
        
        updateSelectedDisabilities();
    }
}

function handleDisabilityChange(e) {
    if (analysisMode === 'single') {
        selectedDisabilities = [e.target.value];
    } else {
        updateSelectedDisabilities();
    }
}

function updateSelectedDisabilities() {
    const selector = analysisMode === 'single' 
        ? 'input[name="disabilitySingle"]:checked' 
        : 'input[name="disability"]:checked';
    selectedDisabilities = Array.from(document.querySelectorAll(selector))
        .map(cb => cb.value);
    
    // In single mode, ensure at least one is selected
    if (analysisMode === 'single' && selectedDisabilities.length === 0) {
        const firstCheckbox = document.querySelector('input[name="disabilitySingle"]');
        if (firstCheckbox) {
            firstCheckbox.checked = true;
            selectedDisabilities = [firstCheckbox.value];
        }
    }
    // In complete mode, allow empty selection
}

// Slider comparison toggle
function handleSliderToggle(e) {
    const isChecked = e.target.checked;
    const comparisonWrapper = document.querySelector('.comparison-wrapper');
    const sliderContainer = document.getElementById('sliderContainer');
    
    if (analysisMode === 'single' && document.getElementById('resultsContainer').style.display !== 'none') {
        if (isChecked) {
            comparisonWrapper.style.display = 'none';
            sliderContainer.style.display = 'block';
            updateSliderComparison();
        } else {
            comparisonWrapper.style.display = 'flex';
            sliderContainer.style.display = 'none';
        }
    }
}

function handleSliderMove(e) {
    const percentage = e.target.value;
    const overlay = document.querySelector('.slider-overlay');
    const handle = document.querySelector('.slider-handle');
    
    overlay.style.width = percentage + '%';
    handle.style.left = percentage + '%';
}

// Main analysis function
function performAnalysis() {
    if (!currentImage) return;
    
    const resultsContainer = document.getElementById('resultsContainer');
    const singleResult = document.getElementById('singleResult');
    const completeResult = document.getElementById('completeResult');
    
    resultsContainer.style.display = 'block';
    
    if (analysisMode === 'single') {
        singleResult.style.display = 'block';
        completeResult.style.display = 'none';
        performSingleAnalysis();
    } else {
        singleResult.style.display = 'none';
        completeResult.style.display = 'block';
        performCompleteAnalysis();
    }
    
    generateReport();
}

function performSingleAnalysis() {
    // Update selected disability before analysis
    updateSelectedDisabilities();
    
    const disability = selectedDisabilities[0];
    if (!disability) {
        console.warn('No disability selected for single analysis');
        return;
    }
    
    const sliderEnabled = document.getElementById('sliderComparison').checked;
    
    // Render processed image
    const processedCanvas = document.getElementById('processedCanvas');
    applyFilter(currentImage, processedCanvas, disability);
    
    // Render original thumbnail
    const originalCanvasSmall = document.getElementById('originalCanvasSmall');
    renderOriginal(currentImage, originalCanvasSmall);
    
    // Setup slider comparison if enabled
    if (sliderEnabled) {
        document.querySelector('.comparison-wrapper').style.display = 'none';
        document.getElementById('sliderContainer').style.display = 'block';
        updateSliderComparison();
    } else {
        document.querySelector('.comparison-wrapper').style.display = 'flex';
        document.getElementById('sliderContainer').style.display = 'none';
    }
}

function updateSliderComparison() {
    const disability = selectedDisabilities[0];
    
    // Bottom canvas (processed - shows on left when slider at 0%)
    const bottomCanvas = document.getElementById('sliderCanvasBottom');
    applyFilter(currentImage, bottomCanvas, disability);
    
    // Top canvas (original - in overlay, revealed from left as slider moves right)
    // Must match bottom canvas dimensions exactly
    const topCanvas = document.getElementById('sliderCanvasTop');
    topCanvas.width = bottomCanvas.width;
    topCanvas.height = bottomCanvas.height;
    
    // Render original to the top canvas
    renderOriginal(currentImage, topCanvas);
    
    // Set the display width to match the bottom canvas displayed width
    const bottomRect = bottomCanvas.getBoundingClientRect();
    topCanvas.style.width = bottomRect.width + 'px';
    topCanvas.style.height = bottomRect.height + 'px';
    
    // Reset slider position
    const slider = document.getElementById('imageSlider');
    const overlay = document.querySelector('.slider-overlay');
    const handle = document.querySelector('.slider-handle');
    
    overlay.style.width = slider.value + '%';
    handle.style.left = slider.value + '%';
}

function performCompleteAnalysis() {
    const grid = document.querySelector('.analysis-grid');
    grid.innerHTML = '';
    
    // Update selected disabilities before analysis
    updateSelectedDisabilities();
    
    // Add original image
    const originalItem = createAnalysisItem('Original', currentImage, null);
    grid.appendChild(originalItem);
    
    // Add each selected disability (if any)
    selectedDisabilities.forEach(disability => {
        const item = createAnalysisItem(getDisabilityLabel(disability), currentImage, disability);
        grid.appendChild(item);
    });
}

function createAnalysisItem(label, image, disability) {
    const item = document.createElement('div');
    item.className = 'analysis-item';
    
    const canvas = document.createElement('canvas');
    const labelEl = document.createElement('label');
    labelEl.className = 'image-label';
    labelEl.textContent = label;
    
    if (disability) {
        applyFilter(image, canvas, disability);
    } else {
        renderOriginal(image, canvas);
    }
    
    item.appendChild(canvas);
    item.appendChild(labelEl);
    
    return item;
}

// Image processing functions
function renderOriginal(image, canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
}

function applyFilter(image, canvas, disability) {
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    switch(disability) {
        case 'protanopia':
            applyProtanopia(data);
            break;
        case 'deuteranopia':
            applyDeuteranopia(data);
            break;
        case 'tritanopia':
            applyTritanopia(data);
            break;
        case 'achromatopsia':
            applyAchromatopsia(data);
            break;
        case 'lowContrast':
            applyLowContrast(data);
            break;
        case 'lowVision':
            applyLowVision(canvas, ctx, data);
            break;
        case 'epilepsy':
        case 'flashingContent':
            // These checks don't modify the image
            renderOriginal(image, canvas);
            return;
    }
    
    ctx.putImageData(imageData, 0, 0);
}

// Color blindness simulation algorithms using transformation matrices
function applyProtanopia(data) {
    // Protanopia (red-blind) transformation matrix
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        data[i] = 0.567 * r + 0.433 * g + 0 * b;
        data[i + 1] = 0.558 * r + 0.442 * g + 0 * b;
        data[i + 2] = 0 * r + 0.242 * g + 0.758 * b;
    }
}

function applyDeuteranopia(data) {
    // Deuteranopia (green-blind) transformation matrix
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        data[i] = 0.625 * r + 0.375 * g + 0 * b;
        data[i + 1] = 0.7 * r + 0.3 * g + 0 * b;
        data[i + 2] = 0 * r + 0.3 * g + 0.7 * b;
    }
}

function applyTritanopia(data) {
    // Tritanopia (blue-blind) transformation matrix
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        data[i] = 0.95 * r + 0.05 * g + 0 * b;
        data[i + 1] = 0 * r + 0.433 * g + 0.567 * b;
        data[i + 2] = 0 * r + 0.475 * g + 0.525 * b;
    }
}

function applyAchromatopsia(data) {
    // Achromatopsia (total color blindness) - convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
    }
}

function applyLowContrast(data) {
    // Simulate low contrast perception - reduce color differences
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Blend with luminance to reduce contrast (30% blend)
        const blendFactor = 0.3;
        data[i] = r * (1 - blendFactor) + lum * blendFactor;
        data[i + 1] = g * (1 - blendFactor) + lum * blendFactor;
        data[i + 2] = b * (1 - blendFactor) + lum * blendFactor;
    }
}

function applyLowVision(canvas, ctx, data) {
    // Simulate low vision with blur effect
    // First apply the data back to canvas
    ctx.putImageData(new ImageData(data, canvas.width, canvas.height), 0, 0);
    
    // Apply blur using canvas filter
    ctx.filter = 'blur(4px)';
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);
    
    // Reset filter and draw blurred image
    ctx.filter = 'none';
    ctx.drawImage(tempCanvas, 0, 0);
    
    // Get the blurred data back
    const blurredData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < data.length; i++) {
        data[i] = blurredData.data[i];
    }
}

// Analysis report generation
function generateReport() {
    const reportContent = document.getElementById('reportContent');
    reportContent.innerHTML = '';
    
    if (selectedDisabilities.length === 0) {
        reportContent.innerHTML = '<p style="color: var(--text-secondary); font-style: italic;">No accessibility checks selected. Select one or more disability types to generate a report.</p>';
        return;
    }
    
    selectedDisabilities.forEach(disability => {
        const item = createReportItem(disability);
        reportContent.appendChild(item);
    });
}

function createReportItem(disability) {
    const item = document.createElement('div');
    item.className = 'report-item';
    
    const title = document.createElement('h4');
    title.textContent = getDisabilityLabel(disability);
    
    const description = document.createElement('p');
    description.textContent = getDisabilityDescription(disability);
    
    // Analyze image for issues
    const issues = analyzeImageForDisability(disability);
    if (issues.length > 0) {
        item.classList.add('warning');
        const issuesList = document.createElement('ul');
        issuesList.style.marginTop = '0.5rem';
        issuesList.style.paddingLeft = '1.5rem';
        issues.forEach(issue => {
            const li = document.createElement('li');
            li.textContent = issue;
            issuesList.appendChild(li);
        });
        description.appendChild(issuesList);
    } else {
        item.classList.add('success');
    }
    
    item.appendChild(title);
    item.appendChild(description);
    
    return item;
}

function analyzeImageForDisability(disability) {
    const issues = [];
    
    if (!currentImage) return issues;
    
    // Create temporary canvas for analysis
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = currentImage.width;
    canvas.height = currentImage.height;
    ctx.drawImage(currentImage, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    switch(disability) {
        case 'protanopia':
        case 'deuteranopia':
        case 'tritanopia':
            issues.push(...analyzeColorContrast(data, disability));
            break;
        case 'achromatopsia':
            issues.push(...analyzeGrayscaleContrast(data));
            break;
        case 'lowContrast':
            issues.push(...analyzeLowContrastIssues(data));
            break;
        case 'lowVision':
            issues.push(...analyzeLowVisionIssues(data));
            break;
        case 'epilepsy':
            issues.push(...analyzePhotosensitivity(data));
            break;
        case 'flashingContent':
            issues.push(...analyzeFlashingContent(data));
            break;
    }
    
    return issues;
}

// WCAG Contrast Calculation Functions
function sRGBtoLinear(colorChannel) {
    // Convert 8-bit color value to 0-1 range
    const c = colorChannel / 255;
    
    // Apply sRGB gamma correction
    if (c <= 0.03928) {
        return c / 12.92;
    } else {
        return Math.pow((c + 0.055) / 1.055, 2.4);
    }
}

function getRelativeLuminance(r, g, b) {
    // Convert RGB to relative luminance using WCAG formula
    const rLinear = sRGBtoLinear(r);
    const gLinear = sRGBtoLinear(g);
    const bLinear = sRGBtoLinear(b);
    
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

function getContrastRatio(lum1, lum2) {
    // Calculate WCAG contrast ratio
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
}

function analyzeWCAGContrast(data) {
    // Comprehensive WCAG contrast analysis
    const results = {
        AA_normal: { pass: 0, fail: 0, threshold: 4.5 },
        AA_large: { pass: 0, fail: 0, threshold: 3.0 },
        AAA_normal: { pass: 0, fail: 0, threshold: 7.0 },
        AAA_large: { pass: 0, fail: 0, threshold: 4.5 },
        nonText: { pass: 0, fail: 0, threshold: 3.0 },
        ratios: []
    };
    
    const sampleSize = 50;
    const neighborDistance = 20; // pixels to check against
    
    // Sample pixels across the image
    for (let i = 0; i < data.length; i += sampleSize * 4) {
        if (i + neighborDistance * 4 >= data.length) break;
        
        const r1 = data[i];
        const g1 = data[i + 1];
        const b1 = data[i + 2];
        
        // Check against neighboring pixel
        const nextIndex = i + neighborDistance * 4;
        const r2 = data[nextIndex];
        const g2 = data[nextIndex + 1];
        const b2 = data[nextIndex + 2];
        
        const lum1 = getRelativeLuminance(r1, g1, b1);
        const lum2 = getRelativeLuminance(r2, g2, b2);
        const ratio = getContrastRatio(lum1, lum2);
        
        results.ratios.push(ratio);
        
        // Test against all thresholds
        if (ratio >= results.AA_normal.threshold) {
            results.AA_normal.pass++;
        } else {
            results.AA_normal.fail++;
        }
        
        if (ratio >= results.AA_large.threshold) {
            results.AA_large.pass++;
        } else {
            results.AA_large.fail++;
        }
        
        if (ratio >= results.AAA_normal.threshold) {
            results.AAA_normal.pass++;
        } else {
            results.AAA_normal.fail++;
        }
        
        if (ratio >= results.AAA_large.threshold) {
            results.AAA_large.pass++;
        } else {
            results.AAA_large.fail++;
        }
        
        if (ratio >= results.nonText.threshold) {
            results.nonText.pass++;
        } else {
            results.nonText.fail++;
        }
    }
    
    // Calculate statistics
    results.avgRatio = results.ratios.reduce((a, b) => a + b, 0) / results.ratios.length;
    results.minRatio = Math.min(...results.ratios);
    results.maxRatio = Math.max(...results.ratios);
    
    return results;
}

function analyzeColorContrast(data, type) {
    const issues = [];
    const results = analyzeWCAGContrast(data);
    
    // Calculate pass rates
    const totalSamples = results.AA_normal.pass + results.AA_normal.fail;
    const aaPassRate = (results.AA_normal.pass / totalSamples) * 100;
    const aaaPassRate = (results.AAA_normal.pass / totalSamples) * 100;
    
    // Generate detailed report
    issues.push(`Average contrast ratio: ${results.avgRatio.toFixed(2)}:1 (Min: ${results.minRatio.toFixed(2)}:1, Max: ${results.maxRatio.toFixed(2)}:1)`);
    
    if (aaPassRate < 70) {
        issues.push(`⚠️ WCAG AA Normal Text (4.5:1): Only ${aaPassRate.toFixed(0)}% of sampled areas pass. Significant contrast issues for ${getDisabilityLabel(type)}.`);
    } else if (aaPassRate < 90) {
        issues.push(`⚠️ WCAG AA Normal Text (4.5:1): ${aaPassRate.toFixed(0)}% pass rate. Some areas may have insufficient contrast.`);
    } else {
        issues.push(`✓ WCAG AA Normal Text (4.5:1): ${aaPassRate.toFixed(0)}% pass rate. Good contrast for most content.`);
    }
    
    if (aaaPassRate < 50) {
        issues.push(`WCAG AAA Normal Text (7:1): ${aaaPassRate.toFixed(0)}% pass rate. Enhanced contrast recommended for critical content.`);
    } else {
        issues.push(`✓ WCAG AAA Normal Text (7:1): ${aaaPassRate.toFixed(0)}% pass rate. Excellent contrast detected.`);
    }
    
    return issues;
}

function analyzeGrayscaleContrast(data) {
    const issues = [];
    const results = analyzeWCAGContrast(data);
    
    const totalSamples = results.AA_normal.pass + results.AA_normal.fail;
    const aaPassRate = (results.AA_normal.pass / totalSamples) * 100;
    const aaLargePassRate = (results.AA_large.pass / totalSamples) * 100;
    const aaaPassRate = (results.AAA_normal.pass / totalSamples) * 100;
    
    issues.push(`Average grayscale contrast: ${results.avgRatio.toFixed(2)}:1`);
    
    if (aaPassRate < 60) {
        issues.push(`⚠️ Critical: Only ${aaPassRate.toFixed(0)}% meets WCAG AA (4.5:1). Content is difficult to distinguish for users with total color blindness.`);
    } else if (aaPassRate < 85) {
        issues.push(`⚠️ WCAG AA (4.5:1): ${aaPassRate.toFixed(0)}% pass rate. Some content may be challenging in grayscale.`);
    } else {
        issues.push(`✓ WCAG AA (4.5:1): ${aaPassRate.toFixed(0)}% pass rate. Good grayscale contrast.`);
    }
    
    if (aaaPassRate >= 70) {
        issues.push(`✓ WCAG AAA (7:1): ${aaaPassRate.toFixed(0)}% pass rate. Excellent contrast for grayscale viewing.`);
    }
    
    return issues;
}

function analyzePhotosensitivity(data) {
    const issues = [];
    
    // Analyze brightness variation and high contrast patterns
    let highContrastPixels = 0;
    let brightPixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        
        if (brightness > 200) {
            brightPixels++;
        }
        
        if (i > 0) {
            const prevBrightness = (data[i - 4] + data[i - 3] + data[i - 2]) / 3;
            if (Math.abs(brightness - prevBrightness) > 150) {
                highContrastPixels++;
            }
        }
    }
    
    const totalPixels = data.length / 4;
    const highContrastRatio = highContrastPixels / totalPixels;
    const brightRatio = brightPixels / totalPixels;
    
    if (highContrastRatio > 0.15) {
        issues.push('High contrast patterns detected. Rapid transitions may trigger photosensitive responses.');
    }
    
    if (brightRatio > 0.6) {
        issues.push('Image contains large bright areas which may contribute to photosensitivity issues.');
    }
    
    if (issues.length === 0) {
        issues.push('No immediate photosensitivity concerns detected in static image. Note: Animation and flashing cannot be assessed from static images.');
    }
    
    return issues;
}

function analyzeLowContrastIssues(data) {
    const issues = [];
    const results = analyzeWCAGContrast(data);
    
    const totalSamples = results.AA_normal.pass + results.AA_normal.fail;
    
    // Calculate pass rates for each WCAG level
    const aaPassRate = (results.AA_normal.pass / totalSamples) * 100;
    const aaLargePassRate = (results.AA_large.pass / totalSamples) * 100;
    const aaaPassRate = (results.AAA_normal.pass / totalSamples) * 100;
    const aaaLargePassRate = (results.AAA_large.pass / totalSamples) * 100;
    const nonTextPassRate = (results.nonText.pass / totalSamples) * 100;
    
    issues.push(`**Contrast Analysis Summary**`);
    issues.push(`Average ratio: ${results.avgRatio.toFixed(2)}:1 (Range: ${results.minRatio.toFixed(2)}:1 - ${results.maxRatio.toFixed(2)}:1)`);
    issues.push(``);
    
    // WCAG AA - Normal Text (4.5:1)
    if (aaPassRate < 60) {
        issues.push(`❌ WCAG AA Normal Text (4.5:1): ${aaPassRate.toFixed(0)}% pass - FAILS. Text readability severely compromised.`);
    } else if (aaPassRate < 85) {
        issues.push(`⚠️ WCAG AA Normal Text (4.5:1): ${aaPassRate.toFixed(0)}% pass - Marginal. Improve contrast for better accessibility.`);
    } else {
        issues.push(`✓ WCAG AA Normal Text (4.5:1): ${aaPassRate.toFixed(0)}% pass - PASSES. Minimum standard met.`);
    }
    
    // WCAG AA - Large Text (3:1)
    if (aaLargePassRate >= 85) {
        issues.push(`✓ WCAG AA Large Text (3:1): ${aaLargePassRate.toFixed(0)}% pass - PASSES. Large text (18pt+/14pt+ bold) has sufficient contrast.`);
    } else {
        issues.push(`⚠️ WCAG AA Large Text (3:1): ${aaLargePassRate.toFixed(0)}% pass - Some large text may lack contrast.`);
    }
    
    // WCAG AAA - Normal Text (7:1)
    if (aaaPassRate >= 75) {
        issues.push(`✓ WCAG AAA Normal Text (7:1): ${aaaPassRate.toFixed(0)}% pass - PASSES. Enhanced contrast for critical content.`);
    } else if (aaaPassRate >= 50) {
        issues.push(`⚠️ WCAG AAA Normal Text (7:1): ${aaaPassRate.toFixed(0)}% pass - Consider enhancing contrast for AAA compliance.`);
    } else {
        issues.push(`WCAG AAA Normal Text (7:1): ${aaaPassRate.toFixed(0)}% pass - Enhanced contrast recommended for critical applications.`);
    }
    
    // WCAG AAA - Large Text (4.5:1)
    if (aaaLargePassRate >= 85) {
        issues.push(`✓ WCAG AAA Large Text (4.5:1): ${aaaLargePassRate.toFixed(0)}% pass - PASSES.`);
    }
    
    // Non-text Elements (3:1)
    issues.push(``);
    if (nonTextPassRate >= 85) {
        issues.push(`✓ Non-Text Elements (3:1): ${nonTextPassRate.toFixed(0)}% pass - PASSES. UI components and graphics have adequate contrast.`);
    } else if (nonTextPassRate >= 70) {
        issues.push(`⚠️ Non-Text Elements (3:1): ${nonTextPassRate.toFixed(0)}% pass - Some UI elements may lack sufficient contrast.`);
    } else {
        issues.push(`❌ Non-Text Elements (3:1): ${nonTextPassRate.toFixed(0)}% pass - FAILS. Icons, buttons, and UI elements need better contrast.`);
    }
    
    return issues;
}

function analyzeLowVisionIssues(data) {
    const issues = [];
    
    // Analyze text size indicators and detail level
    let highFrequencyContent = 0;
    let totalSamples = 0;
    
    // Check for fine details that may be lost with low vision
    for (let i = 0; i < data.length - 8; i += 200) {
        const diff1 = Math.abs(data[i] - data[i + 4]);
        const diff2 = Math.abs(data[i + 1] - data[i + 5]);
        const diff3 = Math.abs(data[i + 2] - data[i + 6]);
        
        const totalDiff = diff1 + diff2 + diff3;
        if (totalDiff > 50) {
            highFrequencyContent++;
        }
        totalSamples++;
    }
    
    const detailRatio = highFrequencyContent / totalSamples;
    
    if (detailRatio > 0.4) {
        issues.push('High level of fine detail detected. Users with low vision may lose important information. Consider using larger, bolder elements.');
    } else if (detailRatio > 0.25) {
        issues.push('Moderate detail level. Ensure critical content uses sufficient size and weight for low vision users.');
    } else {
        issues.push('Content appears to have good visual simplicity for low vision users.');
    }
    
    return issues;
}

function analyzeFlashingContent(data) {
    const issues = [];
    
    // For static images, analyze patterns that could flash in animated contexts
    let redCount = 0;
    let saturatedCount = 0;
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Check for saturated red (often used in warnings/alerts that might flash)
        if (r > 200 && g < 100 && b < 100) {
            redCount++;
        }
        
        // Check for highly saturated colors
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max > 0 ? (max - min) / max : 0;
        
        if (saturation > 0.7 && max > 200) {
            saturatedCount++;
        }
    }
    
    const totalPixels = data.length / 4;
    const redRatio = redCount / totalPixels;
    const satRatio = saturatedCount / totalPixels;
    
    if (redRatio > 0.2) {
        issues.push('High proportion of saturated red detected. If animated, avoid flashing red content (most dangerous for photosensitive users).');
    }
    
    if (satRatio > 0.3) {
        issues.push('High saturation levels detected. If this content flashes or animates, ensure frequency stays below 3 flashes per second.');
    }
    
    if (issues.length === 0) {
        issues.push('Color usage appears safe for animated content. Remember: no more than 3 flashes per second, avoid red flashing.');
    }
    
    return issues;
}

// Utility functions
function getDisabilityLabel(disability) {
    const labels = {
        'protanopia': 'Protanopia (Red-Blind)',
        'deuteranopia': 'Deuteranopia (Green-Blind)',
        'tritanopia': 'Tritanopia (Blue-Blind)',
        'achromatopsia': 'Achromatopsia (Total Color Blind)',
        'lowContrast': 'Low Contrast Analysis',
        'lowVision': 'Low Vision Simulation',
        'epilepsy': 'Photosensitive Epilepsy',
        'flashingContent': 'Flashing Content Detection'
    };
    return labels[disability] || disability;
}

function getDisabilityDescription(disability) {
    const descriptions = {
        'protanopia': 'Affects ~1% of males. Reduced sensitivity to red light, difficulty distinguishing red-green colors.',
        'deuteranopia': 'Affects ~1% of males. Reduced sensitivity to green light, difficulty distinguishing red-green colors.',
        'tritanopia': 'Rare condition affecting ~0.001% of people. Reduced sensitivity to blue light, difficulty distinguishing blue-yellow colors.',
        'achromatopsia': 'Very rare condition. Complete inability to perceive color, seeing the world in grayscale.',
        'lowContrast': 'Analyzes contrast ratios to ensure text and UI elements meet WCAG accessibility standards (4.5:1 for AA, 7:1 for AAA).',
        'lowVision': 'Simulates impaired vision with reduced sharpness and clarity. Affects millions globally, particularly older adults.',
        'epilepsy': 'Checks for patterns and contrast that may trigger photosensitive epileptic seizures in susceptible individuals (~3% of epilepsy patients).',
        'flashingContent': 'Analyzes color saturation and patterns that could be problematic if animated. Flashing content must stay below 3 flashes per second.'
    };
    return descriptions[disability] || '';
}

// Reset function
function resetApp() {
    currentImage = null;
    
    // Reset drop zone
    const dropZone = document.getElementById('dropZone');
    dropZone.classList.remove('compact');
    dropZone.style.display = 'flex';
    
    // Hide preview
    const preview = document.getElementById('imagePreview');
    preview.style.display = 'none';
    
    document.getElementById('resultsContainer').style.display = 'none';
    document.getElementById('fileInput').value = '';
    document.getElementById('analyzeButton').disabled = true;
    document.getElementById('sliderComparison').checked = false;
    
    // Reset to defaults
    analysisMode = 'single';
    document.querySelector('input[value="single"]').checked = true;
    updateDisabilityOptions();
}

// Knowledge Base Functions
function openKnowledgeBase() {
    const modal = document.getElementById('knowledgeBaseModal');
    modal.style.display = 'flex';
    showKnowledgeBaseCategory('overview');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeKnowledgeBase() {
    const modal = document.getElementById('knowledgeBaseModal');
    modal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
}

function handleKnowledgeBaseNav(e) {
    // Remove active class from all buttons
    document.querySelectorAll('.kb-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    e.target.classList.add('active');
    
    // Show content for selected category
    const category = e.target.dataset.category;
    showKnowledgeBaseCategory(category);
}

function showKnowledgeBaseCategory(category) {
    // Hide all sections
    document.querySelectorAll('.kb-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    const selectedSection = document.querySelector(`.kb-section[data-category="${category}"]`);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }
}
