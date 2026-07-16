export type CvMeta = {
  name: string;
  tag: string;
  bio: string;
  contact: { email: string; phone: string; location: string };
  links: { label: string; url: string; icon: string }[];
  summary: string;
  core_skills: string[];
  signals: string[];
  education: { degree: string; school: string; date: string }[];
  languages: { lang: string; level: string }[];
  profile_asset_id: string | null;
  currently_label: string;
  currently_value: string;
  matrix_side_desc: string[];
  human_side_desc: string[];
};

export type Project = {
  slug: string;
  title: string;
  role: string;
  description: string;
  impact: string;
  stack: string[];
  behance_url: string | null;
  external_url: string | null;
};

export type Experience = {
  role: string;
  company: string;
  date_label: string;
  points: string[];
};

export type SkillsGroup = {
  group_name: string;
  tags: string[];
};

export type MatrixNode = {
  node_key: string;
  type: "timeline" | "skill" | "project" | "thought";
  x: number;
  y: number;
  title: string;
  summary: string;
  connections: string[];
  thinking: { phase: string; text: string }[];
};
