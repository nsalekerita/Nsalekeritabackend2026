"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envoyerMessage = envoyerMessage;
exports.historiqueConversation = historiqueConversation;
const supabase_1 = require("../config/supabase");
const gemini_client_1 = require("./gemini.client");
const scoring_service_1 = require("../scoring/scoring.service");

async function envoyerMessage(etudiantId, conversationId, message) {
    // 1. Récupérer le contexte complet de l'étudiant et le catalogue des filières
    const [
        { data: etudiant },
        { data: competences },
        { data: interets },
        { data: notes },
        { data: offres },
        { data: toutesFilieres },
        scores,
        { data: conversation }
    ] = await Promise.all([
        supabase_1.supabaseAdmin.from('etudiants').select('nom, prenom, niveau, filiere, specialite, cv_nom_fichier').eq('id', etudiantId).single(),
        supabase_1.supabaseAdmin.from('etudiant_competences').select('competence_nom, niveau').eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('etudiant_interets').select('domaine').eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('etudiant_notes').select('semestre, nom_fichier').eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('offres').select('titre, description, type, competences_requises, entreprises(nom)').eq('statut', 'validee').limit(5),
        supabase_1.supabaseAdmin.from('filieres').select('nom, description, debouches'),
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

    // 2. Construire le prompt système expert
    const topFilieres = scores.slice(0, 3).map(s => `${s.filiere_nom} (${s.score}%)`).join(', ');
    const listeComp = (competences || []).map(c => `${c.competence_nom} (${c.niveau})`).join(', ');
    const listeInt = (interets || []).map(i => i.domaine).join(', ');
    const listeNotes = (notes || []).map(n => `Bulletin ${n.semestre || ''} (${n.nom_fichier || 'image'})`).join(', ');
    const listeOffres = (offres || []).map(o => `${o.titre} chez ${o.entreprises?.nom || 'Inconnu'} (Compétences: ${Array.isArray(o.competences_requises) ? o.competences_requises.join(', ') : 'n/a'})`).join(' | ');
    const catalogueFilieres = (toutesFilieres || []).map(f => `${f.nom}: ${f.description} (Débouchés: ${f.debouches})`).join('\n');

    const systemPrompt = `Tu es l'expert en orientation et insertion professionnelle d'IAI Horizon.
Ton rôle est d'aider ${etudiant?.prenom || 'l\'étudiant'} ${etudiant?.nom || ''} à comprendre les métiers et à choisir les meilleures formations.

CONTEXTE ÉTUDIANT:
- Profil: ${etudiant?.niveau || 'Niveau inconnu'} en ${etudiant?.filiere || 'Filière non précisée'}.
- Compétences actuelles: ${listeComp || 'Non renseignées'}.
- Centres d'intérêt: ${listeInt || 'Non renseignés'}.
- Résultats test orientation: ${topFilieres || 'Non effectué'}.

CATALOGUE DES FORMATIONS IAI:
${catalogueFilieres}

MARCHÉ DU TRAVAIL (Offres réelles):
${listeOffres}

TES MISSIONS:
1. EXPLIQUER les métiers et leurs débouchés en fonction des intérêts de l'étudiant.
2. RECOMMANDER des formations ou spécialisations précises du catalogue.
3. IDENTIFIER les compétences manquantes pour décrocher les offres réelles listées.
4. ÊTRE CONCRET: Cite des technologies, des certifications (ex: AWS, Cisco, Google Analytics) et des entreprises.
5. STYLE: Professionnel, pédagogique et très encourageant. Termine toujours tes phrases.`;

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
