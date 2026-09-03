"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genererRecommandation = genererRecommandation;
exports.derniereRecommandation = derniereRecommandation;
const supabase_1 = require("../config/supabase");
const scoring_service_1 = require("../scoring/scoring.service");
const gemini_client_1 = require("./gemini.client");

async function genererRecommandation(etudiantId) {
    // 1. D'abord les scores et le profil de base
    const [
        scores,
        { data: etudiant },
        { data: competences },
        { data: interets },
        { data: notes }
    ] = await Promise.all([
        (0, scoring_service_1.calculerScoresFilieres)(etudiantId),
        supabase_1.supabaseAdmin.from('etudiants').select('nom, prenom, niveau, filiere, specialite, cv_nom_fichier').eq('id', etudiantId).single(),
        supabase_1.supabaseAdmin.from('etudiant_competences').select('competence_nom').eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('etudiant_interets').select('domaine').eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('etudiant_notes').select('semestre').eq('etudiant_id', etudiantId)
    ]);

    if (scores.length === 0) {
        const err = new Error('Données insuffisantes pour générer une recommandation');
        err.status = 422;
        throw err;
    }
    const top = scores.slice(0, 3);
    const topIds = top.map(s => s.filiere_id);

    // 2. Ensuite, chercher des offres qui matchent réellement les filières recommandées
    let { data: offres } = await supabase_1.supabaseAdmin
        .from('offres')
        .select('id, titre, type, entreprises(nom)')
        .eq('statut', 'validee')
        .overlaps('filieres_ciblees', topIds)
        .limit(10);

    // Si pas assez d'offres ciblées, on complète avec les dernières offres validées
    if (!offres || offres.length < 3) {
        const { data: autresOffres } = await supabase_1.supabaseAdmin
            .from('offres')
            .select('id, titre, type, entreprises(nom)')
            .eq('statut', 'validee')
            .order('created_at', { ascending: false })
            .limit(10);

        const existingIds = new Set((offres || []).map(o => o.id));
        for (const o of (autresOffres || [])) {
            if (!existingIds.has(o.id) && (offres?.length || 0) < 10) {
                offres = [...(offres || []), o];
            }
        }
    }

    const listeComp = (competences || []).map(c => c.competence_nom).join(', ');
    const listeInt = (interets || []).map(i => i.domaine).join(', ');
    const aNotes = (notes || []).length > 0 ? "Oui" : "Non";

    const justification = await (0, gemini_client_1.callGemini)([
        {
            role: 'user',
            content: `Étudiant: ${etudiant?.prenom} ${etudiant?.nom}, niveau ${etudiant?.niveau ?? 'non renseigné'}.
Filière actuelle: ${etudiant?.filiere || 'non précisée'}.
Compétences: ${listeComp || 'non renseignées'}.
Intérêts: ${listeInt || 'non renseignés'}.
Bulletins fournis: ${aNotes}.
CV: ${etudiant?.cv_nom_fichier ? 'Présent' : 'Absent'}.

Scores de compatibilité (Test): ${JSON.stringify(top)}.
Offres disponibles: ${JSON.stringify(offres)}.

Rédige un rapport d'orientation personnalisé (10-15 phrases) :
1. Analyse la cohérence entre ses réponses au test et son profil actuel.
2. Recommande la filière n°1 et explique pourquoi elle matche avec ses intérêts (${listeInt}).
3. Suggère 3 technologies à apprendre et 2 certifications précises.
4. Cite explicitement des offres de la liste si elles correspondent.
5. Termine par un conseil de carrière motivant.`,
        },
    ], "Tu es l'expert en orientation IA de la plateforme IAI Horizon. Réponds en français de façon structurée. IMPORTANT : Termine toujours tes phrases et ne dépasse pas 2000 tokens.", 2000);
    const { data: recommandation, error } = await supabase_1.supabaseAdmin
        .from('recommandations')
        .insert({ etudiant_id: etudiantId, justification_texte: justification })
        .select('id, created_at')
        .single();
    if (error)
        throw error;
    await supabase_1.supabaseAdmin.from('scores_filieres').insert(scores.map((s) => ({ recommandation_id: recommandation.id, filiere_id: s.filiere_id, score: s.score })));
    return { recommandation, scores };
}

async function derniereRecommandation(etudiantId) {
    const { data: recommandation } = await supabase_1.supabaseAdmin
        .from('recommandations')
        .select('id, justification_texte, created_at, scores_filieres(filiere_id, score, filieres(nom))')
        .eq('etudiant_id', etudiantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    return recommandation;
}