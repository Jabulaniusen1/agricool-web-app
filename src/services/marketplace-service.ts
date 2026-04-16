import { httpClient } from "./http-client";
import {
  Cart,
  CartItem,
  Order,
  SellerOrder,
  AvailableListing,
  ListedCrate,
  Bank,
  PaystackAccount,
  FarmerBankAccount,
  Coupon,
  EligibilityCheckResult,
  PaystackCheckoutResponse,
  PaystackPayResponse,
  DeliveryContact,
  MarketplaceSetup,
  MarketplaceData,
  PaginatedResponse,
} from "@/types/global";
import {
  ListingsQueryParams,
  OrdersQueryParams,
  SetPickupDetailsParams,
  PlaceOrderParams,
  SetOrderPickupDetailsParams,
  CreateMarketplaceSetupParams,
} from "@/types/api.params";

class MarketplaceService {
  private normalizeBanksResponse(data: unknown): Bank[] {
    const toBank = (item: unknown): Bank | null => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;

      const code = String(obj.code ?? obj.bankCode ?? "");
      const name = String(obj.name ?? obj.bankName ?? "");
      const idRaw = obj.id;
      const id = typeof idRaw === "number" ? idRaw : Number(code) || 0;
      const country = String(obj.country ?? obj.countryCode ?? "NG");

      if (!code || !name) return null;
      return { id, code, name, country };
    };

    if (Array.isArray(data)) {
      return data.map(toBank).filter((bank): bank is Bank => bank !== null);
    }

    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      const candidateArrays = [
        obj.results,
        obj.banks,
        obj.bankCodes,
        obj.data,
      ];

