export interface Profile {
  id: string;
  name: string;
  dob: string;
  gender: 'male' | 'female';
  region: string;
  cultural_context: 'global' | 'african';
  updated_at: string;
  is_premium: boolean;
  last_plan_id?: string;
  last_assessment_id?: string;
  stripe_customer_id?: string;
}