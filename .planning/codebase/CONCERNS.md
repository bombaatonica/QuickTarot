# Codebase Concerns

**Analysis Date:** 2026-07-07

## Security Issues

### JWT Secret Hardcoded Fallback

**Risk:** Production application runs with hardcoded default secret key if JWT_SECRET environment variable is not set.

**Files:** `backend/api/routes/auth.py:15`

**Current state:**
```python
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
```

**Impact:**
- Any attacker who knows the default key can forge valid JWT tokens
- Affects all authentication across the entire system
- Token verification in `verify_password()` and `get_current_user()` would accept forged tokens

**Fix approach:**
- Remove the fallback default value
- Raise an error on startup if JWT_SECRET is not set
- Document required environment variables with validation

---

### XSS Vulnerability in Tarot Text Rendering

**Risk:** User-controlled content from LLM can inject arbitrary HTML/JavaScript via dangerouslySetInnerHTML.

**Files:** `frontend/components/FormattedTarotText.tsx:75`

**Current state:**
```tsx
const processMarkdown = (text: string) => {
  let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-purple-700">$1</strong>');
  // ... more regex replacements
  return processed;
};

return (
  <div 
    dangerouslySetInnerHTML={{ __html: processedText }}
  />
);
```

**Impact:**
- If the Groq LLM response contains `<img src=x onerror="malicious()">`, it will execute
- Attacker could steal session tokens from localStorage
- Could redirect users to phishing sites
- Could deface content displayed to users

**Trigger:** Any prompt that causes Groq to generate HTML-like content (including intentional injections)

**Fix approach:**
- Use a sanitization library (e.g., `DOMPurify` or `sanitize-html`)
- Parse markdown properly with a library like `remark` + sanitize output
- Or: use DOM manipulation instead of innerHTML (create elements, set textContent, use `.appendChild()`)

---

### Webhook Amount Validation Missing

**Risk:** Webhook endpoint trusts the amount sent by OasisPay without verifying it matches the stored transaction.

**Files:** `backend/api/routes/payment.py:205-226`

**Current state:**
```python
@bp.route("/webhook", methods=["POST"])
def webhook():
    data = request.get_json()
    # ... token validation ...
    
    if data["event"] == "TRANSACTION_PAID":
        transaction_obj = data.get("transaction") or {}
        identifier = transaction_obj.get("identifier")
        amount = transaction_obj.get("amount")  # Trusts this value
        
        transaction = get_transaction_by_identifier(identifier)
        if transaction and transaction.get("status") == "pending":
            # Uses amount from webhook, not from stored transaction
            users_collection.update_one(
                {"_id": ObjectId(transaction["user_id"])},
                {"$inc": {"balance": amount_value}}  # Could be inflated
            )
```

**Impact:**
- Attacker who intercepts webhook could change amount from 10.00 to 1000.00
- User gets credited with incorrect amount
- Direct revenue loss for the platform

**Fix approach:**
- Extract amount from `transaction` table, not from webhook payload
- Compare webhook amount with stored transaction amount
- Log discrepancies
- Reject webhook if amounts don't match

---

### Unauthenticated Credit Addition

**Risk:** `/api/payment/add-credit` endpoint allows any authenticated user to add unlimited free credit with no server-side validation against request amount.

**Files:** `backend/api/routes/payment.py:42-74`

**Current state:**
```python
@bp.route("/add-credit", methods=["POST"])
@require_auth
def add_credit(current_user: dict):
    data = request.get_json()
    amount = float(data["amount"])  # Takes whatever client sends
    
    # No validation that this is legitimate or authorized
    users_collection.update_one(
        {"_id": user_id},
        {"$set": {"balance": new_balance}}
    )
    return jsonify({"balance": new_balance, "added": amount})
```

**Impact:**
- User can modify network request to add arbitrary credit (e.g., "amount": 999999.00)
- Endpoint is probably intended for legitimate payment webhook processing only
- Can be exploited to bypass payment entirely

**Fix approach:**
- Remove this endpoint if it's only for testing
- If needed, restrict to admin-only with additional auth
- Make it webhook-only (require valid webhook token)
- Or: remove client-side ability to call this directly

---

## Race Conditions

