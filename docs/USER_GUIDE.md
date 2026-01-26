# Clario User Guide

Complete user documentation for the Clario Forensic Fingerprint Analysis Platform.

## Getting Started

### Accessing the Application

1. Open your web browser and navigate to your Clario instance URL
2. You will see the login page

### Logging In

**Local Account:**
1. Enter your username
2. Enter your password
3. Click "Sign In"

**Google Account:**
1. Click "Sign in with Google"
2. Select your Google account
3. Grant permission if prompted
4. You may need administrator approval for first-time logins

### First Time Setup

After your first login:
1. Navigate to Settings to verify your profile
2. Familiarize yourself with the navigation menu
3. Review available cases or create your first case

---

## Interface Overview

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────┐
│  CLARIO                                    [Theme] [Date]   │
├─────────────┬───────────────────────────────────────────────┤
│             │                                               │
│  Dashboard  │                                               │
│  Cases      │              Main Content Area                │
│  Learning   │                                               │
│  Settings   │                                               │
│             │                                               │
│  [Users]*   │                                               │
│             │                                               │
│  ─────────  │                                               │
│  [User]     │                                               │
│  [Logout]   │                                               │
└─────────────┴───────────────────────────────────────────────┘

* Admin only
```

### Mobile Layout

On mobile devices:
- Navigation is accessible via hamburger menu (top-left)
- Bottom navigation bar provides quick access to main sections
- All features are touch-optimized

### Navigation Menu

| Menu Item | Description | Access |
|-----------|-------------|--------|
| Dashboard | Overview and statistics | All users |
| Cases | Case management | All users |
| Learning | Training modules | All users |
| Settings | Profile settings | All users |
| Users | User management | Admin only |

---

## Case Management

### Viewing Cases

1. Click **Cases** in the navigation menu
2. View the list of all cases you have access to
3. Use the search bar to find specific cases
4. Filter by status using the dropdown

**Case List Information:**
- Case Number
- Title
- Agency
- Status (Active, Closed, Archived)
- Exhibit count
- Fingerprint count
- Created date

### Creating a Case

1. Click **+ New Case** button
2. Fill in the required fields:
   - **Case Number**: Unique identifier (e.g., "2024-001")
   - **Title**: Descriptive case name
3. Optional fields:
   - **Description**: Detailed case information
   - **Agency**: Handling organization
   - **Source Type**: Evidence origin
   - **External Reference**: ID from other systems
   - **Notes**: Additional comments
4. Click **Create Case**

### Viewing Case Details

1. Click on a case row to open case details
2. View case information and metadata
3. See list of exhibits associated with the case
4. View fingerprint statistics

### Editing a Case

1. Open the case details
2. Click the **Edit** button
3. Modify the desired fields
4. Click **Save Changes**

### Case Status

| Status | Description |
|--------|-------------|
| Active | Currently under investigation |
| Closed | Investigation complete |
| Archived | Long-term storage |

---

## Exhibit Management

### Understanding Exhibits

Exhibits are physical evidence containers within a case. Each exhibit can contain multiple fingerprint images.

### Creating an Exhibit

1. Navigate to a case's detail page
2. Click **+ Add Exhibit**
3. Fill in the fields:
   - **Exhibit Number**: Designation (e.g., "EX-001", "Exhibit A")
   - **Description**: What the exhibit is
   - **Location Collected**: Where it was found
   - **Collection Date**: When it was collected
   - **Collector Name**: Who collected it
4. Click **Create Exhibit**

### Viewing Exhibit Details

1. Click on an exhibit to open its detail page
2. View exhibit metadata
3. See all fingerprints associated with the exhibit
4. Upload new fingerprint images

---

## Fingerprint Analysis

### Uploading Fingerprints

**Single Upload:**
1. Navigate to an exhibit's detail page
2. Click **Upload Fingerprint** or drag-and-drop a file
3. Select the image file (PNG, JPG, TIFF, BMP supported)
4. Optionally select the print type (Rolled, Plain, Unknown)
5. Click **Upload**

**Batch Upload:**
1. Navigate to an exhibit's detail page
2. Click **Batch Upload** or drag-and-drop multiple files
3. Select multiple image files
4. Set the print type for all files (optional)
5. Click **Upload All**

**Supported Formats:**
- PNG (recommended)
- JPEG/JPG
- TIFF
- BMP
- GIF

**Maximum file size:** 50 MB per image

### Processing Fingerprints

After upload, fingerprints need to be processed for analysis:

1. Click on an uploaded fingerprint
2. Click **Process** to start analysis
3. Select enhancement preset (optional):
   - **Rolled/Plain**: Standard prints (recommended for clear prints)
   - **Latent**: For developed latent prints
   - **Aggressive**: For poor quality prints (may introduce artifacts)
4. Wait for processing to complete

**Processing Steps:**
1. Quality assessment
2. Fingerprint detection
3. Image enhancement
4. Pattern classification
5. Visualization generation

### Understanding Results

After processing, the fingerprint viewer displays:

**Quality Assessment:**
- Overall quality score (0-100)
- Detected issues (blur, noise, contrast, etc.)
- Issue severity levels (high, medium, low)

**Classification Results:**
- **Pattern Type**: Arch, Loop, or Whorl
- **Pattern Subtype**: Detailed FBI classification
- **Confidence**: How certain the classification is (0-100%)
- **Evidence Type**: Latent, Patent, or Plastic
- **Detail Level**: Level 1, 2, or 3 analysis capability

**Forensic Codes:**
- **NCIC Code**: Two-letter FBI code
- **Henry Value**: Numerical classification

**Singular Points:**
- Core count and positions
- Delta count and positions

**Minutiae Data:**
- Total minutiae count
- Breakdown by type (ridge endings, bifurcations, etc.)

### Image Viewing

**View Modes:**
1. **Original**: View the unmodified uploaded image
2. **Enhanced**: View the processed/enhanced image
3. **Compare**: Side-by-side comparison with slider

**Zoom Controls:**
- Use mouse wheel to zoom in/out
- On touch devices, use pinch gesture
- Click zoom buttons for precise control
- Zoom range: 0.25x to 4x

**Fullscreen Mode:**
1. Click the fullscreen button
2. View the image in full viewport
3. Press Escape or click X to exit

**Comparison Slider:**
1. Select "Compare" view mode
2. Drag the slider left/right to reveal original/enhanced
3. Useful for evaluating enhancement quality

### Reprocessing

To analyze a fingerprint with different settings:

1. Click **Reprocess**
2. Select a different enhancement preset
3. Optionally choose enhancement method:
   - **Auto**: System chooses best method
   - **AI (Gemini)**: Use AI-powered enhancement
   - **OpenCV**: Use traditional image processing
4. Click **Start Reprocessing**

Multiple processing results are saved and can be compared.

---

## Export & Reporting

### Evidence Pack Export

Export an entire case as a ZIP file:

1. Navigate to the case detail page
2. Click **Export Evidence Pack**
3. Select options:
   - Include original images
   - Include enhanced images
4. Click **Download**

**ZIP Contents:**
```
evidence_pack_CASE-001/
├── manifest.json           # Case metadata
├── originals/              # Original images
├── enhanced/               # Enhanced images
├── overlays/               # Visualizations
├── processing_reports/     # Individual reports
└── summary_report.json     # Complete summary
```

### Fingerprint Report

Export a single fingerprint's analysis:

1. Open the fingerprint viewer
2. Click **Download Report**
3. A JSON file is downloaded with:
   - File metadata (hash, size, dimensions)
   - Quality assessment results
   - Classification results
   - Processing history
   - Timestamps

---

## Learning System

### Overview

The learning system helps users understand fingerprint classification:

1. Navigate to **Learning** in the menu
2. Browse available learning modules
3. Select a module to begin

### Interactive Case Studies

Case studies provide real-world scenarios:

1. Read the case background
2. View fingerprint images
3. Compare different patterns
4. Complete interactive exercises

### Classification Quizzes

Test your knowledge:

1. Navigate to a quiz module
2. View a fingerprint image
3. Select the correct classification
4. Receive immediate feedback
5. Track your progress

### Drag-and-Drop Puzzles

Practice pattern recognition:

1. View fingerprint features
2. Drag items to correct categories
3. Check your answers
4. Learn from mistakes

---

## User Settings

### Profile Management

1. Navigate to **Settings**
2. View and update your profile:
   - Full name
   - Email address
   - Agency

### Theme Preferences

Toggle between light and dark modes:

1. Click the theme toggle in the header
2. Options:
   - **Light**: Bright background
   - **Dark**: Dark background (reduces eye strain)
   - **System**: Follows your device settings

---

## User Management (Admin)

### Viewing Users

1. Navigate to **Users** (admin only)
2. View list of all users
3. See user details: name, email, role, status

### Creating Users

1. Click **+ Add User**
2. Fill in user details:
   - Email address
   - Username
   - Full name (optional)
   - Agency (optional)
   - Password
   - Role
3. Click **Create User**

### Editing Users

1. Click on a user to view details
2. Click **Edit**
3. Modify fields as needed:
   - Update role to change permissions
   - Toggle active status to enable/disable
4. Click **Save Changes**

### User Roles

| Role | Capabilities |
|------|-------------|
| **Read-only** | View cases, exhibits, fingerprints |
| **Technician** | Create/edit cases, upload fingerprints, process |
| **Examiner** | All technician capabilities + analysis features |
| **Admin** | Full system access + user management |

### Deactivating Users

1. Find the user in the list
2. Click **Edit**
3. Toggle "Active" to off
4. Click **Save**

Deactivated users cannot log in but their data is preserved.

---

## Best Practices

### Image Quality Tips

**For best results:**
- Use at least 500 DPI resolution
- Ensure adequate lighting
- Minimize motion blur
- Avoid compression artifacts (use PNG or TIFF)
- Capture full fingerprint area

**Common quality issues:**
| Issue | Solution |
|-------|----------|
| Blurry image | Use tripod, improve lighting |
| Low contrast | Adjust scanner/camera settings |
| Partial print | Recapture if possible |
| Compression artifacts | Save as PNG instead of JPEG |

### Case Organization

- Use consistent case numbering schemes
- Write clear, descriptive titles
- Document collection metadata accurately
- Organize exhibits logically

### Security Practices

- Log out when leaving your workstation
- Don't share login credentials
- Report suspicious activity to administrators
- Use strong, unique passwords

---

## Troubleshooting

### Common Issues

**Cannot log in:**
- Verify username and password
- Check if your account is active
- Contact administrator if issues persist

**Upload fails:**
- Check file size (max 50 MB)
- Ensure file format is supported
- Try a different browser

**Processing stuck:**
- Wait a few minutes (complex images take longer)
- Refresh the page
- Contact support if stuck over 30 minutes

**Image quality issues detected:**
- Review the quality assessment
- Consider recapturing the print
- Try different enhancement presets

**Classification confidence low:**
- Check image quality
- Try reprocessing with different settings
- Review with manual examination

### Getting Help

If you encounter issues:

1. Check this user guide
2. Contact your system administrator
3. Report bugs through proper channels

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Escape` | Close modal/fullscreen |
| `+` / `-` | Zoom in/out (in viewer) |
| `0` | Reset zoom (in viewer) |
| `1` | View original (in viewer) |
| `2` | View enhanced (in viewer) |
| `3` | Compare view (in viewer) |

