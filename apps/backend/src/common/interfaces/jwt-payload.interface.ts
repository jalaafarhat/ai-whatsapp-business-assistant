export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  organizationId: string;
  iat?: number;
  exp?: number;
}