### Non-Atomic Balance Deduction

**Risk:** `deduct_balance()` performs a read-check-write sequence that's not atomic. Multiple concurrent requests can bypass balance checks.

**Files:** `backend/api/routes/payment.py:231-253`

**Scenario:**
1. User has balance = 2.00
2. Request A calls `deduct_balance(user_id, 1.00)` → reads balance (2.00)
3. Request B calls `deduct_balance(user_id, 1.00)` → reads balance (2.00)
4. Request A writes balance = 1.00
5. Request B writes balance = 1.00
6. Both succeed, but user lost 2.00 instead of 1.00 being deducted twice

**Impact:**
- Questions can be asked even with insufficient balance
- Balance can go negative
- Revenue bypass

**Files affected:**
- `backend/api/routes/chat.py:30` - calls `deduct_balance()` to charge for questions
- `backend/api/routes/payment.py:231-253` - the vulnerable function

**Fix approach:**
- Use MongoDB atomic update with `$inc` and conditional check: `updateOne(..., {"$inc": {"balance": -amount}}, {upsert: false})`
- Or: use MongoDB transactions if supporting multiple documents
- Or: add database-level unique constraint/index to prevent double-spending

---

## Frontend Issues

### Double-Credit After Pix Payment

**Risk:** After successful Pix payment, frontend calls `addCredit()` again, but webhook already credited the user (double-charging).

**Files:** 
- `frontend/components/BuyQuestionButton.tsx:53-68`
- `frontend/components/PixPaymentModal.tsx:44-62`

**Flow:**
1. User makes Pix payment
2. Webhook (backend) credits user (correct)
3. `checkPaymentStatus()` detects paid status
4. Calls `onPaymentSuccess(response.amount)` 
5. `handlePixPaymentSuccess()` calls `paymentApi.addCredit(amount)` again
6. User now has double the credit

**Impact:**
- User gets credited twice for one payment
- Every payment costs 50% less for users
- Direct revenue impact

**Fix approach:**
- Remove the client-side `addCredit()` call after webhook success
- Rely entirely on webhook for crediting
- Or: have client-side poll for confirmed balance instead of calling addCredit

---

### Hardcoded Amount Input Value

**Risk:** Input field has static value that doesn't update with user input.

**Files:** `frontend/components/BuyQuestionButton.tsx:101`

**Current state:**
```tsx
<input
  type="number"
  value="10.00"  // Always "10.00"
  onChange={(e) => setAmount(e.target.value)}  // Updates state but not displayed
  placeholder="10.00"
/>
```

**Impact:**
- User can't change the amount they want to add
- Appears to accept input (onChange fires) but displays wrong value
- Confusing UX, users might send payment for wrong amount

**Fix approach:**
- Change to: `value={amount}` (use state value, not hardcoded)

---

### Memory Leak in Payment Modal

**Risk:** `setInterval` in `checkPaymentStatus()` is never cleaned up, especially on unmount or cancellation.

**Files:** `frontend/components/PixPaymentModal.tsx:43-62`

**Current state:**
```tsx
const checkPaymentStatus = async (transactionId: string) => {
  const interval = setInterval(async () => {
    // ... polling logic ...
    if (response.status === 'paid') {
      clearInterval(interval);
    } else if (response.status === 'expired') {
      clearInterval(interval);
    }
    // If component unmounts before paid/expired, interval keeps running
  }, 5000);
  // interval is not stored in state/ref, so can't clean up on unmount
};
```

**Impact:**
- Every time user opens modal, new interval created
- If user cancels without payment completing, interval runs forever
- Over time: many intervals polling backend continuously
- Increases backend load, drains battery on mobile

**Example:** User opens 10 modals and cancels 10 times = 10 orphaned intervals polling every 5 seconds

**Fix approach:**
- Store interval ID in `useRef`
- Use `useEffect()` with cleanup function to clear interval on unmount
- Implement: `useEffect(() => { return () => clearInterval(interval); }, [])`

---

### Dead Card-Flip Animation

**Risk:** Card reveal animation never triggers because `isRevealed` starts as `true`.

**Files:** `frontend/components/AnimatedTarotCard.tsx:15`

