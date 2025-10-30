import { Product } from '../types';

export const cloneProductList = (products: Product[]): Product[] =>
  products.map((product) => ({
    ...product,
    images: [...product.images],
    options: [...product.options],
    variants: product.variants.map((variant) => ({
      ...variant,
      attributes: { ...variant.attributes },
      images: variant.images ? [...variant.images] : undefined,
      components: variant.components
        ? variant.components.map((component) => ({ ...component }))
        : undefined,
    })),
  }));
