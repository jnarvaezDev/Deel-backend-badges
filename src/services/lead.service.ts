import pool from "../db";

type CreateLeadPayload = {
  name: string;
  email: string;
  job: string;
  company: string;
};

export async function createOrUpdateLead(
  payload: CreateLeadPayload
) {
  const { name, email, job, company } = payload;

  await pool.query(
    `
    INSERT INTO leads (
      name,
      email,
      job,
      company
    )
    VALUES ($1, $2, $3, $4)

    ON CONFLICT (email)
    DO UPDATE SET
      name = EXCLUDED.name,
      job = EXCLUDED.job,
      company = EXCLUDED.company,
      updated_at = NOW()
    `,
    [name, email, job, company]
  );

  return {
    success: true,
  };
}