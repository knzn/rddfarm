export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Auth
export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

// Media
export interface MediaItem {
  _id: string;
  type: "video" | "photo";
  page: "videos" | "breeding" | "photos";
  title: string;
  description: string | null;
  url: string;
  thumbnail: string | null;
  categories: CategoryItem[];
  duration: number | null;
  featured: boolean;
  createdAt: string;
}

// Category
export interface CategoryItem {
  _id: string;
  slug: string;
  label: string;
  mediaTypes: ("video" | "photo")[];
}

// Listing
export interface BloodlineItem {
  name: string;
  closed: boolean;
}

export interface PriceItem {
  category: string;
  amount: number;
}

export interface ListingItem {
  _id: string;
  type: "pahulugan" | "months-old" | "day-old";
  name: string;
  slug: string;
  startDate: string | null;
  releaseDate: string;
  bloodlines: BloodlineItem[];
  prices: PriceItem[];
  isDone: boolean;
  createdAt: string;
}

// Reservation
export interface ReservationOrderItem {
  bloodline: string;
  category: string | null;
  quantity: number;
  unitPrice: number;
}

export interface PaymentScheduleEntry {
  dueDate: string;
  amount: number;
}

export interface ReservationItem {
  _id: string;
  listingId: string;
  listingType: "pahulugan" | "months-old" | "day-old";
  listingSlug: string;
  buyerName: string;
  buyerFacebook: string;
  buyerNumber: string;
  slug: string;
  items: ReservationOrderItem[];
  totalAmount: number;
  downPayment: number;
  balance: number;
  paymentPlan: "full" | "flexible" | "weekly" | "monthly";
  weeklyAmount: number | null;
  monthlyAmount: number | null;
  paymentSchedule: PaymentScheduleEntry[] | null;
  isConfirmed: boolean;
  publicUrl: string;
  messengerUrl: string;
  createdAt: string;
}

// Farm
export interface ExpenseItem {
  _id: string;
  category: string;
  type: "unit" | "direct";
  date: string;
  month: number;
  year: number;
  name?: string;
  unit?: string;
  quantity?: number;
  pricePerUnit?: number;
  totalAmount?: number;
  description?: string;
  amount?: number;
  notes?: string;
  locked: boolean;
}

export interface SaleItem {
  _id: string;
  description: string;
  amount: number;
  date: string;
  month: number;
  year: number;
  paymentStatus: "paid" | "partial" | "unpaid";
  notes?: string;
}

export interface WorkerAdvance {
  _id: string;
  amount: number;
  reason: string | null;
  date: string;
  month: number;
  year: number;
  createdAt: string;
}

export interface WorkerPayment {
  _id: string;
  month: number;
  year: number;
  grossSalary: number;
  totalAdvances: number;
  netPay: number;
  paidAt: string;
}

export interface WorkerItem {
  _id: string;
  name: string;
  position: string;
  monthlySalary: number;
  salaryDay: number;
  photo: string | null;
  address: string | null;
  phoneNumber: string | null;
  fbLink: string | null;
  advances: WorkerAdvance[];
  payments: WorkerPayment[];
}

// Breeding
export interface HenItem {
  _id: string;
  henName: string;
  marking: string | null;
  previousMarking: string | null;
  photo: string | null;
  eggsLaid: number | null;
  chicksHatched: number | null;
  maleCount: number | null;
  femaleCount: number | null;
}

export interface MatingItem {
  _id: string;
  seasonId: string;
  userId: string;
  maleName: string;
  noseGroup: "LN" | "RN" | "DN" | "NONE" | "OVERFLOW" | null;
  sameMarking: boolean | null;
  mandatoryMarking: string | null;
  hens: HenItem[];
  useIndividualHenCount: boolean;
  penEggsLaid: number | null;
  penChicksHatched: number | null;
  penMaleCount: number | null;
  penFemaleCount: number | null;
  malePhoto: string | null;
}

export interface SeasonItem {
  _id: string;
  name: string;
  year: number;
  markingsGenerated: boolean;
  generatedAt: string | null;
  eggsLaid: number | null;
  expectedHatchDate: string | null;
  chicksHatched: number | null;
  hatchRate: number | null;
  maleCount: number | null;
  femaleCount: number | null;
  sexCountDone: boolean;
  sexCountUpdatedAt: string | null;
  createdAt: string;
}

// Dashboard
export interface DashboardData {
  breeding: {
    activeSeason: SeasonItem | null;
    totalMatings: number;
    totalEggsLaid: number;
    totalChicksHatched: number;
    hatchRate: number | null;
  };
  finance: {
    expensesThisMonth: number;
    salesThisMonth: number;
    netIncome: number;
    unpaidWorkers: number;
  };
}

// Marking engine
export interface MarkingAssignment {
  matingId: string;
  maleName: string;
  noseGroup: "LN" | "RN" | "DN" | "NONE" | "OVERFLOW";
  hens: { henName: string; marking: string }[];
}
