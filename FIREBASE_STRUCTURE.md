# Firebase Firestore Database Structure

## Overview
This document provides a comprehensive diagram and structure of all Firebase Firestore collections, documents, and their relationships in the Prime Play Stadium Booking System.

---

## Database Structure Diagram

```
Firebase Firestore Database
│
├── 📁 users (Collection)
│   └── 📄 {userId} (Document - uses Firebase Auth UID)
│       ├── name: string
│       ├── email: string
│       ├── phone: string
│       ├── role: "user" | "admin"
│       ├── package: "normal" | "package2" | "package3" (selected during registration)
│       ├── createdAt: Timestamp
│       ├── status?: "deleted" (soft delete)
│       └── deletedAt?: Timestamp
│
├── 📁 complexes (Collection)
│   └── 📄 {complexId} (Document - auto-generated ID)
│       ├── name: string
│       ├── description: string
│       ├── pricePerHour: number
│       ├── image: string (URL)
│       ├── location: string
│       ├── sports: string[] (array of sport names)
│       ├── featuresText: string (newline-separated features)
│       ├── features?: string[] (parsed from featuresText)
│       ├── createdAt: Timestamp
│       ├── status?: "deleted" (soft delete)
│       └── deletedAt?: Timestamp
│
├── 📁 coaches (Collection)
│   └── 📄 {coachId} (Document - auto-generated ID)
│       ├── name: string
│       ├── price: number
│       ├── complexId: string (reference to complexes/{complexId})
│       ├── speciality: string
│       ├── bio: string
│       ├── image: string (URL)
│       ├── experience: string
│       ├── createdAt: Timestamp
│       ├── status?: "deleted" (soft delete)
│       └── deletedAt?: Timestamp
│
├── 📁 sports (Collection)
│   └── 📄 {sportId} (Document - auto-generated ID)
│       ├── name: string
│       └── createdAt: Timestamp
│
├── 📁 sportsItems (Collection)
│   └── 📄 {itemId} (Document - auto-generated ID)
│       ├── name: string
│       ├── category: string
│       ├── price: number
│       ├── description: string
│       ├── image: string (URL)
│       ├── stock: number
│       ├── createdAt: Timestamp
│       ├── status?: "deleted" (soft delete)
│       └── deletedAt?: Timestamp
│
├── 📁 foodItems (Collection)
│   └── 📄 {itemId} (Document - auto-generated ID)
│       ├── name: string
│       ├── category: string
│       ├── price: number
│       ├── description: string
│       ├── image: string (URL)
│       ├── createdAt: Timestamp
│       ├── status?: "deleted" (soft delete)
│       └── deletedAt?: Timestamp
│
├── 📁 drinks (Collection)
│   └── 📄 {drinkId} (Document - auto-generated ID)
│       ├── name: string
│       ├── category: string
│       ├── price: number
│       ├── description: string
│       ├── image?: string (URL)
│       └── ... (similar structure to foodItems)
│
├── 📁 bookings (Collection)
│   └── 📄 {bookingId} (Document - auto-generated ID)
│       ├── userId: string (reference to users/{userId})
│       ├── complexId: string (reference to complexes/{complexId})
│       ├── sport: string
│       ├── date: string (date string)
│       ├── selectedTimeSlots: string[] (array of time slots)
│       ├── hours: number (number of time slots)
│       ├── startTime: string | null
│       ├── timeSlot: string (formatted display string)
│       ├── coachRequired: boolean
│       ├── coachId: string | null (reference to coaches/{coachId})
│       ├── items: [] (empty array - items stored separately)
│       ├── total: number
│       ├── status: "pending" | "confirmed" | "cancelled" | "completed"
│       ├── createdAt: Timestamp
│       ├── status?: "deleted" (soft delete)
│       └── deletedAt?: Timestamp
│
├── 📁 equipmentPurchases (Collection)
│   └── 📄 {purchaseId} (Document - auto-generated ID)
│       ├── userId: string (reference to users/{userId})
│       ├── complexId: string (reference to complexes/{complexId})
│       ├── bookingId?: string | null (reference to bookings/{bookingId} - optional)
│       ├── items: Array<{
│       │     id: string,
│       │     name: string,
│       │     price: number,
│       │     quantity: number,
│       │     image?: string
│       │   }>
│       ├── total: number
│       ├── status: "pending" | "confirmed" | "cancelled" | "completed"
│       └── createdAt: Timestamp
│
├── 📁 restaurantPurchases (Collection)
│   └── 📄 {purchaseId} (Document - auto-generated ID)
│       ├── userId: string (reference to users/{userId})
│       ├── complexId: string (reference to complexes/{complexId})
│       ├── items: Array<{
│       │     id: string,
│       │     name: string,
│       │     price: number,
│       │     quantity: number,
│       │     image?: string,
│       │     category?: string
│       │   }>
│       ├── total: number
│       ├── status: "pending" | "confirmed" | "cancelled" | "completed"
│       └── createdAt: Timestamp
│
├── 📁 packagePurchases (Collection)
│   └── 📄 {purchaseId} (Document - auto-generated ID)
│       ├── email: string (user email before account creation)
│       ├── package: "package2" | "package3"
│       ├── amount: number
│       ├── status: "completed" | "pending" | "failed"
│       └── createdAt: Timestamp
│
└── 📁 contactMessages (Collection)
    └── 📄 {messageId} (Document - auto-generated ID)
        ├── name: string
        ├── email: string
        ├── message: string
        ├── userId: string | null (reference to users/{userId} - optional)
        ├── status: "new" | "read" | "replied"
        └── createdAt: Timestamp
```

