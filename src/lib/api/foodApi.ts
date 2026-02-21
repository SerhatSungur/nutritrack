export interface FoodItem {
    id: string;
    name: string;
    brand: string;
    calories: number; // per 100g/ml
    protein: number;
    carbs: number;
    fat: number;
    unit: string; // 'g' or 'ml'
    servingSize?: string;
    servingQuantity?: number;
}

function parseFoodItem(p: any): FoodItem | null {
    if (!p?.product_name) return null;
    const quantity = p.quantity?.toLowerCase() || '';
    const isFluid = quantity.includes('ml') || (quantity.includes('l') && !quantity.includes('dl') && !quantity.includes('lb'));
    const calories = parseFloat(p.nutriments?.['energy-kcal_100g']) || 0;
    return {
        id: p.id || p.code || Math.random().toString(),
        name: p.product_name,
        brand: p.brands || '',
        calories,
        protein: parseFloat(p.nutriments?.proteins_100g) || 0,
        carbs: parseFloat(p.nutriments?.carbohydrates_100g) || 0,
        fat: parseFloat(p.nutriments?.fat_100g) || 0,
        unit: isFluid ? 'ml' : 'g',
        servingSize: p.serving_size || undefined,
        servingQuantity: parseFloat(p.serving_quantity) || undefined
    };
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
}

export async function searchFood(query: string): Promise<FoodItem[]> {
    if (!query || query.length < 2) return [];
    try {
        const url = `https://de.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=id,code,product_name,brands,nutriments,quantity,serving_size,serving_quantity`;
        const response = await fetchWithTimeout(url, {
            headers: { 'User-Agent': 'NutriTrack - iOS - Version 1.0 - https://github.com/serhatsungur/nutritrack' }
        });
        if (!response.ok) return [];
        const data = await response.json();
        if (!data.products) return [];

        const normalizedQuery = query.toLowerCase().trim();
        const parsedItems = data.products.map(parseFoodItem).filter(Boolean) as FoodItem[];

        return parsedItems.sort((a, b) => {
            const nA = a.name.toLowerCase(), nB = b.name.toLowerCase();
            const exA = nA === normalizedQuery, exB = nB === normalizedQuery;
            if (exA && !exB) return -1;
            if (!exA && exB) return 1;
            const swA = nA.startsWith(normalizedQuery), swB = nB.startsWith(normalizedQuery);
            if (swA && !swB) return -1;
            if (!swA && swB) return 1;
            return nA.length - nB.length;
        });
    } catch (e) {
        console.error('Error fetching food (timeout or network):', e);
        return [];
    }
}

export async function searchFoodByBarcode(barcode: string): Promise<FoodItem | null> {
    try {
        const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=id,code,product_name,brands,nutriments,quantity,serving_size,serving_quantity`;
        const response = await fetchWithTimeout(url, {
            headers: { 'User-Agent': 'NutriTrack - iOS - Version 1.0 - https://github.com/serhatsungur/nutritrack' }
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (data.status !== 1 || !data.product) return null;
        return parseFoodItem(data.product);
    } catch (e) {
        console.error('Barcode lookup error:', e);
        return null;
    }
}
