# KICKMAC Manager + Packing Module

## Required workflow

MANAGER:
New quotation -> Send WhatsApp PDF -> Customer confirms -> Manager Approve -> automatic Packing Order.

PACKING:
1. Picker sees customer + quotation items.
2. Picker enters actual picked quantity + Employee ID.
3. System compares picked quantity with required quotation quantity.
4. MATCH -> checker; MISMATCH -> correction.
5. Checker enters checked quantity + Employee ID.
6. System compares checked quantity with quotation.
7. MATCH -> packer; MISMATCH -> correction.
8. Packer enters packed quantity + Employee ID.
9. MATCH -> PACKED.
10. Print Dispatch Slip.
11. Manager enters Transport Name only.
12. DISPATCHED.

No tracking number is used.

## Files

frontend/src/pages/ManagerQuotations.jsx
frontend/src/pages/ManagerQuotations.css
frontend/src/pages/Packing.jsx
frontend/src/pages/Packing.css

backend/src/models/PackingOrder.js
backend/src/routes/packingRoutes.js

## Server mounting

In your backend server entry file:

import packingRoutes from "./routes/packingRoutes.js";
app.use("/api/packing", packingRoutes);

Use your project's existing auth middleware path if it differs.

## React routes

<Route path="/quotations" element={<ManagerQuotations />} />
<Route path="/quotations/new" element={<NewQuotation />} />
<Route path="/packing" element={<Packing />} />

## Existing quotation approval

Your saved quotation route already contains the important automatic packing creation logic: manager approval generates a PK number and copies quotation items into PackingOrder. Keep that logic and ensure it updates quotation.status to PACKING_CREATED.

Your existing quotation route also has:
POST /api/quotations/:id/send
and the project notes a separate WhatsApp endpoint:
POST /api/whatsapp/quotation/:id

## WhatsApp PDF

A normal browser WhatsApp link cannot silently attach a local PDF. True automatic PDF + message sending needs the backend WhatsApp Business/Cloud API integration. The manager UI is prepared for that existing endpoint. Do not put WhatsApp access tokens in React.

## Dispatch

Only transport name is stored. No tracking/consignment number is required.
