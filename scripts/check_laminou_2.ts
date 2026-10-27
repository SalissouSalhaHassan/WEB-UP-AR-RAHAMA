import postgres from 'postgres';
const remoteUrl = 'postgres://postgres.gkarotahjtyvmhjqejts:salissou1994S@aws-1-eu-central-2.pooler.supabase.com:6543/postgres';

async function run() {
  const sql = postgres(remoteUrl, { prepare: false, ssl: { rejectUnauthorized: false } });
  
  console.log("=== SEARCH ALL BY MATRICULE OR NAME ===");
  const stds = await sql`SELECT * FROM students WHERE num_admission ILIKE '%0006%' OR nom_etudiant ILIKE '%KABIR%'`;
  console.log('STUDENTS:', JSON.stringify(stds, null, 2));

  console.log("=== SCHOOLS ===");
  const schools = await sql`SELECT id, name FROM schools`;
  console.log('SCHOOLS:', JSON.stringify(schools, null, 2));

  await sql.end();
}
run().catch(console.error);
