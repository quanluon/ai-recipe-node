# PDF Recipe Import Guide

Comprehensive guide for importing recipes from PDF files into the AI Recipe database.

## Overview

The PDF import tool automatically extracts, parses, and imports recipes from PDF documents into MongoDB with vector embeddings for RAG (Retrieval Augmented Generation) search.

## Features

✅ **Automatic Parsing**: Extracts recipes from PDF with intelligent text parsing  
✅ **Category Detection**: Automatically categorizes recipes (khai-vi, mon-chinh, hai-san, etc.)  
✅ **Duplicate Prevention**: Skips recipes that already exist in database  
✅ **Vector Embeddings**: Generates embeddings for RAG similarity search  
✅ **Flexible Options**: Dry-run mode, import limits, custom PDF files  
✅ **Progress Tracking**: Real-time logging of import progress and errors  

## Quick Start

### 1. Preview Recipes (Recommended First Step)

```bash
npm run import:preview
```

This runs in **dry-run mode** and shows:
- How many recipes were detected
- First 5 parsed recipes with details
- Category detection results
- **No data is saved**

### 2. Test Import (10 Recipes)

```bash
npm run import:test
```

Imports first 10 recipes to verify everything works correctly.

### 3. Full Import

```bash
npm run import:pdf -- --import
```

Imports all recipes from `data.pdf`.

## Usage

### Basic Commands

```bash
# Show help
npm run import:pdf

# Preview without importing
npm run import:pdf -- --dry-run

# Import all recipes
npm run import:pdf -- --import

# Import first N recipes
npm run import:pdf -- --import --limit=50

# Use custom PDF file
npm run import:pdf -- --import custom-recipes.pdf
```

### Command Options

| Option | Description | Example |
|--------|-------------|---------|
| `--dry-run` | Preview recipes without saving | `npm run import:pdf -- --dry-run` |
| `--import` | Actually import to database | `npm run import:pdf -- --import` |
| `--limit=N` | Import only first N recipes | `npm run import:pdf -- --limit=20` |
| `[pdf-file]` | Custom PDF file path | `npm run import:pdf -- --import recipes.pdf` |

## How It Works

### 1. PDF Extraction

```
data.pdf → PDF Parser → Raw Text (pages, characters)
```

Uses `pdf-parse` library to extract all text from PDF.

### 2. Recipe Block Detection

The tool tries multiple strategies to split text into recipe blocks:

**Strategy 1**: Numbered recipes (1., 2., 3., etc.)
```
1. Phở Gà
   Nguyên liệu: ...
   
2. Bún Bò Huế
   Nguyên liệu: ...
```

**Strategy 2**: Recipe title patterns (capitalized headers)
```
PHỞ GÀ
Nguyên liệu: ...

BÚN BÒ HUẾ
Nguyên liệu: ...
```

**Strategy 3**: Large text gaps (page breaks)

### 3. Recipe Parsing

Each recipe block is parsed into structured data:

```typescript
{
  dishName: "Phở Gà",
  description: "Món ăn truyền thống...",
  prepTime: "30 phút",
  cookTime: "2 giờ",
  servings: "4 người",
  ingredients: [
    { name: "Gà", quantity: "1 con", whereToFind: "..." }
  ],
  steps: [
    { stepNumber: 1, description: "Rửa sạch gà...", videoUrl: "" }
  ],
  shoppingTips: "..."
}
```

**Parsed Sections**:
- **Dish Name**: First line (cleaned from numbers/prefixes)
- **Description**: Text before "Nguyên liệu" section
- **Ingredients**: Lines after "Nguyên liệu" keyword
- **Steps**: Lines after "Cách làm" / "Bước" keywords
- **Times/Servings**: Extracted using regex patterns

### 4. Category Detection

Automatic categorization based on keywords:

| Category | Keywords |
|----------|----------|
| `khai-vi` | gỏi, salad, nem, chả giò |
| `mon-chinh` | cơm, bún, phở, mì, canh, lẩu |
| `trang-mieng` | chè, bánh, dessert, kem |
| `do-uong` | nước, trà, cà phê, sinh tố |
| `mon-chay` | chay, đậu hũ, nấm, rau |
| `hai-san` | cá, tôm, mực, nghêu |
| `thit` | thịt, gà, heo, bò, vịt |

### 5. Database Import

For each valid recipe:

1. **Check Duplicates**: Query MongoDB for existing `dishName`
2. **Insert to MongoDB**: Save to `recipes` collection
3. **Generate Embedding**: Create vector embedding with weights:
   - Dish name: 3x weight
   - Categories: 2x weight
   - Description + ingredients