---

## Relationships Map

```
┌─────────────┐
│   users     │
│  {userId}   │
└──────┬──────┘
       │
       ├─────────────────────────────────────────────┐
       │                                             │
       │                                             │
┌──────▼──────────┐                    ┌────────────▼──────────┐
│   bookings      │                    │ equipmentPurchases    │
│  {bookingId}    │                    │    {purchaseId}       │
│                 │                    │                      │
│ • userId ───────┼────────────────────┤ • userId              │
│ • complexId ────┼──┐                 │ • bookingId? ────────┼──┐
│ • coachId? ─────┼──┼──┐              │ • items[]            │  │
│                 │  │  │              │ • total               │  │
└─────────────────┘  │  │              └───────────────────────┘  │
                     │  │                                        │
                     │  │              ┌─────────────────────────▼──┐
                     │  │              │ restaurantPurchases        │
                     │  │              │    {purchaseId}           │
                     │  │              │                            │
┌────────────────────▼──▼──┐          │ • userId ──────────────────┼──┐
│   complexes              │          │ • items[]                  │  │
│  {complexId}            │          │ • total                     │  │
│                         │          └─────────────────────────────┘  │
│ • name                  │                                           │
│ • sports[]              │                                           │
│ • pricePerHour          │                                           │
└─────────────────────────┘                                           │
                                                                      │
┌─────────────────────────┐                                          │
│   coaches               │                                          │
│  {coachId}              │                                          │
│                         │                                          │
│ • complexId ────────────┼──────────────────────────────────────────┘
│ • name                  │
│ • price                 │
│ • speciality            │
└─────────────────────────┘

┌─────────────────────────┐
│   sportsItems           │
│  {itemId}               │
│                         │
│ • name                  │
│ • category              │
│ • price                 │
│ • stock                 │
└─────────────────────────┘
         │
         │ (referenced in equipmentPurchases.items[])

┌─────────────────────────┐
│   foodItems             │
│  {itemId}               │
│                         │
│ • name                  │
│ • category              │
│ • price                 │
└─────────────────────────┘
         │
         │ (referenced in restaurantPurchases.items[])

┌─────────────────────────┐
│   contactMessages       │
│  {messageId}            │
│                         │
│ • userId? ──────────────┼──┐
│ • name                  │  │
│ • email                 │  │
│ • message               │  │
└─────────────────────────┘  │
                             │
                             │
                             ▼
                    ┌────────────────┐
                    │   users        │
                    │  {userId}      │
                    └────────────────┘
```

---

## Collection Details

### 1. **users** Collection
- **Document ID**: Firebase Auth UID
- **Purpose**: Store user profile information
- **Key Fields**:
  - `name`: User's full name
  - `email`: User's email address
  - `phone`: User's phone number (collected during registration)
  - `role`: Determines access level ("user" or "admin")
  - `package`: Selected package during registration ("normal", "package2", or "package3")
    - `normal`: No discount
    - `package2`: 2% discount on pitch bookings only
    - `package3`: 5% discount on pitch bookings only
  - `status`: Used for soft delete functionality
- **Relationships**: 
  - Referenced by: `bookings.userId`, `equipmentPurchases.userId`, `restaurantPurchases.userId`, `contactMessages.userId`

### 2. **complexes** Collection
- **Document ID**: Auto-generated
- **Purpose**: Store sports complex/venue information
- **Key Fields**:
  - `sports`: Array of available sports at this complex
  - `featuresText`: String with newline-separated features
- **Relationships**:
  - Referenced by: `bookings.complexId`, `coaches.complexId`

### 3. **coaches** Collection
- **Document ID**: Auto-generated
- **Purpose**: Store coach information
- **Key Fields**:
  - `complexId`: Links coach to a specific complex
- **Relationships**:
  - References: `complexes/{complexId}`
  - Referenced by: `bookings.coachId`

### 4. **sports** Collection
- **Document ID**: Auto-generated
- **Purpose**: Master list of available sports
- **Usage**: Used to populate sport selection in complex forms

### 5. **sportsItems** Collection
- **Document ID**: Auto-generated
- **Purpose**: Store sports equipment items for sale
- **Key Fields**:
  - `stock`: Available quantity
  - `category`: Equipment category
- **Relationships**:
  - Referenced in: `equipmentPurchases.items[]` (by copying item data)

