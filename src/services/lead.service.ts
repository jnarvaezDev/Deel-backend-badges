import pool from "../db";

const UNEMPLOYED_JOB_TITLE_FALLBACK = "Not applicable";

type CreateLeadPayload = {
  firstName: string;
  lastName: string;
  email: string;
  employmentStatus?: "employed" | "unemployed";
  currentJobTitle?: string;
  jobTitle?: string;
  job?: string;
  currentCountry: string;
};

export async function createOrUpdateLead(
  payload: CreateLeadPayload
) {
  const { firstName, lastName, email, employmentStatus, currentJobTitle, jobTitle, job, currentCountry } = payload;
  const name = `${firstName} ${lastName}`.trim();
  const resolvedEmploymentStatus = employmentStatus ?? "employed";
  const providedJobTitle = currentJobTitle ?? jobTitle ?? job ?? null;
  const normalizedJobTitle = providedJobTitle?.trim() || null;
  const resolvedCurrentJobTitle = resolvedEmploymentStatus === "unemployed"
    ? normalizedJobTitle ?? UNEMPLOYED_JOB_TITLE_FALLBACK
    : normalizedJobTitle;

  await pool.query(
    `
    INSERT INTO leads (
      name,
      email,
      employment_status,
      current_job_title,
      current_country
    )
    VALUES ($1, $2, $3, $4, $5)

    ON CONFLICT (email)
    DO UPDATE SET
      name = EXCLUDED.name,
      employment_status = EXCLUDED.employment_status,
      current_job_title = EXCLUDED.current_job_title,
      current_country = EXCLUDED.current_country,
      updated_at = NOW()
    `,
    [name, email, resolvedEmploymentStatus, resolvedCurrentJobTitle, currentCountry]
  );

  return {
    success: true,
  };
}