---

## Glossary

| Term | Definition |
|------|------------|
| **Arch** | Fingerprint pattern with ridges entering one side and exiting the other |
| **Bifurcation** | Point where a single ridge splits into two |
| **Core** | Central point of a fingerprint pattern |
| **Delta** | Triangular point where three ridge systems meet |
| **Exhibit** | Physical evidence item containing fingerprints |
| **Henry System** | Classification method using numerical values |
| **Latent Print** | Invisible print requiring development |
| **Loop** | Pattern with ridges entering and exiting same side |
| **Minutiae** | Small ridge characteristics used for identification |
| **NCIC Code** | FBI's two-letter pattern classification code |
| **Patent Print** | Visible print made with substance (blood, ink) |
| **Plain Print** | Fingerprint taken without rolling |
| **Plastic Print** | 3D impression in soft material |
| **Ridge Ending** | Point where a ridge stops |
| **Rolled Print** | Fingerprint taken by rolling finger nail-to-nail |
| **Whorl** | Circular pattern with two or more deltas |

---

## Pattern Reference

### Arch Patterns

```
Plain Arch:          Tented Arch:
   ____                  /\
  /    \                /  \
 /      \              /    \
/________\            /______\
```
- No deltas
- Ridges flow from side to side
- Tented arch has upward thrust

### Loop Patterns

```
Ulnar Loop:          Radial Loop:
     ___                  ___
    /   \                /   \
   /     \              /     \
  |   o   |            |   o   |
   \  •  /              \  •  /
    \___/ →              ← \___/
```
- One delta (•)
- One core (o)
- Ulnar: opens toward little finger
- Radial: opens toward thumb

### Whorl Patterns

```
Plain Whorl:         Double Loop:
      ___                 ___
     /   \               /   \
    |  o  |             | o o |
    |     |             |  X  |
     \ • •/              \• •/
      \__/                \__/
```
- Two or more deltas
- Concentric or spiral ridges
- Various subtypes
