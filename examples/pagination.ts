import { createState } from "../index.ts";

type Product = { id: number; name: string };

type ProductsState = {
  page: number;
  pageSize: number;
  totalItems: number;
  items: Product[];
  loading: boolean;
};

const [products, watchProducts] = createState<ProductsState>({
  page: 1,
  pageSize: 5,
  totalItems: 0,
  items: [],
  loading: false,
});

// Pretend this hits a real API. It returns a page of products plus the total count.
async function fetchProducts(page: number, pageSize: number) {
  await new Promise((resolve) => setTimeout(resolve, 50));

  const totalItems = 23;
  const start = (page - 1) * pageSize;

  const items: Product[] = Array.from(
    { length: Math.min(pageSize, totalItems - start) },
    (_, index) => ({ id: start + index + 1, name: `Product ${start + index + 1}` }),
  );

  return { items, totalItems };
}

async function loadPage(page: number) {
  products.value = { ...products.value, page, loading: true };

  const { items, totalItems } = await fetchProducts(
    page,
    products.value.pageSize,
  );

  products.value = { ...products.value, items, totalItems, loading: false };
}

watchProducts((current) => {
  const { page, pageSize, totalItems, items, loading } = current.value;

  if (loading) {
    console.log(`loading page ${page}...`);
    return;
  }

  const totalPages = Math.ceil(totalItems / pageSize);
  console.log(`page ${page} of ${totalPages}:`, items.map((item) => item.name));
});

await loadPage(1);
await loadPage(2);
await loadPage(5); // last page, only has the remaining items