**Current state:**
```tsx
const [isRevealed, setIsRevealed] = useState(true); // Starts revealed
```

**Comment in code:** "Começa já revelada" (Starts already revealed)

**Impact:**
- Cards display immediately without flip effect
- Intended animation sequence never plays
- Reduces visual impact/polish

**Fix approach:**
- Change to: `useState(false)` to start with back of card
- Add `useEffect()` that flips card after delay (e.g., after index * delay ms)

---

### Excessive Console Logging

**Risk:** Console spam in production from card rendering component.

**Files:** `frontend/components/AnimatedTarotCard.tsx:28, 30, 33, 37`

**Current state:**
```tsx
useEffect(() => {
  console.log(`Card ${index}: isRevealed=${isRevealed}, imageLoaded=${imageLoaded}, imageError=${imageError}`);
  if (imageUrl && !imageLoaded && !imageError) {
    console.log(`Card ${index}: Loading image ${imageUrl}`);
    const img = new Image();
    img.onload = () => {
      console.log(`Card ${index}: Image loaded successfully`);
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.log(`Card ${index}: Image failed to load`);
      setImageError(true);
    };
  }
}, [imageUrl, imageLoaded, imageError]);
```

**Impact:**
- With 9 cards rendered, 9+ log lines per render
- Makes debugging harder
- Leaks internal implementation details to users

**Fix approach:**
- Remove all console.log statements
- Or: wrap with `if (process.env.NODE_ENV === 'development')`

---

## Error Handling Issues

### Backend Returns HTML, Frontend Expects JSON

**Risk:** Flask's `abort()` function returns HTML error pages, but frontend expects JSON with `data.detail` field.

**Files:** 
- Backend error responses: `backend/api/routes/auth.py`, `backend/api/routes/payment.py`, `backend/api/routes/chat.py`
- Frontend error parsing: `frontend/components/Chat.tsx:92`, `frontend/components/PixPaymentModal.tsx:37`

**Example error flow:**
1. Backend: `abort(402, description="Saldo insuficiente")`
2. Returns HTML: `<html><body><h1>402 Payment Required</h1><p>Saldo insuficiente</p></body></html>`
3. Frontend tries: `error.response?.data?.detail` → `undefined`
4. User sees fallback message instead of real error

**Impact:**
- Users get generic error messages instead of helpful ones
- Hard to debug payment failures
- Bad UX

**Fix approach:**
- Add Flask error handler in `main.py`:
```python
@app.errorhandler(Exception)
def handle_error(e):
    return jsonify({
        "error": str(e.description),
        "detail": str(e.description)
    }), e.code or 500
```
- Or: use proper exception classes that return JSON

---

## Test Coverage

### No Automated Tests

**Risk:** Zero test coverage. Only manual test scripts exist (`test_backend.py`, `test_backend_import.py`).

**Impact:**
- No regression detection
- Can't safely refactor
- Race conditions, security issues wouldn't be caught
- New developers might break existing functionality

**Critical untested areas:**
- Race condition in `deduct_balance()`
- JWT token generation and validation
- Webhook payment processing
- Balance calculations across concurrent requests

**Fix approach:**
- Add pytest for backend: `pytest backend/tests/`
- Add Jest/Vitest for frontend: `npm test`
- Set coverage threshold (e.g., 80% for critical paths)

---

## Data Integrity

### Non-Transactional Balance Updates

**Risk:** Balance updates are not transactional. No rollback if something fails after balance check.

**Files:** `backend/api/routes/payment.py:220-226`

**Scenario:**
1. Webhook updates balance
2. `update_transaction_status()` fails
3. User keeps money but transaction marked as pending
4. Duplicate webhook processing could credit twice

**Fix approach:**
- Use MongoDB transactions (requires replica set)
- Or: make transaction update succeed/fail atomically with balance update

---

### No Duplicate Transaction Prevention

**Risk:** Same webhook could be processed multiple times, crediting user repeatedly.

**Files:** `backend/api/routes/payment.py:193-228`

**Current flow:**
```python
transaction = get_transaction_by_identifier(identifier)
if transaction and transaction.get("status") == "pending":
    # Credit user
    update_transaction_status(...)
```

