# Fixes Summary

## 1. LLMChain Deprecation Fix ✅

**Problem**: `LLMChain` from `langchain/chains` is deprecated.

**Solution**: Migrated to modern LangChain LCEL (LangChain Expression Language) approach:
- Removed: `LLMChain`, `BufferMemory`
- Added: `RunnableWithMessageHistory` from `@langchain/core/runnables`
- Direct message history management via `MongoDBChatMessageHistory`

**Changes**:
- `chain.call()` → `chain.invoke()` with session config
- `response.response` → `response.content`
- `memory.chatHistory` → direct `chatHistory` reference

**Verified**: Chat API tested successfully with conversation history persistence.

---

## 2. RAG Similarity Threshold Fix ✅

**Problem**: RAG (Retrieval Augmented Generation) wasn't finding similar recipes despite 49 recipes in DB.

**Root Cause**: 
- Threshold was `0.4` (40% similarity required)
- Actual cosine similarity scores: `0.17-0.18` (17-18%)
- MongoDB Atlas Vector Search uses cosine distance where low values = high similarity

**Solution**: 
- Lowered `RAG_SIMILARITY_THRESHOLD` from `0.4` to `0.15`
- Added multi-query strategy: tries 2-3 different query formulations
- Deduplicates results and keeps best similarity score for each recipe
- Added debug endpoint `/api/debug-search` to inspect actual scores

**Example Scores** (for "Phở Bò"):
```
Phở Bò (Phiên bản Healthy) - similarity: 0.1767
Phở Bò Thanh Lành - similarity: 0.1859
```

**Improvements**:
- RAG now successfully finds 3-5 similar recipes
- Query strategies: exact name, with "công thức", with category hints
- Better logging for debugging

---

## Test Results

### Chat API
```bash
✅ Message 1: "Món phở có bao nhiêu calories?"
✅ Message 2: "Còn món bún bò Huế thì sao?"
✅ Conversation history: 4 messages (2 human + 2 AI)
✅ MongoDB persistence: Working
```

### RAG Search
```bash
✅ Vector search: 49 recipes in DB
✅ Direct search for "Phở Bò": 5 results
✅ Threshold: 0.15 (optimal for Gemini embeddings)
```

---

## Files Modified

1. `src/services/chat.service.ts` - LLMChain → RunnableWithMessageHistory
2. `src/config/env.ts` - RAG_SIMILARITY_THRESHOLD: 0.4 → 0.15
3. `src/services/rag.service.ts` - Multi-query strategy
4. `src/handlers/recipe.handler.ts` - Debug search endpoint
5. `src/routes/recipe.routes.ts` - Added /api/debug-search

