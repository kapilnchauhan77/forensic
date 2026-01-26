# Clario API Reference

Complete API documentation for the Clario Forensic Fingerprint Analysis Platform.

## Base URL

```
/api/v1
```

## Authentication

The API uses **Bearer token authentication** (JWT). Include the token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Roles & Permissions

| Role | Permissions |
|------|-------------|
| `readonly` | View cases, exhibits, fingerprints |
| `technician` | All readonly + create/update cases, exhibits, upload/process fingerprints |
| `examiner` | All technician + analysis features |
| `admin` | Full system access + user management, pipeline configuration |

---

## Authentication Endpoints

### Register User

```http
POST /auth/register
```

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "agency": "FBI",
  "password": "securePassword123",
  "role": "technician"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "agency": "FBI",
  "role": "technician",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "last_login": null,
  "auth_provider": "local",
  "profile_picture": null
}
```

### Login

```http
POST /auth/login
```

Authenticate with username and password.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "role": "technician",
    "is_active": true
  }
}
```

### Get Current User

```http
GET /auth/me
```

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "agency": "FBI",
  "role": "technician",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "last_login": "2024-01-20T14:25:00Z",
  "auth_provider": "local",
  "profile_picture": null
}
```

### Google OAuth - Get Authorization URL

```http
GET /auth/google/authorize
```

Generate Google OAuth authorization URL with CSRF state.

**Response:** `200 OK`
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "csrf_state_token"
}
```

### Google OAuth - Callback

```http
POST /auth/google/callback
```

Exchange Google auth code for tokens.

**Request Body:**
```json
{
  "code": "google_authorization_code",
  "state": "csrf_state_token"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": { ... },
  "is_new_user": true,
  "pending_approval": false
}
```

---

## Users API

### List Users

```http
GET /users
```

**Auth Required:** Admin only

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skip` | integer | 0 | Number of records to skip |
| `limit` | integer | 100 | Max records to return (max 100) |

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "agency": "FBI",
    "role": "technician",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "last_login": "2024-01-20T14:25:00Z",
    "auth_provider": "local",
    "profile_picture": null
  }
]
```

### Get User

```http
GET /users/{user_id}
```

**Auth Required:** Admin only

**Response:** `200 OK` - User object

### Create User

```http
POST /users
```

**Auth Required:** Admin only

**Request Body:** Same as Register

**Response:** `201 Created` - User object

### Update User

```http
PATCH /users/{user_id}
```

**Auth Required:** Admin only

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "username": "newusername",
  "full_name": "New Name",
  "agency": "CIA",
  "role": "examiner",
  "is_active": true
}
```

All fields are optional.

**Response:** `200 OK` - Updated user object

### Delete User

```http
DELETE /users/{user_id}
```

**Auth Required:** Admin only (cannot delete own account)

**Response:** `204 No Content`

---

## Cases API

### List Cases

```http
GET /cases
```

**Auth Required:** Yes

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (min: 1) |
| `page_size` | integer | 20 | Items per page (1-100) |
| `status_filter` | string | null | Filter by status: `ACTIVE`, `CLOSED`, `ARCHIVED` |
| `search` | string | null | Search in case_number, title, agency |

**Response:** `200 OK`
```json
{
  "cases": [
    {
      "id": "uuid",
      "case_number": "2024-001",
      "title": "Bank Robbery Investigation",
      "description": "Fingerprint evidence from main vault",
      "agency": "FBI",
      "source_type": "CRIME_SCENE",
      "status": "ACTIVE",
      "operator_id": "uuid",
      "operator_name": "John Doe",
      "external_reference": "FBI-2024-1234",
      "notes": "Priority case",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:25:00Z",
      "exhibit_count": 5,
      "fingerprint_count": 23
    }
  ],
  "total": 150,
  "page": 1,
  "page_size": 20
}
```

### Get Case

```http
GET /cases/{case_id}
```

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "case_number": "2024-001",
  "title": "Bank Robbery Investigation",
  "description": "Fingerprint evidence from main vault",
  "agency": "FBI",
  "source_type": "CRIME_SCENE",
  "status": "ACTIVE",
  "operator_id": "uuid",
  "operator_name": "John Doe",
  "external_reference": "FBI-2024-1234",
  "notes": "Priority case",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:25:00Z",
  "exhibit_count": 5,
  "fingerprint_count": 23,
  "exhibits": [
    {
      "id": "uuid",
      "exhibit_number": "EX-001",
      "description": "Door handle swab",
      "fingerprint_count": 3
    }
  ]
}
```

