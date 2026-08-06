// Matches com.project.farma.organisation.model.OrganisationType
// 1. Role Enum Alternative
export const Role = {
    PROPRIETOR: "PROPRIETOR",
    MANAGER: "MANAGER",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

// 2. OrganisationType Enum Alternative
export const OrganisationType = {
    PRIVATE: 'PRIVATE',
    PUBLIC: 'PUBLIC',
} as const;

export type OrganisationType =
    (typeof OrganisationType)[keyof typeof OrganisationType];

// Matches com.project.farma.organisation.dto.OrganisationRequestDto EXACTLY
export interface OrganisationRequestDto {
    name: string;
    organisationType: OrganisationType;
    email: string;
    registrationNumber: string;
    adminFirstName: string;
    adminLastName: string;
    password: string;
}

// Matches com.project.farma.user.dto.UserRequestDto
export interface UserRequestDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: Role;
    organisationId: number;
    parentId: number | null; // Mapped from Long
}

// Matches com.project.farma.user.dto.LoginRequestDto
export interface LoginRequestDto {
    email: string;
    password: string;
}

// Matches com.project.farma.user.dto.AuthResponseDto
export interface AuthResponseDto {
    token: string;
    email: string;
    role: Role;
    organisationId: number | null;
    userId?: number;
}

// Matches com.project.farma.user.dto.UserResponseDto
export interface UserResponseDto {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    organisationId: number;
    parentId: number | null;
    createdAt: string;
}