      for (const candidate of candidateArrays) {
        if (Array.isArray(candidate)) {
          return candidate.map(toBank).filter((bank): bank is Bank => bank !== null);
        }
      }
    }

    return [];
  }

  // ─── Cart ─────────────────────────────────────────────────────────────────────

  async getCart(): Promise<Cart> {
    const res = await httpClient.get<Cart>("/marketplace/buyer/cart/");
    return res.data;
  }

  async recomputeCart(): Promise<Cart> {
    const res = await httpClient.post<Cart>("/marketplace/buyer/cart/");
    return res.data;
  }

  async addCartItem(data: { listingId: number; quantity?: number }): Promise<CartItem> {
    const res = await httpClient.post<CartItem>("/marketplace/buyer/cart/items/", data);
    return res.data;
  }

  async updateCartItem(itemId: number, data: { quantity: number }): Promise<CartItem> {
    const res = await httpClient.patch<CartItem>(`/marketplace/buyer/cart/items/${itemId}/`, data);
    return res.data;
  }

  async removeCartItem(itemId: number): Promise<void> {
    await httpClient.delete(`/marketplace/buyer/cart/items/${itemId}/`);
  }

  async toggleCartOwnership(): Promise<Cart> {
    const res = await httpClient.post<Cart>("/marketplace/buyer/cart/toggle-ownership/");
    return res.data;
  }

  async applyCoupon(couponCode: string): Promise<Cart> {
    const res = await httpClient.post<Cart>("/marketplace/buyer/cart/", {
      couponCode,
      action: "apply",
    });
    return res.data;
  }

  async clearCoupon(): Promise<Cart> {
    const res = await httpClient.post<Cart>("/marketplace/buyer/cart/", { action: "clear" });
    return res.data;
  }

  async setPickupDetails(data: SetPickupDetailsParams): Promise<Cart> {
    const res = await httpClient.post<Cart>("/marketplace/buyer/cart/set-pickup-details/", data);
    return res.data;
  }

  async getCartDeliveryContacts(): Promise<DeliveryContact[]> {
    const res = await httpClient.get<DeliveryContact[]>(
      "/marketplace/buyer/cart/delivery-contacts/"
    );
    return res.data;
  }

  // ─── Checkout ─────────────────────────────────────────────────────────────────

  async checkoutWithPaystack(data?: {
    deliveryContactId?: number;
  }): Promise<PaystackCheckoutResponse> {
    const res = await httpClient.post<PaystackCheckoutResponse>(
      "/marketplace/buyer/cart/checkout-with-paystack/",
      data
    );
    return res.data;
  }

  async payOrderWithPaystack(orderId: number): Promise<PaystackPayResponse> {
    const res = await httpClient.post<PaystackPayResponse>(
      `/marketplace/buyer/orders/${orderId}/pay-with-paystack/`
    );
    return res.data;
  }

  // ─── Buyer Orders ─────────────────────────────────────────────────────────────

  async getOrders(params?: OrdersQueryParams): Promise<PaginatedResponse<Order>> {
    const res = await httpClient.get<PaginatedResponse<Order>>("/marketplace/buyer/orders/", {
      params,
    });
    return res.data;
  }

  async placeOrder(data: PlaceOrderParams): Promise<{ orderId: string; order: Order; checkoutUrl: string }> {
    const res = await httpClient.post<{ orderId: string; order: Order; checkoutUrl: string }>(
      "/marketplace/buyer/orders/",
      data
    );
    return res.data;
  }

  async getOrder(orderId: number): Promise<Order> {
    const res = await httpClient.get<Order>(`/marketplace/buyer/orders/${orderId}/`);
    return res.data;
  }

  async setOrderPickupDetails(orderId: number, data: SetOrderPickupDetailsParams): Promise<Order> {
    const res = await httpClient.post<Order>(
      `/marketplace/buyer/orders/${orderId}/set-pickup-details/`,
      data
    );
    return res.data;
  }

  async cancelOrder(orderId: number): Promise<void> {
    await httpClient.post(`/marketplace/buyer/orders/${orderId}/cancel/`);
  }

  async getOrderDeliveryContacts(orderId: number): Promise<DeliveryContact[]> {
    const res = await httpClient.get<DeliveryContact[]>(
      `/marketplace/buyer/orders/${orderId}/delivery-contacts/`
    );
    return res.data;
  }

  // ─── Seller Orders (Sales) ────────────────────────────────────────────────────

  async getSellerOrders(params?: OrdersQueryParams): Promise<PaginatedResponse<SellerOrder>> {
    const res = await httpClient.get<PaginatedResponse<SellerOrder>>(
      "/marketplace/seller/orders/",
      { params }
    );
    return res.data;
  }

  // ─── Listings ─────────────────────────────────────────────────────────────────

  async getAvailableListings(params?: ListingsQueryParams): Promise<AvailableListing[]> {
    const res = await httpClient.get<PaginatedResponse<AvailableListing> | AvailableListing[]>(
      "/marketplace/buyer/available-listings/",
      { params }
    );
    const data = res.data;
    return Array.isArray(data) ? data : data.results;
  }

  async getAvailableListing(id: number): Promise<AvailableListing> {
    const res = await httpClient.get<AvailableListing>(`/marketplace/buyer/available-listings/${id}/`);
    return res.data;
  }

  async listCrate(data: {
    crateId: number;
    pricePerUnit: number;
    availableWeightInKg?: number;
    operatorOnBehalfOfSellerUserId?: number;
    operatorOnBehalfOfSellerCompanyId?: number;
  }): Promise<ListedCrate> {
    const res = await httpClient.post<ListedCrate>("/marketplace/seller/listed-crates/", data);
    return res.data;
  }

  async getListedCrates(params?: {
    operatorOnBehalfOfSellerUserId?: number;
    operatorOnBehalfOfSellerCompanyId?: number;
    operatorOnBehalfOfSellerFarmerId?: number;
  }): Promise<ListedCrate[]> {
    const res = await httpClient.get<ListedCrate[]>("/marketplace/seller/listed-crates/", { params });
    return res.data;
  }

  async getListing(crateId: number): Promise<ListedCrate> {
    const res = await httpClient.get<ListedCrate>(`/marketplace/seller/listed-crates/${crateId}/`);
    return res.data;
  }

  async updateListing(crateId: number, data: {
    pricePerUnit?: number;
    availableWeightInKg?: number;
    operatorOnBehalfOfSellerUserId?: number;
    operatorOnBehalfOfSellerCompanyId?: number;
  }): Promise<ListedCrate> {
    const res = await httpClient.patch<ListedCrate>(`/marketplace/seller/listed-crates/${crateId}/`, data);
    return res.data;
  }

  async delistCrate(crateId: number): Promise<void> {
    await httpClient.delete(`/marketplace/seller/listed-crates/${crateId}/`);
  }

  // ─── Payment & Banking ────────────────────────────────────────────────────────

  async getBanks(): Promise<Bank[]> {
    const res = await httpClient.get<unknown>("/marketplace/data/banks/");
    return this.normalizeBanksResponse(res.data);
  }

  async getPaystackAccounts(): Promise<PaystackAccount[]> {
    const res = await httpClient.get<PaystackAccount[]>("/marketplace/seller/paystack-accounts/");
    return res.data;
  }

  async addPaystackAccount(data: {
    accountType: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  }): Promise<PaystackAccount> {
    const res = await httpClient.post<PaystackAccount>(
      "/marketplace/seller/paystack-accounts/",
      { ...data, countryCode: "NG" }
    );
    return res.data;
  }

  async setupFarmerBankAccount(data: {
    farmerId: number;
    accountType: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  }): Promise<void> {
    await httpClient.post(
      "/marketplace/company/setup/users-first-paystack-bank-account/",
      { ...data, countryCode: "NG" }
    );
  }

  async getFarmerBankAccounts(): Promise<FarmerBankAccount[]> {
    const res = await httpClient.get<FarmerBankAccount[]>(
      "/marketplace/company/setup/users-paystack-bank-account/"
    );
    return res.data;
  }

  // ─── Delivery Contacts ────────────────────────────────────────────────────────

  async getDeliveryContacts(): Promise<DeliveryContact[]> {
    const res = await httpClient.get<DeliveryContact[]>(
      "/marketplace/company/delivery-contacts/"
    );
    return res.data;
  }

  async createDeliveryContact(data: {
    name: string;
    phone: string;
    address?: string;
  }): Promise<DeliveryContact> {
    const res = await httpClient.post<DeliveryContact>(
      "/marketplace/company/delivery-contacts/",
      data
    );
    return res.data;
  }

  async deleteDeliveryContact(id: number): Promise<void> {
    await httpClient.delete(`/marketplace/company/delivery-contacts/${id}/`);
  }

  // ─── Eligibility ─────────────────────────────────────────────────────────────

  async checkEligibility(data: { companyId: number }): Promise<EligibilityCheckResult> {
    const res = await httpClient.post<EligibilityCheckResult>(
      "/marketplace/company/setup/eligibility-check/",
      data
    );
    return res.data;
  }

  // ─── Coupons ─────────────────────────────────────────────────────────────────

  async getCoupons(): Promise<Coupon[]> {
    const res = await httpClient.get<Coupon[]>("/marketplace/seller/coupons/");
    return res.data;
  }

  async createCoupon(data: {
    code: string;
    discountPercent?: number;
    discountPercentage?: number;
    discountAmount?: number;
    validFrom?: string;
    validUntil?: string;
    expiresAt?: string;
    maxUsage?: number;
  }): Promise<Coupon> {
    const res = await httpClient.post<Coupon>("/marketplace/seller/coupons/", data);
    return res.data;
  }

  async revokeCoupon(id: number): Promise<void> {
    await httpClient.delete(`/marketplace/seller/coupons/${id}/`);
  }

  // ─── Company Orders ───────────────────────────────────────────────────────────

  async getCompanyOrders(params?: { companyId?: number; status?: string }): Promise<PaginatedResponse<SellerOrder>> {
    const res = await httpClient.get<PaginatedResponse<SellerOrder>>(
      "/marketplace/company/orders/",
      { params }
    );
    return res.data;
  }

  // ─── Marketplace Setup ────────────────────────────────────────────────────────

  async getMarketplaceSetup(): Promise<MarketplaceSetup> {
    const res = await httpClient.get<MarketplaceSetup>("/marketplace/company/setup/");
    return res.data;
  }

  async createMarketplaceSetup(data: CreateMarketplaceSetupParams): Promise<MarketplaceSetup> {
    const res = await httpClient.post<MarketplaceSetup>("/marketplace/company/setup/", data);
    return res.data;
  }

  // ─── Marketplace Reference Data ───────────────────────────────────────────────

  async getMarketplaceData(): Promise<MarketplaceData> {
    const res = await httpClient.get<MarketplaceData>("/marketplace/data/");
    return res.data;
  }
}

export const marketplaceService = new MarketplaceService();
