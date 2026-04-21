# UX Accessibility Checker

A minimalist web application for evaluating UI/UX interfaces for visual accessibility, focusing on color blindness and photosensitive epilepsy concerns.

## Features

### Visual Disability Analysis (Organized by Category)

#### Color Vision Deficiency
- **Protanopia** (Red-Blind) - Affects ~1% of males
- **Deuteranopia** (Green-Blind) - Affects ~1% of males  
- **Tritanopia** (Blue-Blind) - Rare, ~0.001% of population
- **Achromatopsia** (Total Color Blind) - Very rare condition

#### Contrast & Readability
- **Low Contrast Analysis** - WCAG compliance checking (4.5:1 AA, 7:1 AAA standards)
- **Low Vision Simulation** - Simulates impaired vision with reduced sharpness

#### Seizure & Photosensitivity
- **Photosensitive Epilepsy** - Detects high contrast and brightness patterns
- **Flashing Content Detection** - Analyzes saturation and patterns for animation safety

### Analysis Modes

#### Single Analysis
- Focus on one specific visual disability at a time
- Side-by-side comparison (processed image + original thumbnail)
- Optional slider comparison mode for before/after effect
- Detailed accessibility report

#### Complete Spectrum Analysis
- Analyze multiple disabilities simultaneously
- Grid layout showing original and all selected transformations
- Comprehensive report covering all selected conditions

### User Interface
- **Two-column layout**: Controls on left, image display on right
- **Drag & drop support**: Easy image upload
- **Minimalist design**: Clean, distraction-free interface
- **CSS variables**: Easily customizable theme
- **Responsive**: Adapts to different screen sizes

## Technology Stack

- Pure HTML5, CSS3, JavaScript (No dependencies)
- Canvas API for image processing
- CSS Grid & Flexbox for layouts
- CSS Variables for theming

## Usage

1. Open `index.html` in a modern web browser
2. Select analysis type (Single or Complete Spectrum)
3. Choose visual disability type(s) to analyze
4. Drag and drop an image or click to upload
5. Click "Analyze Image" to process
6. Review the visual comparison and accessibility report
7. Toggle slider comparison mode (Single Analysis only) for interactive before/after

## Color Blindness Simulation

The application uses scientifically-based transformation matrices to simulate how individuals with different types of color vision deficiency perceive colors:

- **Protanopia & Deuteranopia**: Red-green color blindness simulations
- **Tritanopia**: Blue-yellow color blindness simulation  
- **Achromatopsia**: Complete grayscale conversion using luminance weights

## Accessibility Analysis

The tool automatically analyzes images for:
- Contrast ratios and visibility issues
- Color combination problems for specific disabilities
- High contrast patterns that may trigger photosensitivity
- Brightness levels and variations
- Recommendations for improvements

## Design Principles

Built following KISS (Keep It Simple, Stupid) principles:
- No external dependencies or frameworks
- Minimal, semantic HTML
- Organized CSS with clear variable system
- Clean, readable JavaScript with clear function names
- Fast performance with efficient canvas operations

## Browser Compatibility

Works in all modern browsers supporting:
- Canvas API
- CSS Grid
- CSS Variables
- FileReader API

## Future Enhancements

Potential additions:
- Video/animation analysis for epilepsy checks
- WCAG compliance scoring
- Export reports as PDF
- Additional visual impairment simulations
- Batch processing multiple images

## License

MIT License - Free to use and modify

## Credits

Color blindness simulation matrices based on research from:
- Viénot, F., Brettel, H., & Mollon, J. D. (1999)
- Digital image processing for simulating deficient color vision

---

**Note**: This tool provides simulations based on mathematical models. Actual perception may vary between individuals. Always test with real users when possible.
