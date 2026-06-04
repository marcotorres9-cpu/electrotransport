# ElectroTransport Worklog

## Date: 2025

## Changes Made

### Feature 6: Neon PostgreSQL Database (.env update)
- Updated `/home/z/my-project/.env` to use Neon PostgreSQL with both `DATABASE_URL` (pgbouncer) and `DIRECT_URL` (direct connection)
- Updated Prisma schema comment for role field to include "admin" option
- Ran `prisma generate` to update client
- Note: `prisma db push` was not executed because it would attempt to drop non-Et* tables from the existing inventory app. The Et* tables already exist in the database and the schema change is only a comment update.

### Feature 1: Store Owner Offer Notification Flow

#### a) Modified `src/app/api/orders/[id]/accept/route.ts`
- Changed driver accept flow: order status now becomes `"offer_received"` instead of `"accepted"` immediately
- Driver's ID is saved as `acceptedBy`, `acceptedPrice` is set, and `counterPrice` is set if different from proposed
- Creates notification for store owner with type `"offer"` containing driver name and price
- Creates notification for driver: "Oferta enviada, esperando confirmación del local"

#### b) Created `src/app/api/orders/[id]/approve-offer/route.ts`
- POST endpoint for store owners to approve a driver's offer
- Only order creator can call this
- Sets status to `"accepted"`, keeps acceptedPrice
- Creates notifications for both driver and store

#### c) Created `src/app/api/orders/[id]/reject-offer/route.ts`
- POST endpoint for store owners to reject a driver's offer
- Only order creator can call this
- Sets status back to `"pending"`, clears `acceptedBy` and `acceptedPrice`, keeps `counterPrice` as history
- Creates notifications for both driver and store

#### d) Updated `src/app/api/orders/route.ts`
- Store GET endpoint now includes `store` relation in response for consistency

#### e) Updated `src/components/app/order-detail-page.tsx`
- Added `Handshake` icon for new "offer_received" step in status timeline
- Added special orange-themed offer card when status is `offer_received` and user is creator
- Shows driver info, offered price, and 3 action buttons: Accept, Decline, Search Another
- Connected approve/reject API calls with loading states

#### f) Updated `src/components/app/store-orders-page.tsx`
- Added "Ofertas Recibidas" filter option
- Orders with `offer_received` status show pulsing orange border (`animate-pulse-offer`)
- Shows driver name and offered price for offer_received orders

#### g) Updated `src/components/app/store-dashboard.tsx`
- Added "Ofertas Pendientes" stat card (orange themed)
- Added highlighted offers section showing pending offers with accept/reject/detail buttons
- Map section added (see Feature 4)

#### h) Updated `src/components/app/notifications-page.tsx`
- Added `"offer"` type with DollarSign icon and orange styling
- Unread offer notifications get orange left border and "OFERTA" badge
- Added "Ver Pedido" action button for unread offer notifications that navigates to order detail

#### i) Updated `src/lib/api.ts`
- Added `getStatusColor` case for "offer_received": `'bg-orange-100 text-orange-800 border-orange-200'`
- Added `getStatusLabel` case for "offer_received": `'Oferta Recibida'`

### Feature 2: Admin Panel

#### a) `prisma/schema.prisma`
- Updated role comment: `"store" | "driver" | "admin"`

#### b) Updated `src/app/api/auth/register/route.ts`
- Allowed "admin" role in registration validation
- Admin registration creates user only (no store/driver profile needed)

#### c) Updated `src/app/api/auth/login/route.ts`
- No changes needed (already returns user data generically)

#### d) Updated `src/components/app/login-page.tsx`
- Added admin role redirect to `admin-dashboard` view

#### e) Created `src/app/api/admin/users/route.ts`
- GET: Lists all store and driver users with profiles
- PATCH: Toggles user isActive status
- Admin role check via x-user-role header

