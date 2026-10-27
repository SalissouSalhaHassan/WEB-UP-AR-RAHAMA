import postgres from 'postgres';
const remoteUrl = 'postgres://postgres.gkarotahjtyvmhjqejts:salissou1994S@aws-1-eu-central-2.pooler.supabase.com:6543/postgres';

async function run() {
  const sql = postgres(remoteUrl, { prepare: false, ssl: { rejectUnauthorized: false } });
  const stds = await sql`SELECT id, school_id, num_admission, nom_etudiant, classe, educational_level, frais_mensuels, ancien_solde, frais_inscription, frais_transport, frais_cantine, frais_assurance, frais_coges_card, frais_transport_internat FROM students WHERE nom_etudiant ILIKE '%LAMINOU%' OR num_admission ILIKE '%AM-2026-0006%'`;
  console.log('STUDENTS:', JSON.stringify(stds, null, 2));
  
  if (stds.length > 0) {
    const sId = stds[0].id;
    const fees = await sql`SELECT * FROM student_fees WHERE student_id = ${sId}`;
    console.log('STUDENT_FEES:', JSON.stringify(fees, null, 2));
    
    if (fees.length > 0) {
      for (const f of fees) {
        const pmts = await sql`SELECT * FROM fee_payments WHERE fee_id = ${f.id}`;
        console.log(`PAYMENTS FOR FEE ${f.id}:`, JSON.stringify(pmts, null, 2));
      }
    }
  }

  // Also check feePayments table for recent payments recorded
  const recentPmts = await sql`SELECT * FROM fee_payments ORDER BY id DESC LIMIT 5`;
  console.log('RECENT PAYMENTS IN DB:', JSON.stringify(recentPmts, null, 2));

  await sql.end();
}
run().catch(console.error);
