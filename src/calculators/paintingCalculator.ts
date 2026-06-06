import { roundMoney } from "../lib/format";
import type {
  BusinessSettings,
  EstimateConfidence,
  EstimateLineItem,
  EstimateResult,
  PaintingAreaInput,
  PaintingEstimateInput,
} from "../lib/types";

const positive = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

const conditionMultiplier = {
  good: 1,
  fair: 1.15,
  poor: 1.35,
};

const prepMultiplier = {
  light: 1,
  normal: 1.15,
  heavy: 1.5,
};

const colorMultiplier = {
  none: 1,
  similar: 1,
  major: 1.2,
};

const occupancyMultiplier = {
  empty: 1,
  occupied: 1.15,
};

const accessMultiplier = {
  normal: 1,
  ladder: 1.15,
  "high ceiling": 1.25,
  "tight access": 1.2,
};

const productionRates = {
  walls: { low: 150, high: 225 },
  ceilings: { low: 100, high: 175 },
  trim: { low: 30, high: 50 },
  doors: { low: 0.5, high: 0.9 },
};

export const blankPaintingArea = (name = "Area"): PaintingAreaInput => ({
  id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  name,
  length: 0,
  width: 0,
  height: 8,
  wallSqft: 0,
  ceilingSqft: 0,
  doors: 0,
  windows: 0,
  trimLinearFeet: 0,
  openingsSqft: 0,
  includeWalls: true,
  includeCeiling: false,
  includeTrim: false,
  includeDoors: false,
  notes: "",
});

export const blankPaintingInput = (settings: BusinessSettings): PaintingEstimateInput => ({
  scopeType: "interior",
  paintSuppliedBy: "contractor",
  coats: settings.defaultCoats,
  wallHeight: 8,
  condition: "fair",
  prepLevel: "normal",
  colorChange: "similar",
  accessDifficulty: "normal",
  occupancy: "occupied",
  prepHours: 0,
  areas: [blankPaintingArea("Primary area")],
  scopeSummary: "Interior painting based on field measurements and listed assumptions.",
  exclusions: "Repairs, hidden damage, specialty coatings, and color changes beyond listed scope are excluded unless added.",
});

const areaWallSqft = (area: PaintingAreaInput, settings: BusinessSettings) => {
  if (positive(area.wallSqft) > 0) {
    return positive(area.wallSqft);
  }

  const length = positive(area.length);
  const width = positive(area.width);
  const height = positive(area.height) || 8;

  if (!length || !width) {
    return 0;
  }

  const standardOpenings =
    positive(area.windows) * settings.standardWindowSqft +
    positive(area.doors) * settings.standardDoorSqft;
  const openings = positive(area.openingsSqft) || standardOpenings;

  return Math.max(0, (length + width) * 2 * height - openings);
};

const areaCeilingSqft = (area: PaintingAreaInput) => {
  if (positive(area.ceilingSqft) > 0) {
    return positive(area.ceilingSqft);
  }

  const length = positive(area.length);
  const width = positive(area.width);

  if (!length || !width) {
    return 0;
  }

  return length * width;
};

const makeLineItem = (
  index: number,
  item: Omit<
    EstimateLineItem,
    | "id"
    | "laborRate"
    | "laborCostMin"
    | "laborCostMax"
    | "markupPercent"
    | "calculatedTotalMin"
    | "calculatedTotalMax"
  >,
  settings: BusinessSettings,
): EstimateLineItem => {
  const laborCostMin = item.laborHoursMin * settings.defaultHourlyRate;
  const laborCostMax = item.laborHoursMax * settings.defaultHourlyRate;
  const subtotalMin = laborCostMin + item.materialCostMin + item.fixedCost;
  const subtotalMax = laborCostMax + item.materialCostMax + item.fixedCost;
  const markupMultiplier = 1 + settings.defaultMarkupPercent / 100;

  return {
    ...item,
    id: `line-${index}`,
    laborRate: settings.defaultHourlyRate,
    laborCostMin: roundMoney(laborCostMin),
    laborCostMax: roundMoney(laborCostMax),
    markupPercent: settings.defaultMarkupPercent,
    calculatedTotalMin: roundMoney(subtotalMin * markupMultiplier),
    calculatedTotalMax: roundMoney(subtotalMax * markupMultiplier),
  };
};

const multiplierFor = (input: PaintingEstimateInput) =>
  conditionMultiplier[input.condition] *
  prepMultiplier[input.prepLevel] *
  colorMultiplier[input.colorChange] *
  occupancyMultiplier[input.occupancy] *
  accessMultiplier[input.accessDifficulty];

