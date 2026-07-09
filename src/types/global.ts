// ─── Enums ────────────────────────────────────────────────────────────────────

export enum ECropType {
  FRUITS = 1,
  VEGETABLES = 2,
  ROOT_VEGETABLES = 3,
  OTHER = 4,
}

export enum EDateCropped {
  TODAY = "TODAY",
  YESTERDAY = "YESTERDAY",
  DAY_BEFORE = "DAY_BEFORE",
  EVEN_BEFORE = "EVEN_BEFORE",
}

export enum ERoles {
  AUTH = "AUTH",
  COOLING_USER = "COOLING_USER",
  FARMER = "FARMER",
  OPERATOR = "OPERATOR",
  SERVICE_PROVIDER = "SERVICE_PROVIDER",
}

export enum ECoolingUnitMetric {
  CRATES = "CRATES",
  KILOGRAMS = "KILOGRAMS",
}

export enum ECoolingUnitType {
  FARM_GATE_STORAGE_ROOM = "FARM_GATE_STORAGE_ROOM",
  MARKET_STORAGE_ROOM = "MARKET_STORAGE_ROOM",
  MOVABLE_UNIT = "MOVABLE_UNIT",
  OTHER = "OTHER",
}

export enum EPricingType {
  FIXED = "FIXED",
  DAILY = "DAILY",
}

export enum EPickUpMethod {
  PICKUP = "PICKUP",
  DELIVERY = "DELIVERY",
}

export enum EPaymentMethod {
  CASH = "CASH",
  TRANSFER = "TRANSFER",
  MOBILE_MONEY = "MOBILE_MONEY",
  CARD = "CARD",
}

export enum EPaymentGateway {
  PAYSTACK = "PAYSTACK",
  FLUTTERWAVE = "FLUTTERWAVE",
  STRIPE = "STRIPE",
}

export enum EOrderStatus {
  PENDING_PAYMENT = "PENDING_PAYMENT",
  PAID = "PAID",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum EApiGender {
  MALE = "M",
  FEMALE = "F",
  OTHER = "O",
}

export enum EPowerOption {
  SOLAR = "SOLAR",
  DIESEL = "DIESEL",
  GRID = "GRID",
  BIOMASS = "BIOMASS",
}

export enum ENotificationType {
  SENSOR_ERROR = "SENSOR_ERROR",
  TIME_TO_PICKUP = "TIME_TO_PICKUP",
  MARKET_SURVEY = "MARKET_SURVEY",
  FARMER_SURVEY = "FARMER_SURVEY",
  CHECKIN_EDITED = "CHECKIN_EDITED",
  ORDER_REQUIRES_MOVEMENT = "ORDER_REQUIRES_MOVEMENT",
  LISTING_PRICE_UPDATED = "LISTING_PRICE_UPDATED",
}

// ─── Core Models ──────────────────────────────────────────────────────────────

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  gender: EApiGender;
  phone: string;
  email?: string;
  lastLogin: string | null;
  language?: string;
  role?: ERoles;
  username?: string;
};

export type Company = {
  id: number;
  name: string;
  country?: string;
  currency: string;
  hasCoolingUnits?: boolean;
  digitalTwin?: boolean;
  ml4Market?: boolean;
  ml4Quality?: boolean;
  ml4Farmers?: boolean;
  dateJoined?: Date;
  crop: number[];
  logo: string | null;
  bankDetails?: BankDetails;
};

export type BankDetails = {
  bankName: string;
  accountNumber: string;
  accountName: string;
};

export type Pricing = {
  id: number;
  pricingType: EPricingType;
  pricePerUnit: number;
  currency: string;
};

export type CommonPricingType = {
  pricingType: EPricingType;
  price: number;
  pricingId?: number;
};

export type PowerOption = {
  option: EPowerOption;
};

export type CoolingUnitCrop = {
  id: number;
  name: string;
  image?: string;
};

// Entry from GET /storage/v1/cooling-unit-crops/ — a crop assigned to a
// specific cooling unit, with the crop's full details nested in `fullCrop`.
export type CoolingUnitCropEntry = {
  id: number;
  fullCrop: CoolingUnitCrop;
  active: boolean;
  crop: number;
  coolingUnit: number;
  pricing: number | null;
};

export type CommodityInfo = {
  cropId: number;
  cropName: string;
  minTemp: number;
  maxTemp: number;
  minHumidity: number;
  maxHumidity: number;
};

export type SensorDatum = {
  sourceId: string;
  username: string;
  password: string;
  type: string;
};

