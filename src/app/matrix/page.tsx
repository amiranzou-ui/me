import "@/styles/matrix.css";
import { getCvMeta, getPublishedProjects, getExperience, getSkillsGroups, getMatrixNodes } from "@/lib/matrix/data";
import MatrixApp from "@/components/matrix/MatrixApp";
import type { CvMeta } from "@/lib/matrix/types";

export const revalidate = 60;

export default async function MatrixPage() {
  const [cvMeta, projects, experience, skillsGroups, nodes] = await Promise.all([
    getCvMeta(),
    getPublishedProjects(),
    getExperience(),
    getSkillsGroups(),
    getMatrixNodes(),
  ]);

  return (
    <MatrixApp
      cvMeta={cvMeta as CvMeta}
      projects={projects}
      experience={experience}
      skillsGroups={skillsGroups}
      nodes={nodes}
    />
  );
}
