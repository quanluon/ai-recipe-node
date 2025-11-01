# Demo Page: Loading & Error Handling

## ✅ New Features Added

### 1. **Phase Loading Indicators**
Each phase now shows a **spinning loader** when active:

```
Phase States:
┌─────────────────────────────────────┐
│ 1️⃣ Chuẩn bị               [⟳]      │  ← Active (blue, spinner)
│ Đang chuẩn bị request...            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 2️⃣ Tìm kiếm RAG          [✓]      │  ← Complete (green)
│ Tìm thấy 3 công thức tương tự       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 3️⃣ Tạo công thức với AI  [❌]      │  ← Error (red)
│ ❌ Cannot read properties...        │
└─────────────────────────────────────┘
```

### 2. **Error Banner**
Top error banner appears when something goes wrong:

```
┌────────────────────────────────────────────┐
│ ❌  Lỗi: Cannot read properties of ...    │
│         undefined (reading 'parts')        │
└────────────────────────────────────────────┘
```

### 3. **Error Handling Coverage**

**Network Errors:**
- Connection failed → "Lỗi kết nối: Failed to fetch"
- HTTP errors → "Lỗi kết nối: HTTP 500: Internal Server Error"

**Stream Errors:**
- Read errors → "Lỗi đọc stream: ..."
- Parse errors → "Lỗi phân tích dữ liệu: ..."

**Server Errors:**
- Received via SSE `error` event
- Shows error banner + marks phase as error
- Stops all processing

### 4. **Visual States**

| State      | Color  | Border | Loader | Opacity |
|------------|--------|--------|--------|---------|
| Waiting    | Gray   | Gray   | ❌     | 50%     |
| Active     | Blue   | Blue   | ✅ ⟳   | 100%    |
| Complete   | Green  | Green  | ❌     | 100%    |
| Error      | Red    | Red    | ❌     | 100%    |

## 📝 Code Changes

### CSS Added:
```css
.phase-loader {
    /* Spinning circle loader */
    animation: spin 0.8s linear infinite;
}

.phase-item.error {
    background: #fee2e2;
    border-left-color: #ef4444;
}

.error-banner {
    background: #fee2e2;
    color: #991b1b;
    border-left: 4px solid #ef4444;
}
```

### JavaScript Added:
```javascript
function showError(message, phaseNum) {
    // Show banner
    errorBanner.classList.add('show');
    
    // Mark phase as error
    phase.classList.add('error');
    
    // Stop all active phases
    // Enable button again
}
```

## 🧪 Test Scenarios

### Test 1: Normal Success
1. Enter "Phở Bò"
2. Click generate
3. Watch phases: waiting → active (spinner) → complete (✓)
4. Recipe displays at the end

### Test 2: Network Error (simulated)
1. Stop server: `pkill -f "ts-node"`
2. Try to generate
3. See: "Lỗi kết nối: Failed to fetch"
4. Error banner appears
5. Button re-enabled

### Test 3: Server Error (actual)
1. Generate recipe multiple times quickly
2. Gemini may rate limit
3. See: Error in phase 3
4. Phase 3 turns red with error message
5. Processing stops

## 🎯 User Experience Improvements

**Before:**
- No visual feedback during processing
- Unclear which phase is running
- No indication if frozen or just slow
- Alerts for errors (blocking)

**After:**
- ✅ Spinner shows active phase
- ✅ Color coding: gray → blue → green
- ✅ Clear error state (red)
- ✅ Non-blocking error banner
- ✅ Button auto re-enables after error
- ✅ Progress bar shows overall completion

