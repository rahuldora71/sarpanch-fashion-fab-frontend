/**
 * Garment & Order Classification Utilities for Tailoring Business.
 *
 * Domain Rules:
 * 1. Base Stitching Rate: Standard labor price defined on the tailoring service (e.g. Coat = ₹2,750, Pant = ₹400).
 * 2. Garment Price: Total garment price charged in the order (e.g. Coat = ₹3,500, Pant = ₹400).
 * 3. Excess Price: When Garment Price > Service Base Price, the difference is showroom fabric!
 *    (e.g. Coat ₹3,500 - ₹2,750 = ₹750 Fabric).
 * 4. Add-ons: Micro customization services (e.g. Pant 2 Add-ons = ₹50) are labor, part of stitching amount.
 * 5. Order Classification:
 *    - STITCHING_ONLY: All garments are customer cloth (fabric amount = ₹0).
 *    - FABRIC_AND_STITCHING: All garments include showroom fabric.
 *    - MIXED: Mixture of customer cloth and showroom fabric garments.
 *    - FABRIC_ONLY: Fabric sale without stitching labor.
 *    - SERVICE_ONLY: Non-garment labor / alteration charges only.
 */

export interface GarmentBreakdown {
  garmentPrice: number;
  serviceBasePrice: number;
  addOnsTotal: number;
  addOnsCount: number;
  stitchingAmount: number;
  fabricAmount: number;
  hasShopFabric: boolean;
  isCustomerFabric: boolean;
}

export interface OrderClassificationResult {
  totalGarments: number;
  shopFabricCount: number;
  customerFabricCount: number;
  totalStitchingAmount: number;
  totalFabricAmount: number;
  classification: "STITCHING_ONLY" | "FABRIC_AND_STITCHING" | "MIXED" | "FABRIC_ONLY" | "SERVICE_ONLY";
  fabricSummary: string;
}

/**
 * Computes exact breakdown of stitching vs showroom fabric for a garment.
 */
export function analyzeGarmentBreakdown(params: {
  garmentPrice: number;
  serviceBasePrice?: number;
  addOnsTotal?: number;
  addOnsCount?: number;
  customerFabric?: boolean;
}): GarmentBreakdown {
  const garmentPrice = Math.max(0, Number(params.garmentPrice) || 0);
  const serviceBasePrice = Math.max(0, Number(params.serviceBasePrice) || 0);
  const addOnsTotal = Math.max(0, Number(params.addOnsTotal) || 0);
  const addOnsCount = Number(params.addOnsCount) || 0;

  const hasExcessPrice = serviceBasePrice > 0 && garmentPrice > serviceBasePrice;
  const explicitlyShopFabric = params.customerFabric === false;

  const hasShopFabric = hasExcessPrice || explicitlyShopFabric;
  let stitchingAmount = 0;
  let fabricAmount = 0;

  if (hasExcessPrice) {
    stitchingAmount = serviceBasePrice + addOnsTotal;
    fabricAmount = garmentPrice - serviceBasePrice;
  } else if (explicitlyShopFabric) {
    stitchingAmount = garmentPrice + addOnsTotal;
    fabricAmount = 0;
  } else {
    stitchingAmount = garmentPrice + addOnsTotal;
    fabricAmount = 0;
  }

  return {
    garmentPrice,
    serviceBasePrice,
    addOnsTotal,
    addOnsCount,
    stitchingAmount,
    fabricAmount,
    hasShopFabric,
    isCustomerFabric: !hasShopFabric,
  };
}

/**
 * Classifies an order based on its garment breakdowns.
 */
export function classifyOrder(
  garments: Array<{
    price: number;
    serviceBasePrice?: number;
    addOnsTotal?: number;
    customerFabric?: boolean;
    hasShopFabric?: boolean;
    fabricAmount?: number;
    stitchingAmount?: number;
  }>,
  additionalChargesTotal = 0
): OrderClassificationResult {
  const totalGarments = garments.length;
  let shopFabricCount = 0;
  let customerFabricCount = 0;
  let totalStitchingAmount = additionalChargesTotal;
  let totalFabricAmount = 0;

  garments.forEach((g) => {
    // If breakdown already provided from backend
    if (g.hasShopFabric !== undefined && g.fabricAmount !== undefined && g.stitchingAmount !== undefined) {
      if (g.hasShopFabric) {
        shopFabricCount++;
      } else {
        customerFabricCount++;
      }
      totalStitchingAmount += g.stitchingAmount;
      totalFabricAmount += g.fabricAmount;
    } else {
      const breakdown = analyzeGarmentBreakdown({
        garmentPrice: g.price,
        serviceBasePrice: g.serviceBasePrice,
        addOnsTotal: g.addOnsTotal,
        customerFabric: g.customerFabric,
      });

      if (breakdown.hasShopFabric) {
        shopFabricCount++;
      } else {
        customerFabricCount++;
      }
      totalStitchingAmount += breakdown.stitchingAmount;
      totalFabricAmount += breakdown.fabricAmount;
    }
  });

  let classification: OrderClassificationResult["classification"];
  if (totalGarments === 0) {
    classification = totalFabricAmount > 0 ? "FABRIC_ONLY" : "SERVICE_ONLY";
  } else if (shopFabricCount === 0) {
    classification = "STITCHING_ONLY";
  } else if (customerFabricCount === 0) {
    classification = "FABRIC_AND_STITCHING";
  } else {
    classification = "MIXED";
  }

  let fabricSummary = "N/A";
  if (totalGarments > 0) {
    if (customerFabricCount === totalGarments) {
      fabricSummary = `Customer Cloth (${customerFabricCount})`;
    } else if (shopFabricCount === totalGarments) {
      fabricSummary = `Shop Fabric (${shopFabricCount})`;
    } else {
      fabricSummary = `Mixed (${customerFabricCount} Cust, ${shopFabricCount} Shop)`;
    }
  }

  return {
    totalGarments,
    shopFabricCount,
    customerFabricCount,
    totalStitchingAmount,
    totalFabricAmount,
    classification,
    fabricSummary,
  };
}
