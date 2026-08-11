import { apiRequest } from "../../lib/api/api.client";
import { LoginCredentials, LoginResponse, User } from "./auth.types";

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
    return apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: credentials,
    });
    }

export async function getMe(token: string): Promise<User> {
    return apiRequest<User>("/auth/me", {
        method: "GET",
        token,
    });
}