export type CoolingUnit = {
  id: number;
  name: string;
  location: number;
  metric: ECoolingUnitMetric;
  sensor: boolean;
  sensorList: unknown[];
  capacityInMetricTons: number;
  capacityInNumberCrates: number;
  occupancy: number;
  occupancyModifiedDate: Date;
  coolingUnitType: ECoolingUnitType;
  crops: CoolingUnitCrop[];
  operators: number[];
  latestTemperature: number | null;
  crateWeight: number;
  commodityInfos: CommodityInfo[];
  public: boolean;
  sensorError: boolean;
  canDelete: boolean;
  editableCheckins: boolean;
  commonPricingType: CommonPricingType;
  powerOptions: PowerOption[];
};

export type Location = {
  id: number;
  name: string;
  state: string;
  city: string;
  street: string;
  streetNumber?: number;
  zipCode: string;
  point: string; // WKT: "SRID=4326;POINT(longitude latitude)"
  company?: number;
};

export type Farmer = {
  id: number;
  user: User;
  coolingUnit?: number;
  code: string;
  farmerCode?: string;
  companyId?: number;
};

export type FarmerSurveyCommodity = {
  id?: number;
  cropId: number;
  farmerSurveyId?: number;
  averagePrice: number;
  unit: string;
  quantityTotal: number;
  quantitySelfConsumed: number;
  quantitySold: number;
  quantityBelowMarketPrice: number;
  averageSeasonInMonths: number | null;
  currency: string;
  kgInUnit: number;
  reasonForLoss: string;
  dateFilledIn?: Date | string;
  dateLastModified?: Date | string;
};

export type FarmerSurvey = {
  id: number;
  co: FarmerSurveyCommodity[];
  userType: string;
  experience: boolean;
  experienceDuration: number;
  farmer: number;
  dateFilledIn?: Date | string;
  dateLastModified?: Date | string;
};

export type ServiceProvider = {
  id: number;
  user: User;
  company: number;
  role: ERoles;
};

export type OperatorInvite = {
  code: string;
  email?: string;
  phone?: string;
  coolingUnitId?: number;
  companyId?: number;
  expiresAt?: string;
};

export type Crate = {
  id: number;
  produce: number;
  coolingUnit: number | null;
  weight: number;
  remainingShelfLife: number;
  plannedDays: number | null;
  checkOut?: Date;
  pricing: Pricing[];
  checkinDate: Date;
  name: string;
  cropImage: string;
  movementCode: string;
  currentStorageDays: number;
  tag: string;
  initialWeight: number;
  listedInTheMarketplace?: boolean;
  lockedWithinPendingOrders: boolean;
  calculatedTotalPrice?: number;
  calculatedDailyRate?: number;
  effectivePricingType?: EPricingType;
};

export type DashboardProduce = {
  id: number;
  cropId: number;
  cropName: string;
  cropImage: string;
  movementCode: string;
  owner: string;
  ownerContact: string;
  farmerId?: number;
  ownedByUserId: number;
  checkedInCrates: Crate[];
  cratesAmount: number;
  cratesCombinedCost: number;
  cratesCombinedWeight: number;
  currentStorageDays: number;
  minimumRemainingShelfLife: number;
  plannedDays: number | null;
  hasDigitalTwin: boolean;
  qualityDt: number;
  runDt: boolean;
  checkoutComplete: boolean;
};

export type Crop = {
  id: number;
  name: string;
  image?: string;
};

export type SensorData = {
  id: number;
  coolingUnit: number;
  temperature: number;
  humidity?: number;
  timestamp: string;
};

export type TemperatureHistory = {
  timestamp: string;
  temperature: number;
  humidity?: number;
};

export type CapacityInfo = {
  coolingUnitId: number;
  totalCapacity: number;
  usedCapacity: number;
  availableCapacity: number;
  metric: ECoolingUnitMetric;
};

export type CheckIn = {
  id: number;
  movementCode: string;
  farmer: number;
  coolingUnit: number;
  crop: number;
  crates: Crate[];
  createdAt: string;
};

export type CheckOut = {
  id: number;
  movement: number;
  crates: Crate[];
  createdAt: string;
};

export type MoveCheckout = {
  code: string;
  produce: DashboardProduce;
  coolingUnit: CoolingUnit;
};

export type Movement = {
  id: number;
  movementCode: string;
  type: "IN" | "OUT";
  farmer: Farmer;
  coolingUnit: CoolingUnit;
  crop: CoolingUnitCrop;
  cratesCount: number;
  totalWeight: number;
  createdAt: string;
};

export type MarketSurvey = {
  id: number;
  movement?: number;
  location: string;
  marketPrice: number;
  commodity: string;
  unit: string;
  dateSurveyed: string;
};

export type Notification = {
  id: number;
  type: ENotificationType;
  message: string;
  isRead: boolean;
  createdAt: Date;
  data?: Record<string, unknown>;
};

