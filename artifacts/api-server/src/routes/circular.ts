import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  CreateItemBody,
  GetItemParams,
  GetDashboardResponse,
  GetItemResponse,
  ListItemsResponse,
  ListPartnersQueryParams,
  ListPartnersResponse,
  ListRewardsResponse,
} from "@workspace/api-zod";
import { db, itemsTable, rewardsTable } from "@workspace/db";

const router: IRouter = Router();

const partnerDirectory = [
  {
    id: 1,
    name: "Recykal Saathi",
    type: "E-waste collection",
    city: "Bengaluru",
    distance: "1.8 km",
    rating: 4.8,
    accepts: ["electronics", "appliances"],
  },
  {
    id: 2,
    name: "The Disposal Company",
    type: "Reuse & donation",
    city: "Mumbai",
    distance: "2.4 km",
    rating: 4.7,
    accepts: ["clothing", "books", "furniture"],
  },
  {
    id: 3,
    name: "Green Yatra",
    type: "Circular collection",
    city: "Delhi",
    distance: "3.1 km",
    rating: 4.6,
    accepts: ["clothing", "books", "electronics", "furniture"],
  },
  {
    id: 4,
    name: "Keshav Repair Works",
    type: "Repair & refurbishment",
    city: "Pune",
    distance: "4.2 km",
    rating: 4.9,
    accepts: ["electronics", "appliances", "furniture"],
  },
];

function chooseRecommendation(category: string, condition: string) {
  if (condition === "unusable") {
    return {
      recommendation: "recycle" as const,
      recommendationReason:
        "This item is ready for responsible recycling so its materials can return to the supply chain.",
      points: 80,
    };
  }

  if (condition === "needs_repair") {
    return {
      recommendation: "refurbish" as const,
      recommendationReason:
        "A small repair could extend this item's useful life and avoid the footprint of a new replacement.",
      points: 120,
    };
  }

  if (category === "clothing" || category === "books" || category === "furniture") {
    return {
      recommendation: "reuse" as const,
      recommendationReason:
        "This item still has useful life left. Passing it on keeps it in circulation and helps someone nearby.",
      points: 150,
    };
  }

  return {
    recommendation: "refurbish" as const,
    recommendationReason:
      "Keeping this product in use is the highest-impact next step. A verified partner can help it find a second life.",
    points: 120,
  };
}

function mapItem(item: typeof itemsTable.$inferSelect) {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    notes: item.notes ?? null,
  };
}

async function seedDemoData() {
  const existingItems = await db.select().from(itemsTable).limit(1);
  if (existingItems.length === 0) {
    const [item] = await db
      .insert(itemsTable)
      .values({
        name: "Samsung Galaxy S10",
        category: "electronics",
        condition: "needs_repair",
        city: "Bengaluru",
        notes: "Screen works, battery needs replacing.",
        recommendation: "refurbish",
        recommendationReason:
          "A small repair could extend this item's useful life and avoid the footprint of a new replacement.",
        status: "verified",
        points: 120,
      })
      .returning();

    await db.insert(rewardsTable).values({
      title: "First circular action",
      points: item?.points ?? 120,
      status: "earned",
      date: "18 Aug 2026",
    });
  }

  const existingRewards = await db.select().from(rewardsTable).limit(1);
  if (existingRewards.length === 0) {
    await db.insert(rewardsTable).values({
      title: "Welcome to Reloop",
      points: 50,
      status: "earned",
      date: "Today",
    });
  }
}

router.get("/dashboard", async (_req, res): Promise<void> => {
  await seedDemoData();
  const items = await db
    .select()
    .from(itemsTable)
    .orderBy(desc(itemsTable.createdAt));
  const rewards = await db
    .select()
    .from(rewardsTable)
    .orderBy(desc(rewardsTable.id));

  const impact = {
    itemsDiverted: items.filter((item) => item.status !== "submitted").length,
    co2Saved: Number((items.length * 18.4).toFixed(1)),
    waterSaved: Number((items.length * 740).toFixed(0)),
    points: rewards.reduce((sum, reward) => sum + reward.points, 0),
  };
  const nextItem = items.find((item) => item.status === "submitted");

  res.json(
    GetDashboardResponse.parse({
      firstName: "Aarav",
      impact,
      recentItems: items.slice(0, 3).map(mapItem),
      recentRewards: rewards.slice(0, 3),
      nextAction: nextItem
        ? `Schedule collection for ${nextItem.name}`
        : "Give another item a second life",
    }),
  );
});

router.get("/items", async (_req, res): Promise<void> => {
  await seedDemoData();
  const items = await db
    .select()
    .from(itemsTable)
    .orderBy(desc(itemsTable.createdAt));
  res.json(ListItemsResponse.parse(items.map(mapItem)));
});

router.post("/items", async (req, res): Promise<void> => {
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const recommendation = chooseRecommendation(
    parsed.data.category,
    parsed.data.condition,
  );
  const [item] = await db
    .insert(itemsTable)
    .values({
      ...parsed.data,
      notes: parsed.data.notes ?? null,
      ...recommendation,
      status: "submitted",
    })
    .returning();

  if (!item) {
    res.status(500).json({ error: "Unable to save item" });
    return;
  }

  await db.insert(rewardsTable).values({
    title: `Submitted ${item.name}`,
    points: item.points,
    status: "pending",
    date: "Today",
  });

  res.status(201).json(GetItemResponse.parse(mapItem(item)));
});

router.get("/items/:id", async (req, res): Promise<void> => {
  const params = GetItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db
    .select()
    .from(itemsTable)
    .where(eq(itemsTable.id, params.data.id));
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(GetItemResponse.parse(mapItem(item)));
});

router.get("/partners", async (req, res): Promise<void> => {
  const parsed = ListPartnersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const city = parsed.data.city?.toLowerCase();
  const partners = city
    ? partnerDirectory.filter((partner) => partner.city.toLowerCase() === city)
    : partnerDirectory;
  res.json(ListPartnersResponse.parse(partners));
});

router.get("/rewards", async (_req, res): Promise<void> => {
  await seedDemoData();
  const rewards = await db
    .select()
    .from(rewardsTable)
    .orderBy(desc(rewardsTable.id));
  res.json(ListRewardsResponse.parse(rewards));
});

export default router;