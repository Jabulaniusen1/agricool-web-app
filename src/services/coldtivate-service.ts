import { httpClient } from "./http-client";
import {
  Company,
  User,
  Farmer,
  FarmerSurvey,
  ServiceProvider,
  OperatorInvite,
  Operator,
  Location,
  CoolingUnit,
  CoolingUnitSpec,
  DashboardProduce,
  Crate,
  Crop,
  CropType,
  Produce,
  SensorData,
  TemperatureHistory,
  CapacityInfo,
  CheckIn,
  CheckOut,
  MoveCheckout,
  Movement,
  MarketSurvey,
  Notification,
  PredictionGraphData,
  PredictionState,
  PredictionMarket,
  ConnectionTestResult,
  UserSensor,
  EcozanSensor,
  PaginatedResponse,
  CoolingUnitCrop,
  FarmerBankAccount,
} from "@/types/global";
import {
  CheckInParams,
  CheckOutParams,
  CreateCoolingUnitParams,
  UpdateCoolingUnitParams,
  CreateLocationParams,
  UpdateLocationParams,
  MovementsQueryParams,
  UpdateUserParams,
  CreateFarmerParams,
  UpdateCompanyParams,
  SendOperatorInviteParams,
  SendServiceProviderInviteParams,
  CreateNotificationParams,
  CreateFarmerSurveyParams,
  CreateCropParams,
  CreateProduceParams,
  AssociateCropWithUnitParams,
  LinkSensorToUserParams,
  CreateEcozenSensorParams,
  CreateMarketSurveyParams,
} from "@/types/api.params";

class ColdtivateService {
  // ─── Companies ───────────────────────────────────────────────────────────────

  async getCompanies(): Promise<Company[]> {
    const res = await httpClient.get<Company[]>("/user/v1/companies/");
    return res.data;
  }

  async getCompany(companyId: number): Promise<Company> {
    const res = await httpClient.get<Company>(`/user/v1/companies/${companyId}/`);
    return res.data;
  }

  async updateCompany(companyId: number, data: UpdateCompanyParams): Promise<Company> {
    const res = await httpClient.patch<Company>(`/user/v1/companies/${companyId}/`, data);
    return res.data;
  }

  // ─── Users ───────────────────────────────────────────────────────────────────

  async getUsers(): Promise<User[]> {
    const res = await httpClient.get<User[]>("/user/v1/users/");
    return res.data;
  }

  async getCurrentUser(): Promise<User> {
    const res = await httpClient.get<User>("/user/v1/users/me/");
    return res.data;
  }

  async getUser(userId: number): Promise<User> {
    const res = await httpClient.get<User>(`/user/v1/users/${userId}/`);
    return res.data;
  }

  async updateUser(userId: number, data: UpdateUserParams): Promise<User> {
    const payload = {
      ...data,
      lastLogin: new Date().toISOString(),
      coolingUnits: null,
    };
    const res = await httpClient.put<User>(`/user/v1/users/${userId}/`, payload);
    return res.data;
  }

  async deleteUser(userId: number): Promise<void> {
    await httpClient.delete(`/user/v1/users/${userId}/`);
  }

  async operatorDeleteFarmer(farmerUserId: number): Promise<void> {
    await httpClient.delete(`/user/v1/users/${farmerUserId}/operator-proxy-delete/`);
  }

  // ─── Farmers ─────────────────────────────────────────────────────────────────

  async getFarmers(params?: { userId?: number; operator?: number; operatorId?: number }): Promise<Farmer[]> {
    const { operatorId, ...rest } = params ?? {};
    const query = operatorId !== undefined ? { ...rest, operator: operatorId } : rest;
    const res = await httpClient.get<Farmer[]>("/user/v1/farmers/", { params: query });
    return res.data;
  }

  async createFarmer(data: CreateFarmerParams, recaptchaToken?: string): Promise<Farmer> {
    const body = recaptchaToken ? { ...data, recaptchaToken } : data;
    const res = await httpClient.post<Farmer>("/user/v1/farmers/", body);
    return res.data;
  }

  async getFarmer(farmerId: number): Promise<Farmer> {
    const res = await httpClient.get<Farmer>(`/user/v1/farmers/${farmerId}/`);
    return res.data;
  }

  async getFarmerByCode(userCode: string): Promise<Farmer> {
    const res = await httpClient.get<Farmer>("/user/v1/farmers/by-code/", { params: { userCode } });
    return res.data;
  }

