require('dotenv').config();

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const email = 'admin@iaihorizon.com'; // changez si vous voulez un autre e-mail
  const password = 'VotreMotDePasseSolide123!'; // changez avant d'exécuter
  const nomAdmin = 'Administrateur IAI Horizon';

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert({ email, password_hash, role: 'administrateur' })
    .select('id, email')
    .single();

  if (userErr) {
    console.error('Erreur création user:', userErr.message);
    return;
  }

  const { error: adminErr } = await supabase
    .from('administrateurs')
    .insert({ user_id: user.id, nom: nomAdmin });

  if (adminErr) {
    console.error('Erreur création profil administrateur:', adminErr.message);
    return;
  }

  console.log('✅ Compte administrateur créé avec succès :', user.email);
}

main();
