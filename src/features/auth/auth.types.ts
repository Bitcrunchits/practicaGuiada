export type UserRole =
    | "ADMIN"
    | "ACADEMIC"
    | "TEACHER"
    | "STUDENT";
export type LoginCredentials = {
  email: string;
  password: string;
};

export type  UserProfile = {
    id: string;
    firstName: string;
    lastName: string;
};

export type User = {
    id: string;
    email: string;
    role: string;
    profile?: UserProfile | null;
};

export type LoginData = {
    accessToken: string;
    user: User;
};

export type LoginResponse = {
    success: true;
    data: LoginData;
    timestamp: string;
};

export type AuthErrorResponse = {
    success: false;
    statusCode: number;
    error: string;
    message: string;
    timestamp: string;
};

export type MeResponse = {
    success: true;
    data: User;
    timestamp: string;
};