**Problem:** If webhook retries (network hiccup), second call sees status changed to "paid", so won't credit again. But if update fails, next webhook retry will credit.

**Impact:** Edge case, but can result in double-crediting

**Fix approach:**
- Use idempotency key from webhook
- Store processed webhook IDs in database
- Check before processing: `if webhook_already_processed: return 200`

---

## Configuration Issues

### Missing Environment Validation

**Risk:** Application starts without validating all required environment variables, then crashes later in execution.

**Required vars missing validation:**
- `JWT_SECRET` (uses hardcoded fallback instead of failing fast)
- `GROQ_API_KEY` (checked at runtime only)
- `OASIS_PUBLIC_KEY`, `OASIS_SECRET_KEY` (checked only when creating payment)
- `MONGODB_URI` (assumed to exist)
- `NEXT_PUBLIC_API_URL` (defaults to localhost)

**Impact:**
- App deploys to production but fails mid-request
- Hard to debug configuration problems
- Better to fail at startup

**Fix approach:**
- Create config validation module
- Check all required vars in app initialization
- Raise clear error message if missing

---

## Performance Concerns

### No Database Indexes on Query Fields

**Files:** `backend/api/db/transactions.py:10-16`

**Current indexes:**
- `user_id`, `charge_id`, `identifier`, `status`, `created_at`

**Missing:**
- Composite index on `(user_id, status)` for efficient filtering
- Index on `identifier` for webhook processing (already has single index)

**Impact:** Moderate - queries work but could be slow with 100k+ transactions

**Fix approach:**
- Add: `collection.create_index([("user_id", 1), ("status", 1)])`
- Monitor slow query log

---

## Fragile Areas

### Card Image Loading Resilience

**Files:** `frontend/components/AnimatedTarotCard.tsx`

**Current handling:**
- If image fails to load, shows fallback text
- No retry mechanism
- No error tracking

**Risk:** CDN outages silently degrade UX without alerting developers

**Fix approach:**
- Add error tracking (Sentry/similar)
- Implement retry with exponential backoff
- Log 404 vs 500 vs timeout differently

---

### LLM Fallback Chain Brittle

**Files:** `backend/api/services/llm.py:61-80`

**Current:**
```python
for model in models_to_try:
    try:
        # Use model
    except Exception as e:
        if "decommissioned" not in error_str.lower():
            return f"Erro: {error}"  # Returns error instead of trying next
        continue  # Only retries on model errors
```

**Problem:** Returns error immediately for non-model exceptions (network timeout, auth failure), doesn't try next model

**Fix approach:**
- Retry all models on all non-permanent errors
- Only skip model if it's actually decommissioned

---

## Known Limitations

### No Database Transactions Support

**Current:** MongoDB without transactions (single-node setup)

**Impact:** Can't atomically update balance + record transaction together

**Workaround currently in place:** Hope race conditions don't happen at scale

**Upgrade path:** Move to MongoDB replica set or use transactional guarantees differently

---

### Client-Stored Authentication State

**Risk:** User object and balance stored in localStorage, can be modified by user or XSS attack

**Files:** `frontend/lib/api.ts`, `frontend/components/BuyQuestionButton.tsx`

**Impact:** User could modify balance locally (doesn't affect server but creates UX confusion when synced)

**Fix approach:**
- Remove balance from localStorage
- Only fetch from server (requires additional API call)
- Or: sign localStorage data with server-side key (harder)

---

## Summary by Priority

**CRITICAL (Fix immediately):**
- JWT secret hardcoded fallback
- XSS via dangerouslySetInnerHTML
- Webhook amount validation missing
- Add-credit endpoint accessible without authorization
- Race condition in deduct_balance

**HIGH (Fix in next sprint):**
- Double-credit bug after Pix payment
- Memory leak in setInterval
- Backend error handler (HTML vs JSON mismatch)
- Hardcoded input amount
- No automated tests

**MEDIUM (Fix before scaling):**
- Dead card animation
- Console spam
- Missing environment validation
- Non-transactional balance updates
- Duplicate webhook processing

**LOW (Improvement):**
- Database index optimization
- LLM fallback chain resilience
- Card image error tracking
- Client-stored auth state

---

*Concerns audit: 2026-07-07*
