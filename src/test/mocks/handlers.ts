import { http, HttpResponse } from "msw";
import { MOCK_DROPS, MOCK_PRODUCTS } from "@/lib/drops/mock-data";

export const handlers = [
  // GET /api/shopify/drops — calendar data
  http.get("/api/shopify/drops", () => {
    return HttpResponse.json({ drops: MOCK_DROPS });
  }),

  // GET /api/shopify/drops/[tag] — products for a drop
  http.get("/api/shopify/drops/:tag", () => {
    return HttpResponse.json({ products: MOCK_PRODUCTS });
  }),

  // PATCH /api/shopify/drops/[tag]/bulk — bulk field updates
  http.patch("/api/shopify/drops/:tag/bulk", () => {
    return HttpResponse.json({ ok: true });
  }),

  // POST /api/ai/price-suggest — AI pricing suggestions
  http.post("/api/ai/price-suggest", () => {
    return HttpResponse.json({
      low: 400,
      mid: 550,
      high: 700,
      sources: ["Vestiaire Collective", "The RealReal"],
    });
  }),
];