4. **Store in Vector DB**: Save to MongoDB Atlas Vector Search

### 6. Validation

Recipes must pass validation:
- ✅ Dish name: 3-100 characters
- ✅ Ingredients: At least 2
- ✅ Steps: At least 2

Invalid recipes are skipped with warnings.

## Parsing Patterns

### Ingredient Patterns

The parser recognizes these formats:

```
✅ 200g thịt ba chỉ          → name: "thịt ba chỉ", quantity: "200g"
✅ 2 củ hành                 → name: "hành", quantity: "2 củ"
✅ Thịt ba chỉ: 200g         → name: "Thịt ba chỉ", quantity: "200g"
✅ - Gà: 1 con               → name: "Gà", quantity: "1 con"
```

### Step Patterns

```
✅ Bước 1: Rửa sạch gà...    → stepNumber: 1
✅ 1. Rửa sạch gà...         → stepNumber: 1
✅ 1) Rửa sạch gà...         → stepNumber: 1
```

### Time Patterns

```
✅ Chuẩn bị: 30 phút
✅ Nấu: 2 giờ
✅ Prep: 30 minutes
```

### Servings Patterns

```
✅ 4 người
✅ 6 phần
✅ 4 servings
```

## Output Example

### Dry Run Output

```
=============================================================
📚 RECIPE PDF IMPORT STARTING
=============================================================
PDF File: data.pdf
Dry Run: YES (no data will be saved)

✅ Parsed 150 recipes from PDF

📋 DRY RUN - First 5 parsed recipes:

1. Phở Gà
   Description: Món ăn truyền thống Việt Nam với nước dùng trong...
   Ingredients: 12
   Steps: 5
   Categories: mon-chinh

2. Gỏi Cuốn Tôm Thịt
   Description: Món khai vị nhẹ nhàng với tôm tươi và rau sống...
   Ingredients: 8
   Steps: 4
   Categories: khai-vi, hai-san

✅ Dry run complete. Use --import to save to database.
```

### Import Output

```
=============================================================
📚 RECIPE PDF IMPORT STARTING
=============================================================
PDF File: data.pdf
Dry Run: NO
Limit: 10

✅ Parsed 150 recipes from PDF

📥 Importing 10 recipes...

[1/10] Importing: Phở Gà
✅ Recipe stored: Phở Gà
[2/10] Importing: Gỏi Cuốn Tôm Thịt
✅ Recipe stored: Gỏi Cuốn Tôm Thịt
[3/10] Importing: Bún Bò Huế
⚠️  Recipe already exists: Bún Bò Huế

=============================================================
📊 IMPORT SUMMARY
=============================================================
✅ Imported: 8
⏭️  Skipped (duplicates): 2
❌ Errors: 0
📚 Total recipes in PDF: 150
=============================================================
```

## Customization

### Adjust Parsing for Your PDF Format

If your PDF has a different structure, edit `scripts/import-recipes-from-pdf.ts`:

**1. Recipe Block Splitting**

```typescript
private splitIntoRecipeBlocks(text: string): string[] {
  // Add your custom split logic
  // Example: Split by custom delimiter
  return text.split(/MY_CUSTOM_DELIMITER/).filter(b => b.length > 100);
}
```

**2. Section Keywords**

```typescript
// Change these to match your PDF's section headers
const ingredientsStart = this.findSectionStart(lines, [
  'ingredients',      // English
  'nguyên liệu',     // Vietnamese
  'المكونات',        // Arabic
]);
```

**3. Category Keywords**

```typescript
const categoryKeywords: Record<string, string[]> = {
  'my-category': ['keyword1', 'keyword2', 'keyword3'],
  // Add your custom categories
};
```

## Troubleshooting

### Problem: No recipes detected

**Cause**: PDF format doesn't match expected patterns

**Solution**:
1. Run `--dry-run` first to see what's detected
2. Open PDF and identify structure (numbered? headings? page breaks?)
3. Adjust `splitIntoRecipeBlocks()` logic
4. Test with `--limit=1` to debug single recipe

### Problem: Ingredients not parsed correctly

**Cause**: Different ingredient format

**Solution**:
1. Check ingredient patterns in your PDF
2. Update regex in `extractIngredients()`
3. Add logging to see raw ingredient lines
4. Test with `--dry-run`

### Problem: Categories all wrong

**Cause**: Keywords don't match your recipes