#### f) Created `src/components/app/admin-dashboard.tsx`
- Full admin panel with purple theme
- Stats cards: Total users, Active stores, Active drivers, Pending orders
- User management table with search and role filter
- Activate/deactivate toggle for each user
- Responsive sidebar with logout

#### g) Updated `src/store/use-app-store.ts`
- Added `'admin-dashboard'` to ViewName type
- Added `'admin'` to UserWithProfile role type

#### h) Updated `src/app/page.tsx`
- Added `AdminDashboard` import and route rendering
- Admin dashboard rendered as standalone page with own sidebar

### Feature 3: Exact Value Input + Slider for Counter-offers

#### Updated `src/components/app/driver-available-orders.tsx`
- Added synced slider (0 to 2x proposed price) and exact value text input
- Slider range with step 0.50, shows proposed price as midpoint reference
- Both slider and input are bidirectionally synced
- Shows comparison (proposed vs offered) with color coding
- Updated accept dialog text to reflect "Oferta enviada" flow

### Feature 4: Map centered on Quito, Ecuador

#### Created `src/components/app/map-view.tsx`
- Dynamic client-side only Leaflet map component
- Centers on Quito, Ecuador: lat=-0.1807, lng=-78.4678, zoom=12
- Uses `navigator.geolocation.getCurrentPosition()` for auto-detect, fallback to Quito
- Shows origin (green) and destination (amber) markers for orders
- Uses OpenStreetMap tiles
- Handles loading state gracefully

#### Updated `src/components/app/store-dashboard.tsx`
- Added Map section with "Mapa de Actividad" title
- Shows active/offer_received orders with origin/destination markers
- Shows driver locations as pulsing green circles

#### Updated `src/components/app/driver-dashboard.tsx`
- Added "Radar de Vehículos" map section (visible when online)
- Shows active orders with route lines
- Added "Oferta Enviada" badge for offer_received status orders

### Feature 5: Real-time Vehicle Radar

#### Created `src/app/api/drivers/locations/route.ts`
- GET: Returns all online drivers with lat/lng positions
- Uses small random offsets around Quito center for simulated GPS

#### Updated `src/app/api/drivers/route.ts`
- No functional changes needed (returns online drivers)

#### Updated `src/app/api/drivers/[id]/toggle-status/route.ts`
- When going online, sets lat/lng to Quito center with small random offset if no location exists

#### Updated `src/components/app/map-view.tsx`
- Fetches driver locations from `/api/drivers/locations`
- Shows drivers as pulsing green circles (animate-ping CSS)
- Active orders show dashed route lines between origin and destination
- Custom div icons for markers (no image dependency issues)

### CSS Updates (`src/app/globals.css`)
- Added `animate-pulse-offer` keyframe animation for pulsing orange border on offer cards

### Dependencies Added
- `leaflet` v1.9.4
- `react-leaflet` v5.0.0
- `@types/leaflet` v1.9.21
---
Task ID: 1
Agent: Main Agent
Task: Fix missing Admin role in registration and update app icon

Work Log:
- Analyzed screenshot from user showing only 2 roles (Local Comercial, Transportista) - labels don't match current code
- Verified register-page.tsx has all 3 roles (Local, Transporte, Admin) correctly
- Found root cause: Service Worker caching old version (v1), and APK built with old code
- Updated SW cache name from v1 to v3 to force cache refresh
- Generated new app icon with AI (green gradient truck + appliance)
- Created icon sizes: 1024px, 512px, 192px for PWA
- Copied icons to all Android mipmap directories (mdpi through xxxhdpi)
- Pushed all changes to GitHub
- Built new APK with Capacitor + Gradle (JDK 21 + Android SDK)
- APK saved to /home/z/my-project/download/ElectroTransport.apk (4.2MB)

Stage Summary:
- Admin role was always in the code but old cached version was being served
- SW cache updated to v3 forces all clients to fetch fresh assets
- New icon deployed to Android resources and PWA
- New APK built and available for download