### 6. **foodItems** Collection
- **Document ID**: Auto-generated
- **Purpose**: Store restaurant food items
- **Key Fields**:
  - `category`: Food category (Food, Drink, Snack, etc.)
- **Relationships**:
  - Referenced in: `restaurantPurchases.items[]` (by copying item data)

### 7. **drinks** Collection
- **Document ID**: Auto-generated
- **Purpose**: Store drink items (may be merged with foodItems in future)
- **Note**: Currently separate collection but may be consolidated

### 8. **bookings** Collection
- **Document ID**: Auto-generated
- **Purpose**: Store court/venue bookings
- **Key Fields**:
  - `selectedTimeSlots`: Array of time slot strings
  - `coachRequired`: Boolean flag
  - `items`: Always empty array (equipment stored separately)
- **Relationships**:
  - References: `users/{userId}`, `complexes/{complexId}`, `coaches/{coachId}` (optional)
  - Referenced by: `equipmentPurchases.bookingId` (optional link)

### 9. **equipmentPurchases** Collection
- **Document ID**: Auto-generated
- **Purpose**: Store sports equipment purchase orders
- **Key Fields**:
  - `items`: Array of purchased items with quantity
  - `bookingId`: Optional link to a court booking
- **Relationships**:
  - References: `users/{userId}`, `bookings/{bookingId}` (optional)
  - Contains: Snapshot of `sportsItems` data in `items[]`

### 10. **restaurantPurchases** Collection
- **Document ID**: Auto-generated
- **Purpose**: Store restaurant/food purchase orders
- **Key Fields**:
  - `items`: Array of purchased items with quantity
- **Relationships**:
  - References: `users/{userId}`
  - Contains: Snapshot of `foodItems` or `drinks` data in `items[]`

### 11. **packagePurchases** Collection
- **Document ID**: Auto-generated
- **Purpose**: Store package purchase records (Package 2 and Package 3)
- **Key Fields**:
  - `email`: User email (recorded before account creation)
  - `package`: Package type purchased ("package2" or "package3")
  - `amount`: Purchase amount
  - `status`: Purchase status ("completed", "pending", "failed")
- **Note**: Created before user account is created, linked by email

### 12. **contactMessages** Collection
- **Document ID**: Auto-generated
- **Purpose**: Store contact form submissions
- **Key Fields**:
  - `userId`: Optional (null if user not logged in)
  - `status`: Message status for admin tracking
- **Relationships**:
  - References: `users/{userId}` (optional)

---

## Data Flow Examples

### Booking Flow:
1. User selects complex → reads from `complexes`
2. User selects sport → reads from `sports` or `complexes.sports[]`
3. User selects coach (optional) → reads from `coaches` filtered by `complexId`
4. User selects equipment (optional) → reads from `sportsItems`
5. Create booking → writes to `bookings`
6. If equipment selected → writes to `equipmentPurchases` with `bookingId` link

### Purchase Flow:
1. User browses items → reads from `sportsItems` or `foodItems`
2. User adds to cart → client-side state
3. User checks out → writes to `equipmentPurchases` or `restaurantPurchases`
4. Items array contains snapshot of item data (not references)

---

## Soft Delete Pattern

Most collections use a soft delete pattern:
- `status: "deleted"` field marks deleted items
- `deletedAt: Timestamp` records deletion time
- Queries filter out items where `status !== "deleted"`
- Actual document remains in Firestore for audit trail

**Collections using soft delete:**
- `complexes`
- `coaches`
- `sportsItems`
- `foodItems`
- `bookings`
- `users`

---

## Security Rules Summary

- **users**: Read own data or admin; Write admin only
- **bookings**: Read own bookings or admin; Create own bookings; Update/Delete admin only
- **complexes**: Read public; Write admin only
- **coaches**: Read public; Write admin only
- **sportsItems**: Read public; Write admin only
- **foodItems**: Read public; Write admin only
- **equipmentPurchases**: Read own purchases or admin; Create own purchases; Update/Delete admin only
- **restaurantPurchases**: Read own purchases or admin; Create own purchases; Update/Delete admin only
- **packagePurchases**: Read admin only; Create during registration payment
- **contactMessages**: Read admin only; Create authenticated or anonymous

---

## Notes

1. **No Subcollections**: This project uses a flat collection structure. All relationships are maintained through document ID references.

2. **Data Snapshot Pattern**: Purchase collections (`equipmentPurchases`, `restaurantPurchases`) store snapshots of item data rather than references, ensuring historical accuracy even if items are deleted or prices change.

3. **Optional Relationships**: Some relationships are optional (e.g., `bookingId` in `equipmentPurchases`, `coachId` in `bookings`).

4. **Status Fields**: Multiple status fields exist:
   - `bookings.status`: Booking status (pending, confirmed, etc.)
   - `equipmentPurchases.status`: Purchase status
   - `restaurantPurchases.status`: Purchase status
   - `contactMessages.status`: Message status
   - `status: "deleted"`: Soft delete flag (various collections)