  async updateFarmer(farmerId: number, data: Partial<Farmer>): Promise<Farmer> {
    const res = await httpClient.patch<Farmer>(`/user/v1/farmers/${farmerId}/`, data);
    return res.data;
  }

  async getFarmerSurveys(): Promise<FarmerSurvey[]> {
    const res = await httpClient.get<FarmerSurvey[]>("/user/v1/farmer-survey/");
    return res.data;
  }

  async createFarmerSurvey(data: CreateFarmerSurveyParams): Promise<FarmerSurvey> {
    const res = await httpClient.post<FarmerSurvey>("/user/v1/farmer-survey/", data);
    return res.data;
  }

  async updateFarmerSurvey(surveyId: number, data: Partial<CreateFarmerSurveyParams>): Promise<FarmerSurvey> {
    const res = await httpClient.patch<FarmerSurvey>(`/user/v1/farmer-survey/${surveyId}/`, data);
    return res.data;
  }

  // ─── Operators ───────────────────────────────────────────────────────────────

  async getOperators(): Promise<Operator[]> {
    const res = await httpClient.get<Operator[]>("/user/v1/operators/");
    return res.data;
  }

  async getOperator(id: number): Promise<Operator> {
    const res = await httpClient.get<Operator>(`/user/v1/operators/${id}/`);
    return res.data;
  }

  // ─── Service Providers (Employees) ───────────────────────────────────────────

  async getServiceProviders(): Promise<ServiceProvider[]> {
    const res = await httpClient.get<ServiceProvider[]>("/user/v1/service-providers/");
    return res.data;
  }

  async getServiceProvider(id: number): Promise<ServiceProvider> {
    const res = await httpClient.get<ServiceProvider>(`/user/v1/service-providers/${id}/`);
    return res.data;
  }

  // ─── Invitations ─────────────────────────────────────────────────────────────

  async sendOperatorInvite(params: SendOperatorInviteParams): Promise<OperatorInvite> {
    const res = await httpClient.post<OperatorInvite>("/user/v1/operator-invite/", params);
    return res.data;
  }

  async getOperatorInvites(): Promise<OperatorInvite[]> {
    const res = await httpClient.get<OperatorInvite[]>("/user/v1/operator-invite/");
    return res.data;
  }

  async getOperatorInvite(code: string): Promise<OperatorInvite> {
    const res = await httpClient.get<OperatorInvite>(`/user/v1/operator-invite/${code}/`);
    return res.data;
  }

  async sendServiceProviderInvite(params: SendServiceProviderInviteParams): Promise<OperatorInvite> {
    const res = await httpClient.post<OperatorInvite>("/user/v1/service-provider-invite/", params);
    return res.data;
  }

  /** @deprecated Use sendServiceProviderInvite instead */
  async inviteServiceProvider(params: { email?: string; role?: string; phone?: string }): Promise<void> {
    await httpClient.post("/user/v1/service-provider-invite/", params);
  }

  async getServiceProviderInvites(params?: { company?: number }): Promise<OperatorInvite[]> {
    const res = await httpClient.get<OperatorInvite[]>("/user/v1/service-provider-invite/", { params });
    return res.data;
  }

  async getServiceProviderInvite(code: string): Promise<OperatorInvite> {
    const res = await httpClient.get<OperatorInvite>(`/user/v1/service-provider-invite/${code}/`);
    return res.data;
  }

  // ─── Notifications ────────────────────────────────────────────────────────────

  async createNotification(data: CreateNotificationParams): Promise<Notification> {
    const res = await httpClient.post<Notification>("/user/v1/notification/", data);
    return res.data;
  }

  // ─── Locations ───────────────────────────────────────────────────────────────

  async getLocations(params?: { companyId?: number }): Promise<Location[]> {
    const res = await httpClient.get<Location[]>("/storage/v1/locations/", { params });
    return res.data;
  }

  async getLocation(locationId: number): Promise<Location> {
    const res = await httpClient.get<Location>(`/storage/v1/locations/${locationId}/`);
    return res.data;
  }

  async createLocation(data: CreateLocationParams): Promise<Location> {
    const { latitude, longitude, ...rest } = data;
    const body = { ...rest, point: `SRID=4326;POINT(${longitude} ${latitude})` };
    const res = await httpClient.post<Location>("/storage/v1/locations/", body);
    return res.data;
  }

  async updateLocation(locationId: number, data: UpdateLocationParams): Promise<Location> {
    const { latitude, longitude, ...rest } = data;
    const body =
      latitude !== undefined && longitude !== undefined
        ? { ...rest, point: `SRID=4326;POINT(${longitude} ${latitude})` }
        : rest;
    const res = await httpClient.put<Location>(`/storage/v1/locations/${locationId}/`, body);
    return res.data;
  }

