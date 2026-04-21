export interface Offer {
  id?: number;
  title: string;
  description: string;
  location: string;
  published: boolean;
  archived?: boolean;
  createDate?: string | Date;
  updatedAt?: string | Date;
}