// ─── Marketplace ──────────────────────────────────────────────────────────────

export type CartItem = {
  id: number;
  crate: Crate;
  quantity: number;
  amount: number;
};

export type Cart = {
  id: number;
  items: CartItem[];
  totalAmount: number;
  totalColdtivateAmount: number;
  totalCoolingFeesAmount: number;
  totalDiscountAmount: number;
  totalPaymentFeesAmount: number;
  totalProduceAmount: number;
  ownedOnBehalfOfCompanyId?: number;
  pickupDetails: { coolingUnitId: number; pickupMethod: EPickUpMethod }[];
  currency: string;
  couponCode?: string;
};

export type OrderItem = {
  id: number;
  crate: Crate;
  price: number;
  weight: number;
};

export type DeliveryContact = {
  id: number;
  name: string;
  phone: string;
  address?: string;
  isDefault?: boolean;
};

export type Order = {
  id: number;
  status: EOrderStatus;
  totalAmount: number;
  currency: string;
  items: OrderItem[];
  createdAt: Date;
  paymentMethod?: EPaymentMethod;
  paymentGateway?: EPaymentGateway;
  pickupDetails?: { coolingUnitId: number; pickupMethod: EPickUpMethod }[];
};

export type SellerOrder = {
  id: number;
  status: EOrderStatus;
  totalAmount: number;
  currency: string;
  buyer?: { name: string; phone: string };
  items: OrderItem[];
  createdAt: Date;
};

export type AvailableListing = {
  id: number;
  crate: Crate;
  coolingUnit: CoolingUnit;
  location: Location;
  crop: CoolingUnitCrop;
  company: Company;
  pricePerKg: number;
  availableWeight: number;
  currency: string;
};

export type ListedCrate = {
  id: number;
  crate: number;
  price: number;
  pricingType: EPricingType;
  currency: string;
};

export type Bank = {
  id: number;
  name: string;
  code: string;
  country: string;
};

export type PaystackAccount = {
  id: number;
  bankName?: string;
  bankCode?: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
};

// FarmerBankAccount defined below near line 636

export type Coupon = {
  id: number;
  createdAt?: string;
  revokedAt?: string | null;
  code: string;
  discountPercent?: number;
  discountPercentage?: number;
  discountAmount?: number;
  expiresAt?: string;
  isActive?: boolean;
  usageCount?: number;
};

export type EligibilityCheckResult = {
  eligible: boolean;
  reason?: string;
};

export type PaystackCheckoutResponse = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

export type PaystackPayResponse = {
  authorizationUrl: string;
  reference: string;
};

// ─── Impact ───────────────────────────────────────────────────────────────────

export type CompanyImpact = {
  companyId: number;
  foodSavedKg: number;
  co2ReductionKg: number;
  farmersServed: number;
  revenue: number;
};

export type IndexedMetric<T> = Record<string, T>;

export type CompanyImpactSlice = {
  compAverageRoomOccupancy?: IndexedMetric<number>;
  compBeneficiaries?: IndexedMetric<number>;
  compCapNumCrates?: IndexedMetric<number>;
  compCapTons?: IndexedMetric<number>;
  compCoolUsers?: IndexedMetric<number>;
  compFarmers?: IndexedMetric<number>;
  compKgIn?: IndexedMetric<number>;
  compKgOut?: IndexedMetric<number>;
  compName?: IndexedMetric<string>;
  compRevenue?: IndexedMetric<number>;
  compRevenueUsd?: IndexedMetric<number>;
  compTraders?: IndexedMetric<number>;
  companyId?: IndexedMetric<number>;
  coolingUnitTypes?: IndexedMetric<{
    farmGateStorageRoom?: number;
    marketStorageRoom?: number;
    movableUnit?: number;
  }>;
  currency?: IndexedMetric<string>;
  reportDate?: IndexedMetric<string>;
};

export type CoolingUnitImpact = {
  coolingUnitId: number;
  foodSavedKg: number;
  utilizationPercent: number;
  turnoverDays: number;
};

export type CoolingUnitImpactSlice = {
  averageRoomOccupancy?: IndexedMetric<number>;
  checkInKgCrop?: IndexedMetric<IndexedMetric<number>>;
  checkOutKgCrop?: IndexedMetric<IndexedMetric<number>>;
  coolingUnitId?: IndexedMetric<number>;
  roomKgIn?: IndexedMetric<number>;
  roomKgOut?: IndexedMetric<number>;
  roomRevenue?: IndexedMetric<number>;
  unitName?: IndexedMetric<string>;
};

export type ImpactMetricDatum = {
  name: string;
  value: number | string;
};

