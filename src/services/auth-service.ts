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
  SignUpAsCompanyResponse,
  SignUpAsCoolingUserResponse,
  RefreshSessionResponse,
} from "@/types/api.responses";

class AuthService {
  async signIn(params: SignInParams, recaptchaToken?: string): Promise<SignInResponse> {
    const body = recaptchaToken ? { ...params, recaptchaToken } : params;
    const res = await httpClient.post<SignInResponse>("/user/v1/login/", body);
    return res.data;
  }

  async signUpAsCompany(
    params: SignUpAsCompanyParams,
    recaptchaToken?: string
  ): Promise<SignUpAsCompanyResponse> {
    const body = recaptchaToken ? { ...params, recaptchaToken } : params;
    const res = await httpClient.post<SignUpAsCompanyResponse>(
      "/user/v1/service-provider-signup/",
      body
    );
    return res.data;
  }

  async signUpAsCoolingUser(
    params: SignUpAsCoolingUserParams,
    recaptchaToken?: string
  ): Promise<SignUpAsCoolingUserResponse> {
    const { firstName, lastName, phone, password, country, language, coolingUnitId } = params;
    const body = {
      user: { firstName, lastName, phone, password, language, country },
      parentName: "",
      createUser: true,
      ...(coolingUnitId !== undefined && { coolingUnitId }),
      ...(recaptchaToken && { recaptchaToken }),
    };
    const res = await httpClient.post<SignUpAsCoolingUserResponse>("/user/v1/farmers/", body);
    return res.data;
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
