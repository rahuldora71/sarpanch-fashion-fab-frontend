export interface AddOn {
  id: number;

  name: string;

  price: number;

  tailorCommission: number;

  imageUrl?: string | null;

  imagePublicId?: string | null;

  beforeCutting: boolean;

  active: boolean;

  createdAt?: string;

  updatedAt?: string;
}
export interface AddOnRequest {
  name: string;
  price: number;
  tailorCommission: number;
  imageUrl?: string;
  imagePublicId?: string;
  beforeCutting?: boolean;
  active?: boolean;
}

export interface AddOnUpdateRequest {
  name?: string;
  price?: number;
  tailorCommission?: number;
  imageUrl?: string;
  imagePublicId?: string;
  beforeCutting?: boolean;
  active?: boolean;
}

export interface AddOnResponse {
  id: number;
  name: string;
  price: number;
  tailorCommission: number;

  imageUrl?: string | null;
  imagePublicId?: string | null;

  beforeCutting: boolean;
  active: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export interface AddOnPageResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  content: AddOnResponse[];
  empty: boolean;
}