export type ImpactMetricValue = number | string | ImpactMetricDatum | ImpactMetricDatum[];

export type ImpactMetricsRecord = {
  avgBaselineFarmerRevenueMonth?: ImpactMetricValue;
  avgBaselinePercLossMonth?: ImpactMetricValue;
  avgMonthlyFarmerRevenue?: ImpactMetricValue;
  avgMonthlyPercFoodlossEvolution?: ImpactMetricValue;
  avgMonthlyPercLoss?: ImpactMetricValue;
  avgMonthlyPercRevenueIncreaseEvolution?: ImpactMetricValue;
  baselineKgLossMonth?: ImpactMetricValue;
  monthlyKgLoss?: ImpactMetricValue;
  numPostHarvestSurveys?: ImpactMetricValue;
  possiblePostCheckoutSurveyRoom?: ImpactMetricValue;
};

export type Co2Metric = {
  co2Crops?: { co2From?: number; co2To?: number } | string;
  companyId?: string;
  coolingUnitId?: string;
};

export type ImpactSliceData = {
  impactMetrics?: ImpactMetricsRecord | ImpactMetricsRecord[];
  co2Metrics?: Co2Metric[];
};

export type ImpactData = {
  companyId: number;
  from: string;
  to: string;
  monthlySeries: { month: string; foodSavedKg: number; co2ReductionKg: number }[];
  cropBreakdown: { cropId: number; cropName: string; weightKg: number }[];
  coolingUnitUtilization: { coolingUnitId: number; name: string; utilizationPercent: number }[];
};

export type FarmerBaseImpact = {
  farmerId: number;
  totalFoodSavedKg: number;
  totalRevenue: number;
};

export type FarmerImpact = {
  farmerId: number;
  from: string;
  to: string;
  foodSavedKg: number;
  revenue: number;
};

export type ImpactMetrics = {
  farmerId: number;
  metrics: Record<string, number>;
};

// ─── Predictions ──────────────────────────────────────────────────────────────

export type PredictionGraphData = {
  pastValues: { date: string; price: number | null }[];
  forecastValues: { date: string; price: number | null; interpolated?: boolean }[];
};

export type PredictionTableData = Array<{
  state?: string;
  market?: string;
  date: string;
  price: number | null;
}>;

export type PredictionParams = {
  crops: string[];
  states: string[];
};

// ─── Sensors ──────────────────────────────────────────────────────────────────

export type ConnectionTestResult = {
  connected: boolean;
  message?: string;
};

export type UserSensor = {
  id: number;
  name: string;
  source: string;
  coolingUnit?: number;
};

export type CropType = {
  id: number;
  name: string;
  description: string;
};

export type Produce = {
  id: number;
  crop: number;
  quantity: number;
  unit: string;
  harvestDate: string;
  description: string;
};

export type Operator = {
  id: number;
  user: User;
  company: number;
};

export type CoolingUnitSpec = {
  id: number;
  coolingUnit: number;
  specificationType: "TEMPERATURE" | "HUMIDITY";
  value: number;
  datetimeStamp: string;
};

export type EcozanSensor = {
  id: number;
  coolingUnit: number;
  model: string;
  serialNumber: string;
};

export type PredictionState = {
  id: number;
  name: string;
  code: string;
};

export type PredictionMarket = {
  id: number;
  name: string;
  state: number;
  latitude: number;
  longitude: number;
};

export type MarketplaceData = {
  countries: unknown[];
  states: unknown[];
  crops: unknown[];
  coolingUnits: unknown[];
  markets: unknown[];
  bankCodes: unknown[];
};

// ─── Usage & Revenue Analysis ─────────────────────────────────────────────────

export type UsageAnalysisEntry = {
  id: number;
  coolingUnit: number;
  coolingUnitName: string;
  checkInDate: string;
  checkOutDate?: string;
  cropName: string;
  farmerName: string;
  totalWeight: number;
  movementType: "IN" | "OUT";
};

export type RevenueAnalysisEntry = {
  id: number;
  coolingUnit: number;
  coolingUnitName: string;
  date: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  farmerName: string;
};

// ─── FarmerBankAccount ────────────────────────────────────────────────────────

export type FarmerBankAccount = {
  id: number;
  createdAt?: string;
  createdByUser?: number;
  farmer?: number;
  ownedByUser?: number;
  ownedByUserId?: number;
  ownedOnBehalfOfCompany?: number | null;
  accountType?: string;
  bankCode: string;
  bankName?: string;
  accountNumber: string;
  accountName?: string;
  countryCode: string;
  paystackSubaccountCode?: string;
  isDefault?: boolean;
  isDefaultAccount?: boolean;
};

// ─── Pagination ───────────────────────────────────────────────────────────────

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
