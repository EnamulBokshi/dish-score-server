export interface ICreateTestimonialPayload {
  title?: string;
  feedback: string;
  rating?: number;
}

export interface IUpdateTestimonialPayload {
  title?: string;
  feedback?: string;
  rating?: number;
  userId?: string;
}
