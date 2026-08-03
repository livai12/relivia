export type Patient = {
  id: string;
  caregiver_id: string;
  name: string;
  age: number | null;
  note: string | null;
  created_at: string;
};

export type DailyCheckin = {
  id: string;
  patient_id: string;
  checkin_date: string;
  mood: number;
  sleep_quality: number;
  social_interaction: number;
  medication_taken: boolean;
  free_text_note: string | null;
  behavior_change_flag: boolean;
  created_at: string;
};

export type AiInsight = {
  id: string;
  patient_id: string;
  generated_at: string;
  risk_category: "low" | "medium" | "high";
  contributing_factors: string[];
  summary_text: string;
};

export type Profile = {
  id: string;
  display_name: string;
  city: string | null;
  total_checkins: number;
  is_verified: boolean;
  created_at: string;
};

export type CommunityPost = {
  id: string;
  author_id: string;
  body: string;
  helpful_count: number;
  created_at: string;
  profiles: { display_name: string; is_verified: boolean; city: string | null } | null;
};