  async deleteLocation(locationId: number): Promise<void> {
    await httpClient.delete(`/storage/v1/locations/${locationId}/`);
  }

  // ─── Cooling Units ────────────────────────────────────────────────────────────

  async getCoolingUnits(params?: { locationId?: number; companyId?: number }): Promise<CoolingUnit[]> {
    const res = await httpClient.get<CoolingUnit[]>("/storage/v1/cooling-units/", { params });
    return res.data;
  }

  async getCoolingUnit(id: number): Promise<CoolingUnit> {
    const res = await httpClient.get<CoolingUnit>(`/storage/v1/cooling-units/${id}/`);
    return res.data;
  }

  async createCoolingUnit(data: CreateCoolingUnitParams): Promise<CoolingUnit> {
    const payload = {
      name: data.name,
      location: data.locationId,
      cooling_unit_type: data.coolingUnitType,
      capacity_in_metric_tons: data.capacityInMetricTons,
      capacity_in_number_crates: data.capacityInNumberCrates,
      metric: data.metric,
      crops: data.crops ?? [],
      fixed_price: data.pricingType === "FIXED",
      price: data.pricePerUnit,
      public: data.public ?? false,
      power_options: {},
      crate_length: 0,
      crate_width: 0,
      crate_height: 0,
      crate_weight: 25,
    };
    const res = await httpClient.post<CoolingUnit>("/storage/v1/cooling-units/", payload);
    return res.data;
  }

