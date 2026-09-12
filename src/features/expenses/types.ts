import { ImageAssetReference } from '../../shared/types/image';
import { VersionedEntity } from '../../shared/types/schema';

export interface Currency {
  code: string;
  rate: number;
}

export interface ExpenseComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number | string;
  currency?: string;
  hasServiceFee?: boolean;
  serviceFeePercentage?: number | string;
}

export interface ExpenseV2 extends VersionedEntity {
  id: number;
  amount: number;
  title: string;
  currency: string;
  payer: string;
  paymentMethod: string;
  location: string;
  date: string;
  time: string;
  involvedMembers?: string[];
  settledMembers?: string[];
  imageReferences?: ImageAssetReference[];
  images?: string[]; // Backwards compatibility for UI
  image?: string | null; // Backwards compatibility for UI
  comments?: ExpenseComment[];
  isCreditCard?: boolean;
  hasServiceFee?: boolean;
  serviceFeePercentage?: number;
  category?: 'general' | 'public_fund';
  fundType?: 'deposit' | 'expense';
  expenseType?: 'transport' | 'accommodation' | 'dining' | 'spot' | 'other' | string;
  deletedAt?: number | null;
  deletedBy?: string | null;
}

export type Expense = ExpenseV2;
