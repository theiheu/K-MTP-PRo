import { Product, Variant } from '../types';

/**
 * Calculates the available stock for a given variant.
 * If the variant is a composite product (has components), the stock is determined
 * by the component with the lowest availability from within the same product.
 * Otherwise, it returns the variant's own stock.
 * @param variant - The variant to calculate stock for.
 * @param allProducts - The complete list of all products to find the parent product and its components.
 * @returns The calculated available stock number.
 */
export const calculateVariantStock = (variant: Variant | null, allProducts: Product[]): number => {
    if (!variant) {
        return 0;
    }

    const isComposite = variant.components && variant.components.length > 0;

    if (!isComposite) {
        return variant.stock;
    }

    // Find the parent product of this variant to look for component variants
    const parentProduct = allProducts.find(p => p.variants.some(v => v.id === variant.id));
    if (!parentProduct) {
        console.warn(`Could not find parent product for variant ID ${variant.id}. Returning base stock.`);
        // As a fallback, composite stock is 0 if its structure can't be verified.
        return 0;
    }


    let maxPossibleKits = Infinity;

    for (const component of variant.components!) {
        const componentVariant = parentProduct.variants.find(v => v.id === component.variantId);
        if (!componentVariant) {
            console.warn(`Component variant with ID ${component.variantId} not found in product ${parentProduct.name}.`);
            // If a single component is missing, we cannot build any kits.
            return 0;
        }
        
        // Assumption: A component part itself cannot be a composite part. We use its direct stock.
        const componentStock = componentVariant.stock;
        
        if (component.quantity <= 0) { // Avoid division by zero or invalid data
            continue;
        }

        const possibleKitsFromThisComponent = Math.floor(componentStock / component.quantity);
        maxPossibleKits = Math.min(maxPossibleKits, possibleKitsFromThisComponent);
    }

    // If no components were found or processed, maxPossibleKits would remain Infinity.
    return maxPossibleKits === Infinity ? 0 : maxPossibleKits;
};
