import { EPickUpMethod } from "./global";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type SignInParams = {
  username: string;
  password: string;
  userType: "f" | "op" | "sp";
};

export type SignUpAsCompanyParams = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  companyName: string;
  country: string;
  language: string;
};

export type SignUpAsCoolingUserParams = {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  country: string;
  language: string;
  coolingUnitId?: number;
};

export type SignupEmployeeByInviteParams = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  inviteCode: string;
};

export type SignupOperatorByInviteParams = {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  inviteCode: string;
};

// ─── Movement ─────────────────────────────────────────────────────────────────

export type CheckInCrateParams = {
  weight: number;
  tag?: string;
  grade?: string;
  harvestDate?: string;
  plannedDays?: number;
};

export type CheckInParams = {
  farmerId: number;
  coolingUnitId: number;
  cropId: number;
  crates: CheckInCrateParams[];
  pricingType?: string;
  pricePerUnit?: number;
};

export type CheckOutCrateParams = {
  crateId: number;
  weight?: number;
};

export type CheckOutParams = {
  produceId: number;
  crates: CheckOutCrateParams[];
};

// ─── Cooling Units ────────────────────────────────────────────────────────────

export type CreateCoolingUnitParams = {
  name: string;
  locationId: number;
  coolingUnitType: string;
  capacityInMetricTons: number;
  capacityInNumberCrates: number;
  metric: string;
  crops: number[];
  pricingType: string;
  pricePerUnit: number;
  currency?: string;
  powerOptions?: string[];
  public?: boolean;
};

export type UpdateCoolingUnitParams = Partial<CreateCoolingUnitParams>;

// ─── Locations ────────────────────────────────────────────────────────────────

export type CreateLocationParams = {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  companyId?: number;
};

export type UpdateLocationParams = Partial<CreateLocationParams>;

// ─── Movements Query ──────────────────────────────────────────────────────────

export type MovementsQueryParams = {
  coolingUnitId?: number;
  farmerId?: number;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

// ─── Marketplace ──────────────────────────────────────────────────────────────

export type ListingsQueryParams = {
  location: number;
  companyId?: number;
  coolingUnitId?: number;
  cropId?: number;
  page?: number;
};

export type SetPickupDetailsParams = {
  pickupDetails: { coolingUnitId: number; pickupMethod: EPickUpMethod }[];
};

export type OrdersQueryParams = {
  status?: string;
  page?: number;
};

// ─── Users ───────────────────────────────────────────────────────────────────

export type UpdateUserParams = {
  phone?: string;
  email?: string;
  gender?: string;
  firstName?: string;
  lastName?: string;
  language?: string;
  isEmailPublic?: boolean;
  isPhonePublic?: boolean;
};

// ─── Farmers ──────────────────────────────────────────────────────────────────

export type CreateFarmerParams = {
  user: {
    phone: string;
    firstName: string;
    lastName: string;
    password: string;
    gender?: string;
    email?: string;
  };
  parentName?: string;
  companies: number[];
  createUser?: boolean;
  userCode?: string;
};

// ─── Companies ────────────────────────────────────────────────────────────────

export type UpdateCompanyParams = {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  country?: string;
  currency?: string;
  crop?: number[];
};

// ─── Invitations ──────────────────────────────────────────────────────────────

export type SendOperatorInviteParams = {
  userId: number;
  phone: string;
  expirationDate?: string;
};

export type SendServiceProviderInviteParams = {
  userId: number;
  phone: string;
  expirationDate?: string;
};

// ─── Notifications ────────────────────────────────────────────────────────────

export type CreateNotificationParams = {
  user: number;
  title: string;
  message: string;
  type: "ALERT" | "INFO" | "WARNING";
};

// ─── Farmer Survey ────────────────────────────────────────────────────────────

export type CreateFarmerSurveyParams = {
  farmer: number;
  farmSize: number;
  cropsGrown: string;
  irrigationMethod: string;
  annualProduction: number;
};

// ─── Crops & Produce ──────────────────────────────────────────────────────────

export type CreateCropParams = {
  name: string;
  cropType: number;
  description?: string;
};

export type CreateProduceParams = {
  crop: number;
  quantity: number;
  unit: string;
  harvestDate?: string;
  description?: string;
};

export type AssociateCropWithUnitParams = {
  coolingUnit: number;
  crop: number;
  optimalTemperature: number;
};

// ─── Sensors ──────────────────────────────────────────────────────────────────

export type LinkSensorToUserParams = {
  user: number;
  sensor: number;
  coolingUnit: number;
};

export type CreateEcozenSensorParams = {
  coolingUnit: number;
  model: string;
  serialNumber: string;
};

// ─── Market Survey ────────────────────────────────────────────────────────────

export type CreateMarketSurveyParams = {
  movement?: number;
  location: string;
  marketPrice: number;
  commodity: string;
  unit: string;
  dateSurveyed: string;
};

// ─── Predictions ──────────────────────────────────────────────────────────────

export type PredictionQueryParams = {
  marketId?: number;
  cropId?: number;
  crop?: string;
  state?: string;
};

// ─── Marketplace ─────────────────────────────────────────────────────────────

export type PlaceOrderParams = {
  deliveryContactId?: number;
  pickupMethod: string;
};

export type SetOrderPickupDetailsParams = {
  pickupMethod: string;
  deliveryContactId?: number;
  pickupDate?: string;
  pickupTime?: string;
  specialInstructions?: string;
};

export type CreateMarketplaceSetupParams = {
  company: number;
  isSellerEnabled: boolean;
  isBuyerEnabled: boolean;
  paystackAccount?: number;
};

// ─── Impact ───────────────────────────────────────────────────────────────────

export type CoolingUnitImpactParams = {
  coolingUnitId: number;
  from: string;
  to: string;
};

export type ImpactSliceParams = {
  companyId: number;
  from: string;
  to: string;
};

export type FarmerImpactParams = {
  farmerId: number;
  from: string;
  to: string;
};
