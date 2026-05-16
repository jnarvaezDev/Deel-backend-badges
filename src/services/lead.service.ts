import pool from "../db";

type CreateLeadPayload = {
  name: string;
  email: string;
  currentJobTitle?: string;
  jobTitle?: string;
  job?: string;
  currentCountry: string;
};

export async function createOrUpdateLead(
  payload: CreateLeadPayload
) {
  const { name, email, currentJobTitle, jobTitle, job, currentCountry } = payload;
  const resolvedCurrentJobTitle = currentJobTitle ?? jobTitle ?? job ?? null;

  await pool.query(
    `
    INSERT INTO leads (
      name,
      email,
      current_job_title,
      current_country
    )
    VALUES ($1, $2, $3, $4)

    ON CONFLICT (email)
    DO UPDATE SET
      name = EXCLUDED.name,
      current_job_title = EXCLUDED.current_job_title,
      current_country = EXCLUDED.current_country,
      updated_at = NOW()
    `,
    [name, email, resolvedCurrentJobTitle, currentCountry]
  );

  return {
    success: true,
  };
}