  async updateCoolingUnit(id: number, data: UpdateCoolingUnitParams): Promise<CoolingUnit> {
    const payload = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.locationId !== undefined && { location: data.locationId }),
      ...(data.coolingUnitType !== undefined && { cooling_unit_type: data.coolingUnitType }),
      ...(data.capacityInMetricTons !== undefined && { capacity_in_metric_tons: data.capacityInMetricTons }),
      ...(data.capacityInNumberCrates !== undefined && { capacity_in_number_crates: data.capacityInNumberCrates }),
      ...(data.metric !== undefined && { metric: data.metric }),
      ...(data.crops !== undefined && { crops: data.crops }),
      ...(data.pricingType !== undefined && { fixed_price: data.pricingType === "FIXED" }),
      ...(data.pricePerUnit !== undefined && { price: data.pricePerUnit }),
      ...(data.public !== undefined && { public: data.public }),
    };
    const res = await httpClient.put<CoolingUnit>(`/storage/v1/cooling-units/${id}/`, payload);
    return res.data;
  }

  async deleteCoolingUnit(id: number): Promise<void> {
    await httpClient.delete(`/storage/v1/cooling-units/${id}/`);
  }

  async getCoolingUnitSensorData(id: number): Promise<SensorData[]> {
    const res = await httpClient.get<SensorData[]>(`/storage/v1/cooling-units/${id}/sensor-data/`);
    return res.data;
  }

  async getCoolingUnitCrops(): Promise<CoolingUnitCrop[]> {
    const res = await httpClient.get<CoolingUnitCrop[]>("/storage/v1/cooling-unit-crops/");
    return res.data;
  }

  async getCoolingUnitCapacity(params: { coolingUnitId: number }): Promise<CapacityInfo> {
    const res = await httpClient.get<CapacityInfo>("/storage/v1/cooling-unit-capacity/", { params });
    return res.data;
  }

  async getCoolingUnitTemperatures(params: {
    coolingUnitId: number;
    from?: string;
    to?: string;
  }): Promise<TemperatureHistory[]> {
    const res = await httpClient.get<TemperatureHistory[]>("/storage/v1/cooling-unit-temperatures/", {
      params,
    });
    return res.data;
  }

  async addTemperatureSpec(data: {
    coolingUnitId: number;
    minTemp: number;
    maxTemp: number;
    cropId: number;
  }): Promise<void> {
    await httpClient.post("/storage/v1/cooling-unit-specifications/", data);
  }

  // ─── Produces & Crates ────────────────────────────────────────────────────────

  async getCoolingUnitProduces(coolingUnitId: number): Promise<DashboardProduce[]> {
    const res = await httpClient.get<DashboardProduce[]>(
      `/storage/v1/cooling-units/${coolingUnitId}/produces/`
    );
    return res.data;
  }

  async getFarmerProduces(coolingUnitId: number, farmerId: number): Promise<DashboardProduce[]> {
    const res = await httpClient.get<DashboardProduce[]>(
      `/storage/v1/cooling-units/${coolingUnitId}/farmers/${farmerId}/produces/`
    );
    return res.data;
  }

  async getCrates(params?: { produceId?: number }): Promise<Crate[]> {
    const res = await httpClient.get<Crate[]>("/storage/v1/crates/", { params });
    return res.data;
  }

  async getCrops(): Promise<Crop[]> {
    const res = await httpClient.get<Crop[]>("/storage/v1/crops/");
    return res.data;
  }

  async createCrop(data: CreateCropParams): Promise<Crop> {
    const res = await httpClient.post<Crop>("/storage/v1/crops/", data);
    return res.data;
  }

  async updateCrop(id: number, data: Partial<CreateCropParams>): Promise<Crop> {
    const res = await httpClient.patch<Crop>(`/storage/v1/crops/${id}/`, data);
    return res.data;
  }

  async getCropTypes(): Promise<CropType[]> {
    const res = await httpClient.get<CropType[]>("/storage/v1/crop-types/");
    return res.data;
  }

  async getProduces(params?: { coolingUnit?: number; crop?: number }): Promise<Produce[]> {
    const res = await httpClient.get<Produce[]>("/storage/v1/produces/", { params });
    return res.data;
  }

  async createProduce(data: CreateProduceParams): Promise<Produce> {
    const res = await httpClient.post<Produce>("/storage/v1/produces/", data);
    return res.data;
  }

  async associateCropWithUnit(data: AssociateCropWithUnitParams): Promise<void> {
    await httpClient.post("/storage/v1/cooling-unit-crops/", data);
  }

  async getCoolingUnitSpecs(params?: { coolingUnit?: number; specificationType?: string }): Promise<CoolingUnitSpec[]> {
    const res = await httpClient.get<CoolingUnitSpec[]>("/storage/v1/cooling-unit-specifications/", { params });
    return res.data;
  }

  async createCoolingUnitSpec(data: {
    coolingUnit: number;
    specificationType: "TEMPERATURE" | "HUMIDITY";
    value: number;
  }): Promise<CoolingUnitSpec> {
    const res = await httpClient.post<CoolingUnitSpec>("/storage/v1/cooling-unit-specifications/", data);
    return res.data;
  }

  // ─── Check-In / Check-Out ─────────────────────────────────────────────────────

  async checkIn(data: CheckInParams): Promise<CheckIn> {
    const res = await httpClient.post<CheckIn>("/operation/checkins/", data);
    return res.data;
  }

  async getCheckins(params?: { movementId?: number; code?: string }): Promise<CheckIn[]> {
    const res = await httpClient.get<CheckIn[]>("/operation/checkins/", { params });
    return res.data;
  }

  async getCheckin(id: number): Promise<CheckIn> {
    const res = await httpClient.get<CheckIn>(`/operation/checkins/${id}/`);
    return res.data;
  }

  async updateCheckIn(id: number, data: Partial<CheckInParams>): Promise<CheckIn> {
    const res = await httpClient.patch<CheckIn>(`/operation/checkins/${id}/`, data);
    return res.data;
  }

  async checkOut(data: CheckOutParams): Promise<CheckOut> {
    const res = await httpClient.post<CheckOut>("/operation/checkouts/", data);
    return res.data;
  }

  async getCheckouts(params?: { code?: string }): Promise<CheckOut[]> {
    const res = await httpClient.get<CheckOut[]>("/operation/checkouts/", { params });
    return res.data;
  }

  async getMoveCheckout(code: string): Promise<MoveCheckout> {
    const res = await httpClient.get<MoveCheckout>("/operation/move-checkout/", {
      params: { code },
    });
    return res.data;
  }

  async checkInWithCode(code: string, data: Partial<CheckInParams>): Promise<CheckIn> {
    const res = await httpClient.post<CheckIn>("/operation/move-checkout/", { code, ...data });
    return res.data;
  }

  async sendSmsReport(movementId: number): Promise<void> {
    await httpClient.post(`/operation/checkouts/${movementId}/send_sms_report/`);
  }

  // ─── Movements ───────────────────────────────────────────────────────────────

  async getMovements(params?: MovementsQueryParams): Promise<PaginatedResponse<Movement>> {
    const res = await httpClient.get<PaginatedResponse<Movement>>("/operation/movements/", {
      params,
    });
    return res.data;
  }

  // ─── Usage & Revenue Analysis ─────────────────────────────────────────────────

  async getUsageAnalysis(params: { coolingUnits: number | number[] }): Promise<PaginatedResponse<Movement>> {
    const coolingUnits = Array.isArray(params.coolingUnits)
      ? params.coolingUnits.join(",")
      : params.coolingUnits;
    const res = await httpClient.get<PaginatedResponse<Movement>>("/operation/movements/usage/", {
      params: { coolingUnits },
    });
    return res.data;
  }

  async getRevenueAnalysis(params: {
    coolingUnits: number | number[];
    paymentMethods?: string[];
  }): Promise<PaginatedResponse<Movement>> {
    const coolingUnits = Array.isArray(params.coolingUnits)
      ? params.coolingUnits.join(",")
      : params.coolingUnits;
    const paymentMethods = (params.paymentMethods ?? []).join(",");
    const res = await httpClient.get<PaginatedResponse<Movement>>("/operation/movements/revenue/", {
      params: { coolingUnits, ...(paymentMethods && { paymentMethods }) },
    });
    return res.data;
  }

  // ─── Market Survey ────────────────────────────────────────────────────────────

  async createMarketSurvey(data: CreateMarketSurveyParams): Promise<MarketSurvey> {
    const res = await httpClient.post<MarketSurvey>("/operation/market-survey/", data);
    return res.data;
  }

  async getMarketSurveys(params?: { movement?: number; commodity?: string }): Promise<MarketSurvey[]> {
    const res = await httpClient.get<MarketSurvey[]>("/operation/market-survey/", { params });
    return res.data;
  }

  // ─── Notifications ────────────────────────────────────────────────────────────

  async getNotifications(): Promise<Notification[]> {
    const res = await httpClient.get<Notification[]>("/user/v1/notification/");
    return res.data;
  }

  async markNotificationRead(id: number): Promise<Notification> {
    const res = await httpClient.put<Notification>(`/user/v1/notification/${id}/`, {
      isRead: true,
    });
    return res.data;
  }

  // ─── Price Predictions ────────────────────────────────────────────────────────

  async getPredictionStates(): Promise<PredictionState[]> {
    const res = await httpClient.get<PredictionState[]>("/prediction/states/");
    return res.data;
  }

  async getPredictionStatesNg(): Promise<PredictionState[]> {
    const res = await httpClient.get<PredictionState[]>("/prediction/statesng/");
    return res.data;
  }

  async getPredictionMarkets(params?: { state?: number; country?: "IN" | "NG" }): Promise<PredictionMarket[]> {
    const res = await httpClient.get<PredictionMarket[]>("/prediction/markets/", { params });
    return res.data;
  }

  async getPredictionGraphNigeria(data: { marketId: number; cropId: number }): Promise<PredictionGraphData> {
    const res = await httpClient.post<PredictionGraphData>(
      "/prediction/predictions/get_data_graph_ng",
      data
    );
    return res.data;
  }

  async getPredictionGraphIndia(data: { marketId: number; cropId: number }): Promise<PredictionGraphData> {
    const res = await httpClient.post<PredictionGraphData>(
      "/prediction/predictions/get_data_graph",
      data
    );
    return res.data;
  }

  // ─── Sensors ─────────────────────────────────────────────────────────────────

  async listUserSensors(params?: { user?: number }): Promise<UserSensor[]> {
    const res = await httpClient.get<UserSensor[]>("/storage/v1/user-sensor/", { params });
    return res.data;
  }

  async linkSensorToUser(data: LinkSensorToUserParams): Promise<UserSensor> {
    const res = await httpClient.post<UserSensor>("/storage/v1/user-sensor/", data);
    return res.data;
  }

  async listEcozens(): Promise<EcozanSensor[]> {
    const res = await httpClient.get<EcozanSensor[]>("/storage/v1/ecozen/");
    return res.data;
  }

  async createEcozen(data: CreateEcozenSensorParams): Promise<EcozanSensor> {
    const res = await httpClient.post<EcozanSensor>("/storage/v1/ecozen/", data);
    return res.data;
  }

  async testSensorConnection(data: {
    sensorType: string;
    credentials: Record<string, string>;
  }): Promise<ConnectionTestResult> {
    const res = await httpClient.post<ConnectionTestResult>(
      "/storage/v1/ecozen/test-connection/",
      data
    );
    return res.data;
  }

  async getUserSensors(data: { sources: string[] }): Promise<UserSensor[]> {
    const res = await httpClient.post<UserSensor[]>("/storage/v1/user-sensor/sources/", data);
    return res.data;
  }
}

export const coldtivateService = new ColdtivateService();