### Create Case

```http
POST /cases
```

**Auth Required:** Technician or higher

**Request Body:**
```json
{
  "case_number": "2024-001",
  "title": "Bank Robbery Investigation",
  "description": "Fingerprint evidence from main vault",
  "agency": "FBI",
  "source_type": "CRIME_SCENE",
  "external_reference": "FBI-2024-1234",
  "notes": "Priority case"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `case_number` | Yes | Unique case identifier |
| `title` | Yes | Case title |
| `description` | No | Detailed description |
| `agency` | No | Handling agency |
| `source_type` | No | One of: `OTHER`, `CRIME_SCENE`, `VICTIM`, `SUSPECT`, `REFERENCE` |
| `external_reference` | No | External system ID |
| `notes` | No | Additional notes |

**Response:** `201 Created` - Case object

### Update Case

```http
PATCH /cases/{case_id}
```

**Auth Required:** Technician or higher

**Request Body:** Same as Create (all fields optional)

**Response:** `200 OK` - Updated case object

### Delete Case

```http
DELETE /cases/{case_id}
```

**Auth Required:** Technician or higher

**Note:** Deletes all exhibits and fingerprints within the case.

**Response:** `204 No Content`

---

## Exhibits API

### List Exhibits for Case

```http
GET /exhibits/case/{case_id}
```

**Auth Required:** Yes

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "exhibit_number": "EX-001",
    "description": "Door handle swab",
    "location_collected": "Main entrance",
    "collection_date": "2024-01-14T09:00:00Z",
    "collector_name": "Officer Smith",
    "case_id": "uuid",
    "sequence_order": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "fingerprint_count": 3
  }
]
```

### Get Exhibit