**Solution**:
1. Review `categoryKeywords` mapping
2. Add keywords specific to your cuisine
3. Check language (Vietnamese vs English vs other)

### Problem: Embedding quota errors

**Cause**: Too many recipes, OpenAI quota exceeded

**Solution**:
```bash
# Switch to Gemini (free)
LLM_PROVIDER=gemini npm run import:pdf -- --import

# Or import in batches
npm run import:pdf -- --import --limit=50
# Wait, then:
# Manually skip first 50 and continue...
```

### Problem: Duplicates not detected

**Cause**: Dish names slightly different

**Solution**:
- Normalize dish names (lowercase, remove accents)
- Use fuzzy matching for duplicate detection
- Clean up existing data first

## Best Practices

### 1. Always Start with Dry Run

```bash
# STEP 1: Preview
npm run import:preview

# STEP 2: Check output, adjust if needed

# STEP 3: Test import (small batch)
npm run import:test

# STEP 4: Full import if test succeeds
npm run import:pdf -- --import
```

### 2. Import in Batches

For large PDFs (1000+ recipes):

```bash
# Batch 1
npm run import:pdf -- --import --limit=100

# Batch 2 (manually adjust script to skip first 100)
# Or run multiple times - duplicates are auto-skipped
```

### 3. Verify Results

After import, check database:

```javascript
// In mongo shell
use ai_recipe_db;
db.recipes.countDocuments();
db.recipes.find().limit(5).pretty();
```

### 4. Monitor Embeddings

Check vector store:

```bash
# Search for a recipe to verify RAG works
curl http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Tìm công thức phở"}'
```

## Performance

### Speed

- **Parsing**: ~100-500 recipes/second (depends on PDF complexity)
- **Import**: ~5-10 recipes/second (limited by embedding generation)
- **Embedding**: ~1-2 per second (API rate limits)

### Recommendations

- For 1000 recipes: ~5-10 minutes total
- Use `--limit` for testing
- Run during off-peak hours
- Monitor quota (OpenAI) or use Gemini (free)

## Integration with RAG

Imported recipes are immediately available for:

1. **Recipe Generation**: AI references similar recipes
2. **Chat**: Ask about specific recipes
3. **Search**: Find recipes by ingredients/category
4. **Suggestions**: "Reverse recipe" feature

Example RAG query after import:

```bash
# Generate Phở variant
curl -X POST http://localhost:3000/api/generate-recipe-stream \
  -H "Content-Type: application/json" \
  -d '{
    "dishName": "Phở Chay",
    "categories": ["mon-chay"],
    "servingSize": "4"
  }'

# AI will find imported "Phở" recipes and adapt them!
```

## Next Steps

After successful import:

1. **Reindex Embeddings** (if you change weights):
   ```bash
   npm run reindex:confirm
   ```

2. **Test RAG Quality**:
   - Generate recipes and check "RAG results" in logs
   - Verify similar recipes are found

3. **Fine-tune Categories**:
   - Add more category keywords
   - Manually fix miscategorized recipes

4. **Backup Data**:
   ```bash
   mongodump --uri="$MONGODB_URI" --db=ai_recipe_db
   ```

## Advanced: Programmatic Usage

Use the importer in your own scripts:

```typescript
import { RecipePDFImporter } from './scripts/import-recipes-from-pdf';

const importer = new RecipePDFImporter();

// Connect
await importer.connect();

// Import
await importer.importFromPDF('my-recipes.pdf', {
  dryRun: false,
  limit: 100
});

// Disconnect
await importer.disconnect();
```

## FAQ

**Q: Can I import multiple PDFs?**  
A: Yes, run the script multiple times with different PDF files. Duplicates are auto-skipped.

**Q: What if my PDF is in English/other language?**  
A: Update section keywords and category detection. The tool is language-agnostic for core functionality.

**Q: Can I import from other sources (JSON, CSV, websites)?**  
A: Yes! Create similar import scripts. The core logic (`importRecipe()`) works for any recipe object.

**Q: How do I delete imported recipes?**  
A: Use MongoDB shell:
```javascript
db.recipes.deleteMany({ source: "pdf-import" });
```

**Q: Can I update existing recipes?**  
A: Currently duplicates are skipped. For updates, delete old recipes first or modify the import logic.

## Support

If you encounter issues:

1. Check `TROUBLESHOOTING.md` for common problems
2. Review logs for specific error messages
3. Try `--dry-run` to diagnose parsing issues
4. Check MongoDB connection and credentials

---

**Happy importing! 📚🍳**

