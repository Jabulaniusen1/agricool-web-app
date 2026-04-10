import { httpClient } from "./http-client";
import {
  SignInParams,
  SignUpAsCompanyParams,
  SignUpAsCoolingUserParams,
  SignupEmployeeByInviteParams,
  SignupOperatorByInviteParams,
} from "@/types/api.params";
import {
  SignInResponse,
  RefreshSessionResponse,
} from "@/types/api.responses";
import { ERoles } from "@/types/global";

// Backend returns plain strings; map them to the ERoles enum used by the web app.
// Backend values: "Farmer" | "Operator" | "Service Provider"
const BACKEND_ROLE_MAP: Record<string, ERoles> = {
  "Farmer":           ERoles.FARMER,
  "Operator":         ERoles.OPERATOR,
  "Service Provider": ERoles.SERVICE_PROVIDER,
};

class AuthService {
  async signIn(params: SignInParams, recaptchaToken?: string): Promise<SignInResponse> {
    const body = recaptchaToken ? { ...params, recaptchaToken } : params;
    const res = await httpClient.post<SignInResponse>("/user/v1/login/", body);
    // The backend puts `role` at the top level of the response, not inside `user`.
    // Merge it into the user object so callers can do setSession(tokens, res.user)
    // and get res.user.role populated correctly.
    if (res.data.role) {
      res.data.user.role = BACKEND_ROLE_MAP[res.data.role] ?? res.data.user.role;
    }
    return res.data;
  }

  async signUpAsCompany(
    params: SignUpAsCompanyParams,
    recaptchaToken?: string
  ): Promise<SignInResponse> {
    const { firstName, lastName, email, phone, password, companyName, language } = params;
    const body = {
      user: { firstName, lastName, email, phone, password, language },
      company: { name: companyName, country: "NG", currency: "NGN" },
      ...(recaptchaToken && { recaptchaToken }),
    };
    await httpClient.post("/user/v1/service-provider-signup/", body);
    // Backend signup doesn't return tokens — auto-login to get a valid session
    return this.signIn({ username: email, password, userType: "sp" });
  }

  async signUpAsCoolingUser(
    params: SignUpAsCoolingUserParams,
    recaptchaToken?: string
  ): Promise<SignInResponse> {
    const { firstName, lastName, phone, password, language, coolingUnitId } = params;
    const body = {
      user: { firstName, lastName, phone, password, language, country: "NG" },
      parentName: "",
      createUser: true,
      ...(coolingUnitId !== undefined && { coolingUnitId }),
      ...(recaptchaToken && { recaptchaToken }),
    };
    await httpClient.post("/user/v1/farmers/", body);
    // Backend signup doesn't return tokens — auto-login to get a valid session
    return this.signIn({ username: phone, password, userType: "f" });
  }

  async refreshToken(refreshToken: string): Promise<RefreshSessionResponse> {
    const res = await httpClient.post<RefreshSessionResponse>("/user/token/refresh/", {
      refresh: refreshToken,
    });
    return res.data;
  }

  async requestResetPassword(params: { email: string }, recaptchaToken?: string): Promise<void> {
    const body = recaptchaToken ? { ...params, action: "request", recaptchaToken } : { ...params, action: "request" };
    await httpClient.post("/user/v1/reset-password/", body);
  }

  async resetPassword(
    params: { uid: string; token: string; newPassword: string },
    recaptchaToken?: string
  ): Promise<void> {
    const body = recaptchaToken
      ? { ...params, action: "reset", recaptchaToken }
      : { ...params, action: "reset" };
    await httpClient.post("/user/v1/reset-password/", body);
  }

  async signUpEmployeeByInvite(params: SignupEmployeeByInviteParams): Promise<void> {
    await httpClient.post("/user/v1/service-provider-invite-signup/", params);
  }

  async signUpOperatorByInvite(params: SignupOperatorByInviteParams): Promise<void> {
    await httpClient.post("/user/v1/operator-invite-signup/", params);
  }

  async logout(refreshToken: string): Promise<void> {
    await httpClient.post("/user/v1/logout/", { refresh: refreshToken });
  }
}

export const authService = new AuthService();
