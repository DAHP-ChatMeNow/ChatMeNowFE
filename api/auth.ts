import api from "@/lib/axios";
import { User } from "@/types/user";

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  displayName: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  user: User;
  token: string;
  message?: string;
};

const login = async (payload: LoginPayload) => {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
};

const register = async (payload: RegisterPayload) => {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
};

const getMe = async () => {
  const { data } = await api.get<User>("/auth/getMe");
  return data;
};

export const authService = { login, register, getMe };
