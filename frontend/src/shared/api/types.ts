// Primitive types shared across every feature — kept here rather than in
// any one feature's api.ts so features can reference "who created/is
// assigned to this" without importing from each other.

export type Role = 'admin' | 'sales_manager';

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
