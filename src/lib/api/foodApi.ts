export interface FoodItem {
    id: string;
    name: string;
    brand: string;
    calories: number; // per 100g/ml
    protein: number;
    carbs: number;
    fat: number;
    unit: string; // 'g' or 'ml'
}

export async function searchFood(query: string): Promise<FoodItem[]> {
    if (!query || query.length < 2) return [];

    try {
        const url = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(
            query
        )}&json=1&page_size=20&sort_by=unique_scans_n&fields=id,code,product_name,brands,nutriments,quantity`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'NutriTrack - iOS - Version 1.0 - https://github.com/serhatsungur/nutritrack'
            }
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`API Error (${response.status}):`, text.substring(0, 100));
            return [];
        }

        const data = await response.json();

        if (!data.products) return [];

        return data.products
            .filter((p: any) => p.product_name)
            .map((p: any) => {
                // Determine unit from packaging text
                const quantity = p.quantity?.toLowerCase() || '';
                const isFluid = quantity.includes('ml') || (quantity.includes('l') && !quantity.includes('dl') && !quantity.includes('lb'));

                return {
                    id: p.id || p.code || Math.random().toString(),
                    name: p.product_name,
                    brand: p.brands || '',
                    calories: parseFloat(p.nutriments?.['energy-kcal_100g']) || 0,
                    protein: parseFloat(p.nutriments?.proteins_100g) || 0,
                    carbs: parseFloat(p.nutriments?.carbohydrates_100g) || 0,
                    fat: parseFloat(p.nutriments?.fat_100g) || 0,
                    unit: isFluid ? 'ml' : 'g'
                };
            });
    } catch (error) {
        console.error('Error fetching food:', error);
        return [];
    }
}
