"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envoyerMessage = envoyerMessage;
exports.historiqueConversation = historiqueConversation;
const supabase_1 = require("../config/supabase");
const gemini_client_1 = require("./gemini.client");
const scoring_service_1 = require("../scoring/scoring.service");

async function envoyerMessage(etudiantId, conversationId, message) {
    // 1. Récupérer le contexte complet de l'étudiant
    const [
        { data: etudiant },
        { data: competences },
        { data: interets },
        { data: notes },
        { data: offres },
        scores,
        { data: conversation }
    ] = await Promise.all([
        supabase_1.supabaseAdmin.from('etudiants').select('nom, prenom, niveau, filiere, specialite, cv_nom_fichier').eq('id', etudiantId).single(),
        supabase_1.supabaseAdmin.from('etudiant_competences').select('competence_nom, niveau').eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('etudiant_interets').select('domaine').eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('etudiant_notes').select('semestre, nom_fichier').eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('offres').select('id, titre, type, entreprises(nom)').eq('statut', 'validee').limit(5),
        (0, scoring_service_1.calculerScoresFilieres)(etudiantId),
        conversationId
            ? supabase_1.supabaseAdmin.from('ia_conversations').select('id').eq('id', conversationId).single()
            : supabase_1.supabaseAdmin.from('ia_conversations').insert({ etudiant_id: etudiantId }).select('id').single()
    ]);

    const convId = conversation?.id;
    const { data: historique } = await supabase_1.supabaseAdmin
        .from('ia_messages')
        .select('role, content')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

    // 2. Construire le prompt système avec le profil détaillé
    const topFilieres = scores.slice(0, 3).map(s => `${s.filiere_nom} (${s.score}%)`).join(', ');
    const listeComp = (competences || []).map(c => `${c.competence_nom} (${c.niveau})`).join(', ');
    const listeInt = (interets || []).map(i => i.domaine).join(', ');
    const listeNotes = (notes || []).map(n => `Bulletin ${n.semestre || ''} (${n.nom_fichier || 'image'})`).join(', ');
    const listeOffres = (offres || []).map(o => `${o.titre} chez ${o.entreprises?.nom || 'Inconnu'} (${o.type})`).join(' | ');

    const systemPrompt = `Tu es l'assistant d'orientation IAI Horizon.
Tu aides ${etudiant?.prenom || 'l\'étudiant'} ${etudiant?.nom || ''} (${etudiant?.niveau || 'niveau non précisé'}).
Filière actuelle: ${etudiant?.filiere || 'non précisée'}.
Spécialité: ${etudiant?.specialite || 'non précisée'}.
CV téléchargé: ${etudiant?.cv_nom_fichier || 'Non'}.
Compétences: ${listeComp || 'non renseignées'}.
Intérêts: ${listeInt || 'non renseignés'}.
Bulletins de notes fournis: ${listeNotes || 'aucun'}.

Scores de compatibilité (Test d'orientation): ${topFilieres || 'Données insuffisantes'}.
Offres réelles sur la plateforme: ${listeOffres || 'Aucune offre pour le moment'}.

INSTRUCTIONS:
- Base tes conseils sur ce profil précis (notes, compétences, test).
- Analyse la cohérence entre sa filière actuelle et ses résultats au test.
- Recommande des certifications spécifiques et des technologies à apprendre.
- Si une offre réelle correspond, propose-lui de postuler.
- Sois très concret : "Vu que tu aimes ${listeInt.split(',')[0] || 'ce domaine'}, je te conseille la certification X".
- Sois encourageant et professionnel.
- IMPORTANT : Termine toujours tes phrases. Ne t'arrête pas en plein milieu.`;

    const messagesGemini = [
        ...(historique || []).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', content: m.content })),
        { role: 'user', content: message }
    ];

    // 3. Appel à l'IA avec limite augmentée à 2000 tokens
    const reponseTexte = await (0, gemini_client_1.callGemini)(messagesGemini, systemPrompt, 2000);

    // 4. Sauvegarde
    await supabase_1.supabaseAdmin.from('ia_messages').insert([
        { conversation_id: convId, role: 'user', content: message },
        { conversation_id: convId, role: 'assistant', content: reponseTexte }
    ]);

    return { conversationId: convId, reponse: reponseTexte };
}

async function historiqueConversation(conversationId) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('ia_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
}
