export type Review = {
  _id: string;
  user: { _id: string; name: string; email: string };
  staff: { _id: string; name: string; email: string };
  rating: number;
  periodStart: string;
  periodEnd: string;
  comments: string;
  createdAt: string;
};

export type ReviewFormData = {
  user?: string;
  staff?: string;
  rating: number;
  periodStart?: string;
  periodEnd?: string;
  comments?: string;
};

export type ReviewBreakdown = {
  "1star": number;
  "2star": number;
  "3star": number;
  "4star": number;
  "5star": number;
};

export type StaffRating = {
  staffId: string;
  staffName?: string;
  averageRating: number;
  totalReviews: number;
  breakdown: ReviewBreakdown;
  reviews: Review[];
};

export type UserReviewFormData = {
  rating: number;
  periodStart: string;
  periodEnd: string;
  comments?: string;
};