const confidenceFor = (
  input: PaintingEstimateInput,
  warnings: string[],
): EstimateConfidence => {
  if (warnings.length >= 3 || input.areas.length === 0) {
    return "low";
  }

  if (warnings.length > 0 || input.prepHours === 0) {
    return "medium";
  }

  return "high";
};

export const calculatePaintingEstimate = (
  estimateId: string,
  projectId: string,
  input: PaintingEstimateInput,
  settings: BusinessSettings,
): EstimateResult => {
  const coats = Math.max(1, positive(input.coats) || settings.defaultCoats);
  const multiplier = multiplierFor(input);
  const warnings: string[] = [];
  const assumptions: string[] = [
    `Labor rate: $${settings.defaultHourlyRate}/hr.`,
    `Markup: ${settings.defaultMarkupPercent}% on direct cost, not margin.`,
    `Paint coverage: ${settings.paintCoverageSqftPerGallon} sq ft/gallon.`,
    `Coats: ${coats}.`,
    `Paint supplied by: ${input.paintSuppliedBy}.`,
  ];

  if (!input.areas.length) {
    warnings.push("No painting areas have been added.");
  }

  let wallSqft = 0;
  let ceilingSqft = 0;
  let trimLf = 0;
  let doorCount = 0;
  let missingMeasurements = 0;

  input.areas.forEach((area) => {
    const hasDirectMeasurement = positive(area.wallSqft) || positive(area.ceilingSqft);
    const hasRoomDimensions = positive(area.length) && positive(area.width);

    if (!hasDirectMeasurement && !hasRoomDimensions) {
      missingMeasurements += 1;
    }

    if (area.includeWalls) {
      wallSqft += areaWallSqft(area, settings);
    }

    if (area.includeCeiling) {
      ceilingSqft += areaCeilingSqft(area);
    }

    if (area.includeTrim) {
      trimLf += positive(area.trimLinearFeet);
    }

    if (area.includeDoors) {
      doorCount += positive(area.doors);
    }
  });

  if (missingMeasurements > 0) {
    warnings.push(`${missingMeasurements} area(s) are missing dimensions or direct square footage.`);
  }

  if (input.prepLevel === "heavy" && input.prepHours === 0) {
    warnings.push("Heavy prep is selected but manual prep hours are still zero.");
  }

  if (input.paintSuppliedBy === "client") {
    assumptions.push("Materials exclude paint cost because the client is supplying paint.");
  }

  const wallHoursMin = (wallSqft * coats * multiplier) / productionRates.walls.high;
  const wallHoursMax = (wallSqft * coats * multiplier) / productionRates.walls.low;
  const ceilingHoursMin = (ceilingSqft * coats * multiplier) / productionRates.ceilings.high;
  const ceilingHoursMax = (ceilingSqft * coats * multiplier) / productionRates.ceilings.low;
  const trimHoursMin = (trimLf * coats * multiplier) / productionRates.trim.high;
  const trimHoursMax = (trimLf * coats * multiplier) / productionRates.trim.low;
  const doorHoursMin = doorCount * coats * productionRates.doors.low * multiplier;
  const doorHoursMax = doorCount * coats * productionRates.doors.high * multiplier;
  const prepHours = positive(input.prepHours);
  const paintableSqft = wallSqft + ceilingSqft;
  const gallonsRaw =
    input.paintSuppliedBy === "contractor"
      ? (paintableSqft * coats * settings.wasteFactor) / settings.paintCoverageSqftPerGallon
      : 0;
  const gallons = Math.ceil(gallonsRaw);
  const paintCost = gallons * settings.paintCostPerGallon;
  const supplies =
    input.paintSuppliedBy === "contractor" && paintCost > 0
      ? Math.max(settings.suppliesMinimum, paintCost * (settings.suppliesPercent / 100))
      : 0;

  const lineItems = [
    makeLineItem(
      1,
      {
        category: "Labor",
        description: "Walls",
        quantity: roundMoney(wallSqft),
        unit: "sq ft",
        laborHoursMin: roundMoney(wallHoursMin),
        laborHoursMax: roundMoney(wallHoursMax),
        materialCostMin: 0,
        materialCostMax: 0,
        fixedCost: 0,
        notes: "Wall production rate adjusted by condition, prep, occupancy, color, and access.",
      },
      settings,
    ),
    makeLineItem(
      2,
      {
        category: "Labor",
        description: "Ceilings",
        quantity: roundMoney(ceilingSqft),
        unit: "sq ft",
        laborHoursMin: roundMoney(ceilingHoursMin),
        laborHoursMax: roundMoney(ceilingHoursMax),
        materialCostMin: 0,
        materialCostMax: 0,
        fixedCost: 0,
        notes: "Ceiling production rate adjusted by job difficulty.",
      },
      settings,
    ),
    makeLineItem(
      3,
      {
        category: "Labor",
        description: "Trim/baseboard",
        quantity: roundMoney(trimLf),
        unit: "linear ft",
        laborHoursMin: roundMoney(trimHoursMin),
        laborHoursMax: roundMoney(trimHoursMax),
        materialCostMin: 0,
        materialCostMax: 0,
        fixedCost: 0,
        notes: "Brush work and masking allowance.",
      },
      settings,
    ),
    makeLineItem(
      4,
      {
        category: "Labor",
        description: "Doors",
        quantity: roundMoney(doorCount),
        unit: "each",
        laborHoursMin: roundMoney(doorHoursMin),
        laborHoursMax: roundMoney(doorHoursMax),
        materialCostMin: 0,
        materialCostMax: 0,
        fixedCost: 0,
        notes: "Door painting allowance per coat.",
      },
      settings,
    ),
    makeLineItem(
      5,
      {
        category: "Prep",
        description: "Prep and patching allowance",
        quantity: roundMoney(prepHours),
        unit: "hours",
        laborHoursMin: roundMoney(prepHours),
        laborHoursMax: roundMoney(prepHours * 1.25),
        materialCostMin: 0,
        materialCostMax: 0,
        fixedCost: 0,
        notes: "Manual allowance for patching, sanding, masking, and setup.",
      },
      settings,
    ),
    makeLineItem(
      6,
      {
        category: "Materials",
        description: "Paint and sundries",
        quantity: gallons,
        unit: "gallons",
        laborHoursMin: 0,
        laborHoursMax: 0,
        materialCostMin: roundMoney(paintCost + supplies),
        materialCostMax: roundMoney(paintCost + supplies),
        fixedCost: 0,
        notes:
          input.paintSuppliedBy === "contractor"
            ? `${gallons} gallon(s) plus supplies allowance.`
            : "Client-supplied paint selected.",
      },
      settings,
    ),
  ].filter((item) => item.quantity > 0 || item.materialCostMin > 0 || item.laborHoursMin > 0);

  const laborHoursMin = lineItems.reduce((sum, item) => sum + item.laborHoursMin, 0);
  const laborHoursMax = lineItems.reduce((sum, item) => sum + item.laborHoursMax, 0);
  const laborCostMin = lineItems.reduce((sum, item) => sum + item.laborCostMin, 0);
  const laborCostMax = lineItems.reduce((sum, item) => sum + item.laborCostMax, 0);
  const materialsMin = lineItems.reduce((sum, item) => sum + item.materialCostMin, 0);
  const materialsMax = lineItems.reduce((sum, item) => sum + item.materialCostMax, 0);
  const totalMin = lineItems.reduce((sum, item) => sum + item.calculatedTotalMin, 0);
  const totalMax = lineItems.reduce((sum, item) => sum + item.calculatedTotalMax, 0);
  const subtotalMin = laborCostMin + materialsMin;
  const subtotalMax = laborCostMax + materialsMax;
  const markupAmountMin = totalMin - subtotalMin;
  const markupAmountMax = totalMax - subtotalMax;
  const recommendedTotal = (totalMin + totalMax) / 2;

  if (totalMin <= 0) {
    warnings.push("Estimate total is zero because no measurable scope has been entered.");
  }

  return {
    estimateId,
    projectId,
    templateKey: "painting",
    subtotalMin: roundMoney(subtotalMin),
    subtotalMax: roundMoney(subtotalMax),
    materialsMin: roundMoney(materialsMin),
    materialsMax: roundMoney(materialsMax),
    laborHoursMin: roundMoney(laborHoursMin),
    laborHoursMax: roundMoney(laborHoursMax),
    laborCostMin: roundMoney(laborCostMin),
    laborCostMax: roundMoney(laborCostMax),
    markupAmountMin: roundMoney(markupAmountMin),
    markupAmountMax: roundMoney(markupAmountMax),
    totalMin: roundMoney(totalMin),
    totalMax: roundMoney(totalMax),
    recommendedTotal: roundMoney(recommendedTotal),
    confidence: confidenceFor(input, warnings),
    warnings,
    assumptions,
    lineItems,
  };
};
