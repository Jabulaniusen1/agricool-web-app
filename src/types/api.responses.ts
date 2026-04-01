import { User, Company, Farmer, CoolingUnit } from "./global";

export type SignInResponse = {
  access: string;
  refresh: string;
  role: string;
  user: User;
  parentName?: string;
  company?: Company;
};

export type SignUpAsCompanyResponse = {
  access: string;
  refresh: string;
  user: User;
  company: Company;
};

export type SignUpAsCoolingUserResponse = {
  access: string;
  refresh: string;
  user: User;
  farmer: Farmer;
};

export type RefreshSessionResponse = {
  access: string;
  refresh?: string;
};

export type ApiError = {
  code?: string;
  message: string;
  status: number;
  details?: Record<string, string[]>;
};

export type ConnectionTestResult = {
  connected: boolean;
  message?: string;
};

export type CoolingUnitWithLocation = CoolingUnit & {
  locationName?: string;
  locationAddress?: string;
};
