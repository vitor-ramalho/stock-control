You are building the **POS Page**, the most complex page in the system.
Route: `/pos`

### Main Layout (Desktop-focused)
- Left side: **Search + Product List**
- Right side: **Cart**

### Product Search
- Search bar filters by:
  - name
  - SKU
  - category
- API:
  `GET /api/products?search=`

### Product List
- Grid list of items:
  - image
  - name
  - price
  - stock badge (low stock warning)
- Clicking product → adds to cart.

### Cart Requirements
- Use Zustand store: `usePOSCartStore`
- Cart item:
  - productId
  - name
  - price
  - quantity
  - subtotal
- Features:
  - Increment/decrement quantity
  - Remove item
  - Auto-calc subtotal, taxes, total
  - Persist cart in localStorage

### Checkout Modal
Fields:
- paymentMethod
  - cash
  - credit
  - debit
  - pix
- amountReceived (if cash)
- customerName (optional)
POST `/api/pos/checkout`
Payload:
- items: [{ productId, quantity }]
- totals
- paymentMethod
- customerName
- change (if cash)

After checkout:
- Clear cart
- Show "Sale Completed" receipt modal

### Components to create
- `ProductSearchBar`
- `ProductGrid`
- `CartPanel`
- `CartItem`
- `CheckoutDialog`
- `ReceiptDialog`
- Zustand store: `/store/pos-cart.ts`

### Additional Technical Notes
- Use React Query for product fetching.
- Debounce search (300ms).
- Handle stock validation before checkout.
- Add skeleton loaders.
- Optimize for fast keyboard/mouse usage.
- Implement scanner support (optional):
  - If input starts with barcode number → auto-add item.

Generate the full page and all components.
