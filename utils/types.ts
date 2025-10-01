
export interface District {
  id: string;
  name: string;
}

export interface Province {
  id: string;
  name: string;
  districts: District[];
}