```http
GET /exhibits/{exhibit_id}
```

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "exhibit_number": "EX-001",
  "description": "Door handle swab",
  "location_collected": "Main entrance",
  "collection_date": "2024-01-14T09:00:00Z",
  "collector_name": "Officer Smith",
  "case_id": "uuid",
  "sequence_order": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "fingerprints": [
    {
      "id": "uuid",
      "original_filename": "print_001.png",
      "status": "COMPLETED",
      "quality_score": 78.5,
      "pattern_type": "LOOP"
    }
  ]
}
```

### Create Exhibit

```http
POST /exhibits
```

**Auth Required:** Technician or higher

**Request Body:**
```json
{
  "case_id": "uuid",
  "exhibit_number": "EX-001",
  "description": "Door handle swab",
  "location_collected": "Main entrance",
  "collection_date": "2024-01-14T09:00:00Z",
  "collector_name": "Officer Smith"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `case_id` | Yes | Parent case UUID |
| `exhibit_number` | Yes | Exhibit designation |
| `description` | No | Exhibit description |
| `location_collected` | No | Collection location |
| `collection_date` | No | Date/time collected |
| `collector_name` | No | Collector's name |

**Response:** `201 Created` - Exhibit object

### Update Exhibit

```http
PATCH /exhibits/{exhibit_id}
```

**Auth Required:** Technician or higher

**Response:** `200 OK` - Updated exhibit object

### Delete Exhibit

```http
DELETE /exhibits/{exhibit_id}
```

**Auth Required:** Technician or higher

**Note:** Deletes all fingerprints within the exhibit.

**Response:** `204 No Content`

---

## Fingerprints API

### Upload Fingerprint

```http
POST /fingerprints/upload/{exhibit_id}
```

**Auth Required:** Technician or higher

**Content-Type:** `multipart/form-data`

**Form Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | file | Yes | Image file (PNG, JPG, JPEG, GIF, BMP, TIFF) |
| `print_type` | string | No | `UNKNOWN`, `ROLLED`, `PLAIN` (default: `UNKNOWN`) |

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "original_filename": "fingerprint_001.png",
  "original_hash_sha256": "abc123...",
  "file_size_bytes": 245678,
  "status": "PENDING",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Batch Upload Fingerprints

```http
POST /fingerprints/upload-batch/{exhibit_id}
```

**Auth Required:** Technician or higher

**Content-Type:** `multipart/form-data`

**Form Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `files` | file[] | Yes | Multiple image files |
| `print_type` | string | No | Print type for all files |

**Response:** `200 OK`
```json
{
  "successful": [
    {
      "id": "uuid",
      "original_filename": "print_001.png",
      "status": "PENDING"
    }
  ],
  "failed": [
    {
      "filename": "invalid.txt",
      "error": "Unsupported file format"
    }
  ],
  "total_uploaded": 5,
  "total_failed": 1
}
```

### Get Fingerprint

```http
GET /fingerprints/{fingerprint_id}
```

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "original_filename": "print_001.png",
  "original_hash_sha256": "abc123...",
  "original_url": "https://presigned-url...",
  "file_size_bytes": 245678,
  "mime_type": "image/png",
  "image_width": 500,
  "image_height": 500,
  "dpi": 500,
  "print_type": "ROLLED",
  "finger_position": "RIGHT_INDEX",
  "status": "COMPLETED",
  "quality_score": 78.5,
  "quality_issues": [
    {
      "type": "LOW_CONTRAST",
      "severity": "medium",
      "message": "Image contrast below optimal level"
    }
  ],
  "pattern_type": "LOOP",
  "pattern_subtype": "ULNAR_LOOP",
  "pattern_confidence": 0.92,
  "classification_rationale": "Clear ulnar loop pattern with single delta...",
  "evidence_type": "LATENT",
  "detail_level": "LEVEL_2",
  "ncic_code": "PM",
  "henry_value": 8,
  "ridge_count": 12,
  "core_count": 1,
  "delta_count": 1,
  "core_positions": [{"x": 0.45, "y": 0.35, "type": "loop_core"}],
  "delta_positions": [{"x": 0.75, "y": 0.65}],
  "minutiae_count": 45,
  "minutiae_details": {
    "ridge_ending": 22,
    "bifurcation": 18,
    "short_ridge": 3,
    "dot": 2
  },
  "ridge_flow_direction": "left_slant",
  "ridge_density": 12.5,
  "multiple_fingerprints": false,
  "exhibit_id": "uuid",
  "created_at": "2024-01-15T10:30:00Z",
  "processed_at": "2024-01-15T10:32:00Z",
  "processing_results": [
    {
      "id": "uuid",
      "enhanced_url": "https://presigned-url...",
      "enhancement_preset": "rolled_plain",
      "enhancement_method": "gemini",
      "quality_score_before": 65.0,
      "quality_score_after": 78.5,
      "quality_improvement": 13.5,
      "artifact_risk_level": "low",
      "is_primary": true,
      "created_at": "2024-01-15T10:32:00Z"
    }
  ],
  "ridge_orientation_map_url": "https://presigned-url...",
  "rationale_overlay_url": "https://presigned-url..."
}
```

### Process Fingerprint

```http
POST /fingerprints/{fingerprint_id}/process
```

**Auth Required:** Technician or higher

Queue fingerprint for initial processing.

**Request Body:**
```json
{
  "enhancement_preset": "rolled_plain",
  "generate_variants": true,
  "force_process": false
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enhancement_preset` | string | `rolled_plain` | Preset: `rolled_plain`, `latent`, `aggressive` |
| `generate_variants` | boolean | `true` | Generate alternative enhancements |
| `force_process` | boolean | `false` | Process even if already completed |

**Response:** `200 OK` - Updated fingerprint object with status `QUEUED`

### Reprocess Fingerprint

```http
POST /fingerprints/{fingerprint_id}/reprocess
```

**Auth Required:** Technician or higher

Reprocess with different settings.

**Request Body:**
```json
{
  "enhancement_preset": "latent",
  "enhancement_method": "opencv",
  "force": true
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enhancement_preset` | string | null | Override preset |
| `enhancement_method` | string | `auto` | `auto`, `gemini`, `opencv` |
| `force` | boolean | `false` | Force reprocessing |

**Response:** `200 OK` - Updated fingerprint object

### Download Original Image

```http
GET /fingerprints/{fingerprint_id}/original
```

**Auth Required:** Yes

**Response:** Binary image file with appropriate Content-Type

### Download Enhanced Image

```http
GET /fingerprints/{fingerprint_id}/enhanced/{result_id}
```

**Auth Required:** Yes

**Response:** Binary PNG image file

### Delete Fingerprint

```http
DELETE /fingerprints/{fingerprint_id}
```

**Auth Required:** Technician or higher

**Note:** Original files are retained in storage for forensic integrity.

**Response:** `204 No Content`

---

## Pipeline API

### List Pipeline Configs

```http
GET /pipeline/configs
```

**Auth Required:** Yes

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `active_only` | boolean | `true` | Only return active configs |

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "rolled_plain",
    "display_name": "Rolled/Plain Prints",
    "description": "Standard enhancement for high-quality prints",
    "config": {
      "denoise": { "enabled": true, "method": "bilateral", "d": 5 },
      "contrast": { "enabled": true, "method": "clahe", "clip_limit": 2.0 },
      "gabor_filter": { "enabled": true, "ksize": 21 },
      "sharpening": { "enabled": true }
    },
    "artifact_risk_level": "low",
    "is_default": true,
    "is_active": true,
    "version": "1.0.0",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### Get Pipeline Config

```http
GET /pipeline/configs/{config_id}
```

**Auth Required:** Yes

**Response:** `200 OK` - Pipeline config object

### Create Pipeline Config

```http
POST /pipeline/configs
```

**Auth Required:** Admin only

**Request Body:**
```json
{
  "name": "custom_latent",
  "display_name": "Custom Latent Enhancement",
  "description": "Optimized for partial latent prints",
  "config": {
    "denoise": { "enabled": true, "method": "nlm", "h": 10 },
    "contrast": { "enabled": true, "method": "clahe", "clip_limit": 3.5 }
  },
  "artifact_risk_level": "medium"
}
```

**Response:** `201 Created` - Pipeline config object

### Update Pipeline Config

```http
PATCH /pipeline/configs/{config_id}
```

**Auth Required:** Admin only

**Request Body:** (all fields optional)
```json
{
  "display_name": "Updated Name",
  "description": "Updated description",
  "config": { ... },
  "artifact_risk_level": "high",
  "is_active": false
}
```

**Response:** `200 OK` - Updated pipeline config object

### List Pipeline Versions

```http
GET /pipeline/versions
```

**Auth Required:** Yes

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "version": "1.0.0",
    "description": "Initial release",
    "steps": ["normalize", "quality_assess", "enhance", "classify"],
    "gemini_model": "gemini-2.5-pro",
    "is_current": true,
    "is_deprecated": false,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Get Current Pipeline Version

```http
GET /pipeline/versions/current
```

**Auth Required:** Yes

**Response:** `200 OK` - Current pipeline version object

---

## Export API

### Download Evidence Pack

```http
GET /export/case/{case_id}/evidence-pack
```

**Auth Required:** Yes

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `include_originals` | boolean | `true` | Include original images |
| `include_enhanced` | boolean | `true` | Include enhanced images |

**Response:** `200 OK`

**Content-Type:** `application/zip`

**ZIP Contents:**
```
evidence_pack_CASE-001_20240115/
├── manifest.json           # Case metadata and file listing
├── originals/              # Original fingerprint images
├── enhanced/               # Enhanced images
├── overlays/               # Ridge orientation and rationale overlays
├── processing_reports/     # Individual fingerprint reports (JSON)
└── summary_report.json     # Complete case summary
```

### Get Fingerprint Report

```http
GET /export/fingerprint/{fingerprint_id}/report
```

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "fingerprint_id": "uuid",
  "original_filename": "print_001.png",
  "original_hash_sha256": "abc123...",
  "file_size_bytes": 245678,
  "image_dimensions": {
    "width": 500,
    "height": 500,
    "dpi": 500
  },
  "print_type": "ROLLED",
  "quality_assessment": {
    "score": 78.5,
    "issues": [...]
  },
  "classification": {
    "pattern_type": "LOOP",
    "pattern_subtype": "ULNAR_LOOP",
    "confidence": 0.92,
    "rationale": "..."
  },
  "forensic_data": {
    "ncic_code": "PM",
    "henry_value": 8,
    "ridge_count": 12,
    "core_positions": [...],
    "delta_positions": [...],
    "minutiae_count": 45
  },
  "processing_results": [...],
  "timestamps": {
    "uploaded_at": "2024-01-15T10:30:00Z",
    "processed_at": "2024-01-15T10:32:00Z"
  },
  "report_generated_at": "2024-01-20T14:00:00Z"
}
```

---

## Data Models & Enumerations

### User Roles

| Value | Description |
|-------|-------------|
| `readonly` | View-only access |
| `technician` | Upload and process fingerprints |
| `examiner` | Full analysis capabilities |
| `admin` | System administration |

### Auth Providers

| Value | Description |
|-------|-------------|
| `local` | Username/password authentication |
| `google` | Google OAuth 2.0 |

### Case Status

| Value | Description |
|-------|-------------|
| `ACTIVE` | Active investigation |
| `CLOSED` | Investigation complete |
| `ARCHIVED` | Long-term storage |

### Source Types

| Value | Description |
|-------|-------------|
| `OTHER` | Unspecified source |
| `CRIME_SCENE` | Evidence from crime scene |
| `VICTIM` | Victim exemplar |
| `SUSPECT` | Suspect exemplar |
| `REFERENCE` | Known reference print |

### Processing Status

| Value | Description |
|-------|-------------|
| `PENDING` | Awaiting processing |
| `QUEUED` | In processing queue |
| `PROCESSING` | Currently being processed |
| `COMPLETED` | Processing complete |
| `FAILED` | Processing failed |

### Evidence Types

| Value | Description |
|-------|-------------|
| `LATENT` | Invisible prints requiring development |
| `PATENT` | Visible prints (blood, ink, etc.) |
| `PLASTIC` | 3D impressions in soft materials |
| `UNKNOWN` | Type not determined |

### Print Types

| Value | Description |
|-------|-------------|
| `UNKNOWN` | Type not specified |
| `ROLLED` | Rolled from nail to nail |
| `PLAIN` | Flat impression |
| `SLAP` | Four-finger simultaneous |
| `LATENT_LIFT` | Lifted latent print |
| `PHOTO` | Photographed print |
| `PARTIAL` | Partial impression |

### Pattern Types (Level 1)

| Value | Description |
|-------|-------------|
| `ARCH` | Arch pattern (0 deltas) |
| `LOOP` | Loop pattern (1 delta) |
| `WHORL` | Whorl pattern (2+ deltas) |
| `UNKNOWN` | Pattern not determined |
| `PARTIAL` | Insufficient for classification |
| `NOT_PRESENT` | No fingerprint detected |

### Pattern Subtypes (FBI Classification)

| Value | Description | NCIC Code |
|-------|-------------|-----------|
| `plain_arch` | Smooth wave pattern | AA |
| `tented_arch` | Sharp upward spike | TT |
| `ulnar_loop` | Loop toward little finger | PI/PM/PO |
| `radial_loop` | Loop toward thumb | II/IM/IO |
| `central_pocket_loop` | Loop with whorl center | varies |
| `double_loop` | Two loop formations | varies |
| `plain_whorl` | Circular ridges | WI/WM/WO |
| `central_pocket_whorl` | Whorl with pocket | WI/WM/WO |
| `double_loop_whorl` | Two loop whorls | WI/WM/WO |
| `accidental_whorl` | Irregular whorl | WI/WM/WO |
| `scarred` | Scarred/damaged | SR |
| `amputated` | Finger amputated | XX |

### Detail Levels

| Value | Features |
|-------|----------|
| `level_1` | Overall pattern type |
| `level_2` | Minutiae points |
| `level_3` | Pores, ridge shapes |

### Finger Positions

| Value | Description |
|-------|-------------|
| `right_thumb` | Right thumb |
| `right_index` | Right index finger |
| `right_middle` | Right middle finger |
| `right_ring` | Right ring finger |
| `right_little` | Right little finger |
| `left_thumb` | Left thumb |
| `left_index` | Left index finger |
| `left_middle` | Left middle finger |
| `left_ring` | Left ring finger |
| `left_little` | Left little finger |
| `unknown` | Position not specified |

---

## Error Responses

### Error Format

All errors follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `400 Bad Request` | Invalid request parameters |
| `401 Unauthorized` | Missing or invalid authentication |
| `403 Forbidden` | Insufficient permissions |
| `404 Not Found` | Resource not found |
| `409 Conflict` | Resource conflict (e.g., duplicate) |
| `422 Unprocessable Entity` | Validation error |
| `500 Internal Server Error` | Server error |
| `503 Service Unavailable` | Service not configured (e.g., OAuth) |

### Common Error Examples

**Invalid credentials:**
```json
{
  "detail": "Incorrect username or password"
}
```

**Insufficient permissions:**
```json
{
  "detail": "Admin role required"
}
```

**Resource not found:**
```json
{
  "detail": "Case not found"
}
```

**Validation error:**
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

---

## Rate Limiting

Currently no rate limiting is enforced. For production deployments, consider implementing:
- Per-user API quotas
- Batch processing limits
- Concurrent request limits

---

## Webhooks (Future)

Webhook support for processing completion notifications is planned for future releases.

---

## SDK Examples

### Python (requests)

```python
import requests

BASE_URL = "http://localhost:8000/api/v1"

# Login
response = requests.post(f"{BASE_URL}/auth/login", json={
    "username": "admin",
    "password": "admin123"
})
token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Create case
case = requests.post(f"{BASE_URL}/cases", json={
    "case_number": "2024-001",
    "title": "Test Case"
}, headers=headers).json()

# Upload fingerprint
with open("fingerprint.png", "rb") as f:
    response = requests.post(
        f"{BASE_URL}/fingerprints/upload/{exhibit_id}",
        files={"file": f},
        data={"print_type": "ROLLED"},
        headers=headers
    )
```

### JavaScript (fetch)

```javascript
const BASE_URL = 'http://localhost:8000/api/v1';

// Login
const loginRes = await fetch(`${BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
});
const { access_token } = await loginRes.json();

// Get cases
const cases = await fetch(`${BASE_URL}/cases`, {
  headers: { 'Authorization': `Bearer ${access_token}` }
}).then(r => r.json());
```

---

## Changelog

### v1.0.0
- Initial API release
- Authentication (local + Google OAuth)
- Full CRUD for cases, exhibits, fingerprints
- Processing pipeline with Gemini AI
- Export functionality
