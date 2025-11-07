// scripts/import-recipes-from-pdf.ts
import fs from "fs";
import path from "path";
import pdf from "pdf-parse";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { log } from "../src/utils/logger";
import { vectorStoreService } from "../src/services/vector-store.service";
import { ENV } from "../src/config/env";
import { CATEGORY_PROMPT_HINTS, SupportedCategory } from "../src/config/constants";

// Load environment variables
dotenv.config();

interface ParsedRecipe {
  dishName: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  ingredients: Array<{
    name: string;
    quantity: string;
    whereToFind?: string;
  }>;
  steps: Array<{
    stepNumber: number;
    description: string;
    videoUrl?: string;
  }>;
  shoppingTips?: string;
}

class RecipePDFImporter {
  private client: MongoClient | null = null;
  private recipesCollection: any = null;
  private importedCount = 0;
  private skippedCount = 0;
  private errorCount = 0;

  async connect() {
    if (!ENV.MONGODB_ATLAS_URI) {
      throw new Error("MONGODB_ATLAS_URI not configured");
    }

    log.info("Connecting to MongoDB...");
    this.client = new MongoClient(ENV.MONGODB_ATLAS_URI);
    await this.client.connect();
    
    const db = this.client.db(ENV.MONGODB_ATLAS_DB_NAME);
    this.recipesCollection = db.collection(ENV.MONGODB_ATLAS_COLLECTION_NAME);
    
    log.db.connected();
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      log.db.disconnected();
    }
  }

  /**
   * Extract text from PDF file
   */
  async extractTextFromPDF(pdfPath: string): Promise<string> {
    log.info(`Reading PDF: ${pdfPath}`);
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    
    log.info(`PDF extracted: ${data.numpages} pages, ${data.text.length} characters`);
    return data.text;
  }

  /**
   * Parse recipes from extracted text
   * This is a heuristic parser - adjust based on your PDF structure
   */
  parseRecipes(text: string): ParsedRecipe[] {
    const recipes: ParsedRecipe[] = [];
    
    // Strategy: Split by common recipe delimiters
    // Adjust these patterns based on your PDF structure
    const recipeBlocks = this.splitIntoRecipeBlocks(text);
    
    log.info(`Found ${recipeBlocks.length} potential recipe blocks`);

    for (const block of recipeBlocks) {
      try {
        const recipe = this.parseRecipeBlock(block);
        if (recipe && this.validateRecipe(recipe)) {
          recipes.push(recipe);
        }
      } catch (error: any) {
        log.warn(`Failed to parse recipe block: ${error.message}`);
      }
    }

    return recipes;
  }

  /**
   * Split text into recipe blocks
   * Customize based on your PDF format
   */
  private splitIntoRecipeBlocks(text: string): string[] {
    // This PDF format pattern:
    // [Dish Name]
    // VẬT LIỆU:
    // [ingredients]
    // CÁCH LÀM:
    // [steps]
    
    const blocks: string[] = [];
    
    // Find all "VẬT LIỆU:" positions
    const regex = /VẬT\s*LIỆU:/gi;
    const matches: number[] = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      matches.push(match.index);
    }
    
    log.debug(`Found ${matches.length} VẬT LIỆU markers`);
    
    // Extract blocks - from title before VẬT LIỆU to before next VẬT LIỆU
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i];
      const end = i < matches.length - 1 ? matches[i + 1] : text.length;
      
      // Look backwards from VẬT LIỆU to find dish name (typically 100-500 chars before)
      const lookback = 500;
      const titleStart = Math.max(0, start - lookback);
      const fullBlock = text.substring(titleStart, end);
      
      // Must have CÁCH LÀM
      if (fullBlock.match(/CÁCH\s+(LÀM|CHẾ BIẾN)/i)) {
        blocks.push(fullBlock);
      }
    }
    
    log.debug(`Created ${blocks.length} recipe blocks`);
    return blocks;
  }

  /**
   * Parse a single recipe block into structured data
   */
  private parseRecipeBlock(block: string): ParsedRecipe | null {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    if (lines.length < 5) return null;

    // Extract dish name - look for Vietnamese recipe name pattern before VẬT LIỆU
    // Pattern: Usually a line with Vietnamese food name (may have capital letters, diacritics)
    // Examples: "Trứng xào rau thập cẩm", "Mì căn xào cải làn"
    
    let dishName = "";
    const vatLieuIndex = lines.findIndex(l => l.match(/^VẬT\s*LIỆU/i));
    
    if (vatLieuIndex > 0) {
      // Look backwards for dish name - should be a clean line with food name
      // Filter out numbers, noise, and previous recipe content
      const candidateLines = lines.slice(0, vatLieuIndex)
        .filter(l => {
          // Skip short lines, numbers, common noise words
          if (l.length < 5 || l.length > 80) return false;
          if (l.match(/^\d+$/)) return false;
          if (l.match(/^(MON|CHAY|NHA|XUAT|BAN|VAN|HOA|THONG|TIN)/i)) return false;
          if (l.match(/^[\.\,\;\:\-\•\*]+$/)) return false;
          // Skip lines that look like previous recipe instructions (ends with period and lowercase)
          if (l.match(/[a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]\.$/)) return false;
          return true;
        });
      
      // Get the last valid line before VẬT LIỆU
      dishName = candidateLines.slice(-1)[0] || "";
      
      // If still looks wrong (too long, has period at end), try previous line
      if (dishName && (dishName.length > 60 || dishName.endsWith('.'))) {
        dishName = candidateLines.slice(-2, -1)[0] || dishName;
      }
    }
    
    // Clean up dish name
    dishName = dishName.replace(/^\d+[\.\-•\*]\s*/, '').trim();
    dishName = dishName.replace(/^(Công thức|Món|Recipe)[\:\-]\s*/i, '').trim();
    dishName = dishName.replace(/\.$/, '').trim(); // Remove trailing period
    
    if (!dishName || dishName.length < 5 || dishName.length > 100) {
      log.debug(`Skipping recipe with invalid name: "${dishName}"`);
      return null;
    }

    // Find sections - VẬT LIỆU and CÁCH LÀM
    const ingredientsStart = this.findSectionStart(lines, ['vật liệu', 'nguyên liệu', 'ingredients']);
    const stepsStart = this.findSectionStart(lines, ['cách làm', 'cách chế biến', 'steps', 'instructions']);
    
    if (ingredientsStart < 0 || stepsStart < 0) {
      log.debug(`Skipping recipe missing sections: ${dishName}`);
      return null;
    }

    // Extract ingredients (between VẬT LIỆU and CÁCH LÀM)
    const ingredientLines = lines.slice(ingredientsStart + 1, stepsStart);
    const ingredients = this.extractIngredients(ingredientLines);

    // Extract steps (after CÁCH LÀM)
    const stepLines = lines.slice(stepsStart + 1);
    const steps = this.extractSteps(stepLines);

    // Extract description from ingredients or context
    const description = ingredients.slice(0, 3).map(i => i.name).join(', ') || `Món ăn ${dishName}`;

    // Estimate times (you may want to extract these from text)
    const prepTime = this.extractTime(block, 'chuẩn bị') || "20 phút";
    const cookTime = this.extractTime(block, 'nấu|hầm|chưng|chiên|xào') || "30 phút";
    const servings = this.extractServings(block) || "4 người";

    return {
      dishName,
      description: description.substring(0, 200),
      prepTime,
      cookTime,
      servings,
      ingredients,
      steps,
      shoppingTips: "Nguyên liệu có thể mua tại chợ truyền thống, siêu thị hoặc cửa hàng thực phẩm.",
    };
  }

  private findSectionStart(lines: string[], keywords: string[]): number {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (keywords.some(kw => line.includes(kw))) {
        return i;
      }
    }
    return -1;
  }

  private extractIngredients(lines: string[]): ParsedRecipe['ingredients'] {
    const ingredients: ParsedRecipe['ingredients'] = [];
    
    for (const line of lines) {
      // Skip empty or section headers
      if (line.length < 3 || /^(cách làm|bước|steps)/i.test(line)) break;
      
      // Common patterns:
      // - "200g thịt ba chỉ"
      // - "2 củ hành"
      // - "Thịt ba chỉ: 200g"
      
      const match = line.match(/^[\-\*•]?\s*(.+?)[\:：]?\s*(.+)?$/);
      
      if (match) {
        const [, part1, part2] = match;
        
        // Try to separate quantity from name
        const quantityMatch = part1.match(/^(\d+[.,]?\d*\s*(?:g|kg|ml|l|cup|tbsp|tsp|muỗng|gram|lít|củ|quả|con|miếng)?)\s+(.+)$/i);
        
        if (quantityMatch) {
          ingredients.push({
            name: quantityMatch[2].trim(),
            quantity: quantityMatch[1].trim(),
          });
        } else if (part2) {
          ingredients.push({
            name: part1.trim(),
            quantity: part2.trim(),
          });
        } else {
          // Fallback: treat whole line as ingredient
          ingredients.push({
            name: part1.trim(),
            quantity: "Vừa đủ",
          });
        }
      }
    }
    
    return ingredients.slice(0, 20); // Limit to 20 ingredients
  }

  private extractSteps(lines: string[]): ParsedRecipe['steps'] {
    const steps: ParsedRecipe['steps'] = [];
    let currentStep = "";
    let stepNumber = 0;

    for (const line of lines) {
      // Check if line starts with step number
      const stepMatch = line.match(/^(?:Bước\s+)?(\d+)[\.\:\)]\s*(.+)/i);
      
      if (stepMatch) {
        // Save previous step
        if (currentStep && stepNumber > 0) {
          steps.push({
            stepNumber,
            description: currentStep.trim(),
          });
        }
        
        stepNumber = parseInt(stepMatch[1]);
        currentStep = stepMatch[2];
      } else if (line.length > 10 && stepNumber > 0) {
        // Continue current step
        currentStep += " " + line;
      } else if (steps.length === 0 && line.length > 10) {
        // First step without number
        stepNumber = 1;
        currentStep = line;
      }
      
      // Stop if we hit a new section or too many steps
      if (steps.length >= 15) break;
    }

    // Add last step
    if (currentStep && stepNumber > 0) {
      steps.push({
        stepNumber,
        description: currentStep.trim(),
      });
    }

    return steps;
  }

  private extractTime(text: string, keyword: string): string | null {
    const regex = new RegExp(`${keyword}[:\\s]+([\\d]+)\\s*(phút|giờ|minutes?|hours?)`, 'i');
    const match = text.match(regex);
    return match ? `${match[1]} ${match[2]}` : null;
  }

  private extractServings(text: string): string | null {
    const match = text.match(/(\d+)\s*(người|phần|servings?|portions?)/i);
    return match ? `${match[1]} ${match[2]}` : null;
  }

  private validateRecipe(recipe: ParsedRecipe): boolean {
    return (
      recipe.dishName.length >= 3 &&
      recipe.ingredients.length >= 2 &&
      recipe.steps.length >= 2
    );
  }

  /**
   * Detect categories based on dish name and ingredients
   */
  private detectCategories(recipe: ParsedRecipe): string[] {
    const categories: Set<string> = new Set();
    const text = `${recipe.dishName} ${recipe.description} ${recipe.ingredients.map(i => i.name).join(' ')}`.toLowerCase();

    // Map keywords to categories
    const categoryKeywords: Record<string, string[]> = {
      'khai-vi': ['gỏi', 'salad', 'khai vị', 'appetizer', 'nem', 'chả giò'],
      'mon-chinh': ['cơm', 'bún', 'phở', 'mì', 'miến', 'canh', 'lẩu', 'noodle', 'rice'],
      'trang-mieng': ['chè', 'bánh', 'dessert', 'ngọt', 'kem', 'pudding'],
      'do-uong': ['nước', 'trà', 'cà phê', 'sinh tố', 'juice', 'drink', 'tea', 'coffee'],
      'mon-chay': ['chay', 'đậu hũ', 'nấm', 'rau', 'vegetarian', 'vegan'],
      'hai-san': ['cá', 'tôm', 'mực', 'nghêu', 'sò', 'hải sản', 'seafood', 'fish', 'shrimp'],
      'thit': ['thịt', 'gà', 'heo', 'bò', 'vịt', 'meat', 'chicken', 'pork', 'beef'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        categories.add(category);
      }
    }

    // Default to mon-chinh if no category detected
    if (categories.size === 0) {
      categories.add('mon-chinh');
    }

    return Array.from(categories);
  }

  /**
   * Import a single recipe to database and vector store
   */
  async importRecipe(recipe: ParsedRecipe): Promise<boolean> {
    try {
      // Check if recipe already exists
      const existing = await this.recipesCollection.findOne({ dishName: recipe.dishName });
      
      if (existing) {
        log.warn(`Recipe already exists: ${recipe.dishName}`);
        this.skippedCount++;
        return false;
      }

      // Detect categories
      const categories = this.detectCategories(recipe);
      const language = "vi"; // Assuming Vietnamese recipes

      // Insert to MongoDB
      await this.recipesCollection.insertOne({
        ...recipe,
        categories,
        language,
        source: "pdf-import",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Add to vector store for RAG
      if (vectorStoreService.isAvailable()) {
        await vectorStoreService.addRecipe(recipe, categories, language);
      }

      log.recipe.stored(recipe.dishName);
      this.importedCount++;
      return true;
    } catch (error: any) {
      log.error(`Failed to import recipe: ${recipe.dishName}`, error);
      this.errorCount++;
      return false;
    }
  }

  /**
   * Main import function
   */
  async importFromPDF(pdfPath: string, options: { dryRun?: boolean; limit?: number } = {}) {
    const { dryRun = false, limit } = options;

    log.info("=".repeat(60));
    log.info("📚 RECIPE PDF IMPORT STARTING");
    log.info("=".repeat(60));
    log.info(`PDF File: ${pdfPath}`);
    log.info(`Dry Run: ${dryRun ? 'YES (no data will be saved)' : 'NO'}`);
    log.info(`Limit: ${limit || 'No limit'}`);
    log.info("");

    // Extract text from PDF
    const text = await this.extractTextFromPDF(pdfPath);

    // Parse recipes
    const recipes = this.parseRecipes(text);
    log.info(`✅ Parsed ${recipes.length} recipes from PDF`);
    log.info("");

    if (dryRun) {
      log.info("📋 DRY RUN - First 5 parsed recipes:");
      recipes.slice(0, 5).forEach((recipe, idx) => {
        log.info(`\n${idx + 1}. ${recipe.dishName}`);
        log.info(`   Description: ${recipe.description.substring(0, 80)}...`);
        log.info(`   Ingredients: ${recipe.ingredients.length}`);
        log.info(`   Steps: ${recipe.steps.length}`);
        log.info(`   Categories: ${this.detectCategories(recipe).join(', ')}`);
      });
      log.info("\n✅ Dry run complete. Use --import to save to database.");
      return;
    }

    // Connect to database
    await this.connect();

    // Initialize vector store
    if (!vectorStoreService.isAvailable()) {
      await vectorStoreService.initialize();
    }

    // Import recipes
    const recipesToImport = limit ? recipes.slice(0, limit) : recipes;
    
    log.info(`📥 Importing ${recipesToImport.length} recipes...`);
    log.info("");

    for (let i = 0; i < recipesToImport.length; i++) {
      const recipe = recipesToImport[i];
      log.info(`[${i + 1}/${recipesToImport.length}] Importing: ${recipe.dishName}`);
      await this.importRecipe(recipe);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    log.info("");
    log.info("=".repeat(60));
    log.info("📊 IMPORT SUMMARY");
    log.info("=".repeat(60));
    log.info(`✅ Imported: ${this.importedCount}`);
    log.info(`⏭️  Skipped (duplicates): ${this.skippedCount}`);
    log.info(`❌ Errors: ${this.errorCount}`);
    log.info(`📚 Total recipes in PDF: ${recipes.length}`);
    log.info("=".repeat(60));

    await this.disconnect();
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const pdfPath = args.find(arg => !arg.startsWith('--')) || 'data.pdf';
  const dryRun = args.includes('--dry-run');
  const doImport = args.includes('--import');
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;

  if (!dryRun && !doImport) {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║           📚 RECIPE PDF IMPORT TOOL                       ║
╚═══════════════════════════════════════════════════════════╝

USAGE:
  npm run import:pdf -- [options] [pdf-file]

OPTIONS:
  --dry-run          Preview recipes without importing
  --import           Actually import to database
  --limit=N          Import only first N recipes

EXAMPLES:
  # Preview recipes (recommended first step)
  npm run import:pdf -- --dry-run

  # Import first 10 recipes (test run)
  npm run import:pdf -- --import --limit=10

  # Import all recipes
  npm run import:pdf -- --import

  # Use custom PDF file
  npm run import:pdf -- --import custom-recipes.pdf

FEATURES:
  ✅ Automatic recipe parsing from PDF
  ✅ Category detection (khai-vi, mon-chinh, etc.)
  ✅ Duplicate detection (skips existing)
  ✅ Vector embeddings for RAG search
  ✅ Progress tracking and error handling

NOTE: Run --dry-run first to verify parsing quality!
`);
    process.exit(0);
  }

  const importer = new RecipePDFImporter();
  
  try {
    await importer.importFromPDF(pdfPath, { dryRun, limit });
    process.exit(0);
  } catch (error: any) {
    log.error("Import failed", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { RecipePDFImporter };

