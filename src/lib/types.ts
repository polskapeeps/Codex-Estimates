export const LOCAL_USER_ID = "local-owner";

export const PROJECT_STATUSES = [
  "New",
  "Estimating",
  "Sent",
  "Won",
  "Active",
  "Lost",
  "Limbo",
  "Archived",
] as const;

export const JOB_CATEGORIES = [
  "Painting",
  "Drywall",
  "Flooring",
  "Trim",
  "Handyman",
  "Construction",
  "Other",
] as const;

export const NOTE_TYPES = [
  "Site Visit",
  "Client Request",
  "Measurement",
  "Internal",
  "Follow Up",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type JobCategory = (typeof JOB_CATEGORIES)[number];
export type NoteType = (typeof NOTE_TYPES)[number];
export type EstimateConfidence = "low" | "medium" | "high";
export type PaintSuppliedBy = "contractor" | "client";
export type ScopeType = "interior" | "exterior";
export type ConditionLevel = "good" | "fair" | "poor";
export type PrepLevel = "light" | "normal" | "heavy";
export type ColorChange = "none" | "similar" | "major";
export type AccessDifficulty = "normal" | "ladder" | "high ceiling" | "tight access";
export type Occupancy = "empty" | "occupied";

export type BusinessSettings = {
  id: string;
  userId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  serviceArea: string;
  defaultHourlyRate: number;
  defaultMarkupPercent: number;
  defaultTaxPercent: number;
  taxEnabled: boolean;
  paintCoverageSqftPerGallon: number;
  paintCostPerGallon: number;
  wasteFactor: number;
  defaultCoats: number;
  suppliesPercent: number;
  suppliesMinimum: number;
  standardWindowSqft: number;
  standardDoorSqft: number;
  printFooter: string;
  createdAt: string;
  updatedAt: string;
};

export type Client = {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  billingAddress: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type Project = {
  id: string;
  userId: string;
  clientId: string;
  title: string;
  jobCategory: JobCategory;
  status: ProjectStatus;
  siteAddress: string;
  description: string;
  desiredStartDate: string;
  estimateDueDate: string;
  bidSentAt?: string;
  wonAt?: string;
  lostAt?: string;
  archivedAt?: string;
  roughTotalMin?: number;
  roughTotalMax?: number;
  roughTotalRecommended?: number;
  confidence?: EstimateConfidence;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type ProjectNote = {
  id: string;
  userId: string;
  projectId: string;
  noteType: NoteType;
  body: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type PaintingAreaInput = {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  wallSqft: number;
  ceilingSqft: number;
  doors: number;
  windows: number;
  trimLinearFeet: number;
  openingsSqft: number;
  includeWalls: boolean;
  includeCeiling: boolean;
  includeTrim: boolean;
  includeDoors: boolean;
  notes: string;
};

export type PaintingEstimateInput = {
  scopeType: ScopeType;
  paintSuppliedBy: PaintSuppliedBy;
  coats: number;
  wallHeight: number;
  condition: ConditionLevel;
  prepLevel: PrepLevel;
  colorChange: ColorChange;
  accessDifficulty: AccessDifficulty;
  occupancy: Occupancy;
  prepHours: number;
  areas: PaintingAreaInput[];
  scopeSummary: string;
  exclusions: string;
};

export type EstimateLineItem = {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  laborHoursMin: number;
  laborHoursMax: number;
  laborRate: number;
  laborCostMin: number;
  laborCostMax: number;
  materialCostMin: number;
  materialCostMax: number;
  fixedCost: number;
  markupPercent: number;
  calculatedTotalMin: number;
  calculatedTotalMax: number;
  overrideTotal?: number;
  notes: string;
};

export type EstimateResult = {
  estimateId: string;
  projectId: string;
  templateKey: string;
  subtotalMin: number;
  subtotalMax: number;
  materialsMin: number;
  materialsMax: number;
  laborHoursMin: number;
  laborHoursMax: number;
  laborCostMin: number;
  laborCostMax: number;
  markupAmountMin: number;
  markupAmountMax: number;
  totalMin: number;
  totalMax: number;
  recommendedTotal: number;
  confidence: EstimateConfidence;
  warnings: string[];
  assumptions: string[];
  lineItems: EstimateLineItem[];
};

export type Estimate = {
  id: string;
  userId: string;
  projectId: string;
  templateKey: string;
  versionNumber: number;
  status: "draft" | "saved";
  input: PaintingEstimateInput;
  result: EstimateResult;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type ActivityEvent = {
  id: string;
  userId: string;
  projectId: string;
  eventType: string;
  eventJson: Record<string, unknown>;
  createdAt: string;
};
