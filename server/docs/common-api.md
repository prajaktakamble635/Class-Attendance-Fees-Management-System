# Common API Documentation

This document describes the Common APIs available in the GURUKUL Test Series API.

## Base URL

```
/commonApi
```

**Note:** All common APIs require authentication. The `withAdminAuth` middleware is applied to these routes.

---

## API Endpoints

### 1. Get All Board Subject Conditions

Retrieves all records from the board subject conditions table.

**Endpoint:** `GET /commonApi/boardSubjectConditions`

**Authentication:** Required

**Request:**

```http
GET /commonApi/boardSubjectConditions HTTP/1.1
Host: localhost:3000
Cookie: user_auth_token={your_token}
```

**Response:**

**Success (200 OK):**

```json
{
  "success": true,
  "message": "Board subject conditions retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Science Stream",
      "boardIdFk": 1,
      "standardIdFk": 11,
      "mediumIdFk": 1,
      "minSubjectsSelectable": 3,
      "maxSubjectsSelectable": 5,
      "selectionType": "range",
      "conditionMeta": {},
      "extraCondition": null
    },
    {
      "id": 2,
      "name": "Commerce Stream",
      "boardIdFk": 1,
      "standardIdFk": 11,
      "mediumIdFk": 1,
      "minSubjectsSelectable": 4,
      "maxSubjectsSelectable": 6,
      "selectionType": "range",
      "conditionMeta": {},
      "extraCondition": null
    }
  ]
}
```

**Error Response:**

```json
{
  "error": "Error message details"
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key (board_subject_condition_id_pk) |
| name | String | Name/label of the condition |
| boardIdFk | Integer | Foreign key to tbl_boards |
| standardIdFk | Integer | Foreign key to tbl_standards |
| mediumIdFk | Integer | Foreign key to tbl_mediums (nullable) |
| minSubjectsSelectable | Integer | Minimum subjects a student must select |
| maxSubjectsSelectable | Integer | Maximum subjects allowed to be selected |
| selectionType | Enum | 'fixed', 'range', or 'choose_n_from_group' |
| conditionMeta | JSON | Optional structured metadata for complex conditions |
| extraCondition | Text | Optional human-readable note or legacy rule text |

---

### 2. Get Subjects by Board Subject Condition ID

Retrieves all subjects from the subjects table that match a specific board subject condition ID.

**Endpoint:** `GET /commonApi/subjectsByCondition`

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| boardSubjectConditionsId | Integer | Yes | The board subject condition ID to filter subjects |

**Request:**

```http
GET /commonApi/subjectsByCondition?boardSubjectConditionsId=1 HTTP/1.1
Host: localhost:3000
Cookie: user_auth_token={your_token}
```

**Response:**

**Success (200 OK):**

```json
{
  "success": true,
  "message": "Subjects retrieved successfully",
  "data": [
    {
      "id": 1,
      "code": "PHY",
      "name": "Physics",
      "boardIdFK": 1,
      "standardIdFk": 11,
      "mediumIdFk": 1,
      "boardSubjectConditionsId": 1,
      "isCompulsory": 1,
      "isDefaultSelected": 1,
      "isNa": 1,
      "maxMarks": 100,
      "sortOrder": 1,
      "status": 1
    },
    {
      "id": 2,
      "code": "CHEM",
      "name": "Chemistry",
      "boardIdFK": 1,
      "standardIdFk": 11,
      "mediumIdFk": 1,
      "boardSubjectConditionsId": 1,
      "isCompulsory": 1,
      "isDefaultSelected": 1,
      "isNa": 1,
      "maxMarks": 100,
      "sortOrder": 2,
      "status": 1
    }
  ]
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "boardSubjectConditionsId query parameter is required"
}
```

**Error Response (500 Internal Server Error):**

```json
{
  "error": "Error message details"
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key (subject_id_pk) |
| code | String | Optional short code for the subject |
| name | String | Subject name |
| boardIdFK | Integer | Foreign key to tbl_boards |
| standardIdFk | Integer | Foreign key to tbl_standards |
| mediumIdFk | Integer | Foreign key to tbl_mediums |
| boardSubjectConditionsId | Integer | Reference to board subject conditions |
| isCompulsory | Integer | 0 = no, 1 = yes |
| isDefaultSelected | Integer | 0 = no, 1 = yes |
| isNa | Integer | 1 = yes, 2 = no |
| maxMarks | Integer | Maximum marks for the subject (default: 100) |
| sortOrder | Integer | Display order of the subject |
| status | Integer | Subject status (1 = active) |

---

## Authentication

All endpoints require authentication using the `user_auth_token` cookie. The token is validated by the `withAdminAuth` middleware.

**Example Authentication Header:**

```http
Cookie: user_auth_token=your_jwt_token_here
```

---

## Error Handling

All endpoints use the `handleSequelizeError` function for consistent error handling. Errors are logged to the console and returned in the response.

**Common Error Responses:**

- **400 Bad Request:** Missing or invalid query parameters
- **401 Unauthorized:** Missing or invalid authentication token
- **500 Internal Server Error:** Database or server errors

---

## Usage Examples

### Using cURL

**Get all board subject conditions:**

```bash
curl -X GET 'http://localhost:3000/commonApi/boardSubjectConditions' \
  -H 'Cookie: user_auth_token=your_token_here'
```

**Get subjects by condition ID:**

```bash
curl -X GET 'http://localhost:3000/commonApi/subjectsByCondition?boardSubjectConditionsId=1' \
  -H 'Cookie: user_auth_token=your_token_here'
```

### Using JavaScript (Fetch API)

**Get all board subject conditions:**

```javascript
fetch('http://localhost:3000/commonApi/boardSubjectConditions', {
  method: 'GET',
  credentials: 'include', // Important for cookies
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

**Get subjects by condition ID:**

```javascript
const boardSubjectConditionsId = 1;

fetch(`http://localhost:3000/commonApi/subjectsByCondition?boardSubjectConditionsId=${boardSubjectConditionsId}`, {
  method: 'GET',
  credentials: 'include', // Important for cookies
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Using Axios

**Get all board subject conditions:**

```javascript
const axios = require('axios');

axios.get('http://localhost:3000/commonApi/boardSubjectConditions', {
  withCredentials: true
})
.then(response => console.log(response.data))
.catch(error => console.error('Error:', error));
```

**Get subjects by condition ID:**

```javascript
const axios = require('axios');

axios.get('http://localhost:3000/commonApi/subjectsByCondition', {
  params: {
    boardSubjectConditionsId: 1
  },
  withCredentials: true
})
.then(response => console.log(response.data))
.catch(error => console.error('Error:', error));
```

---

## Notes

1. **Sorting:**
   - Board subject conditions are sorted by `id` in ascending order
   - Subjects are sorted first by `sortOrder`, then by `id`, both in ascending order

2. **Authentication:**
   - All endpoints require a valid authentication token
   - The token is provided via the `user_auth_token` cookie

3. **Data Relationships:**
   - `boardSubjectConditionsId` in the subjects table links to the `id` in the board subject conditions table
   - This relationship determines which subjects are available for a specific board, standard, and medium combination

4. **Status Filtering:**
   - Currently, no status filtering is applied to the queries
   - All records are returned regardless of their status field

---

## Related Files

- **Controller:** `controllers/common.controller.js`
- **Routes:** `routes/common.routes.js`
- **Models:**
  - `models/boardSubjectConditions.model.js`
  - `models/subjects.model.js`
- **Entry Point:** `server.js` (line 128)

---

## Changelog

### Version 1.0.0 (2025-10-14)
- Initial creation of common API endpoints
- Added `getAllBoardSubjectConditions` endpoint
- Added `getSubjectsByBoardSubjectConditionId` endpoint
