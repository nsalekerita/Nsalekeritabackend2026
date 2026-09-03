"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publierOffre = publierOffre;
exports.modifierOffre = modifierOffre;
exports.supprimerOffre = supprimerOffre;
exports.listerOffresValidees = listerOffresValidees;
exports.getOffre = getOffre;
exports.listerOffresEntreprise = listerOffresEntreprise;
exports.matchingEtudiants = matchingEtudiants;
const supabase_1 = require("../config/supabase");
async function publierOffre(entrepriseId, input) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('offres')
        .insert({ entreprise_id: entrepriseId, ...input, statut: 'en_attente' })
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
async function modifierOffre(offreId, entrepriseId, input) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('offres')
        .update({ ...input, statut: 'en_attente' }) // Repasse en attente si modifiée ? Ou reste validée ? Souvent on repasse en attente.
        .eq('id', offreId)
        .eq('entreprise_id', entrepriseId)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
async function supprimerOffre(offreId, entrepriseId) {
    const { error } = await supabase_1.supabaseAdmin
        .from('offres')
        .delete()
        .eq('id', offreId)
        .eq('entreprise_id', entrepriseId);
    if (error)
        throw error;
    return { success: true };
}
/** Liste publique (étudiants) : uniquement les offres validées */
async function listerOffresValidees(filters) {
    let query = supabase_1.supabaseAdmin.from('offres').select('*, entreprises(nom, secteur)').eq('statut', 'validee');
    if (filters.type)
        query = query.eq('type', filters.type);
    if (filters.filiereId)
        query = query.contains('filieres_ciblees', [filters.filiereId]);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
}
async function getOffre(id) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('offres')
        .select('*, entreprises(nom, secteur)')
        .eq('id', id)
        .maybeSingle();
    if (error)
        throw error;
    return data;
}
async function listerOffresEntreprise(entrepriseId) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('offres')
        .select('*')
        .eq('entreprise_id', entrepriseId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
}
/**
 * "Matching auto via API" : calcule les étudiants compatibles avec une offre
 * en comparant compétences requises <-> compétences de chaque étudiant ayant
 * une des filières ciblées. Version simple par intersection ; peut être
 * enrichie par le même moteur de scoring que scoring.service.
 */
async function matchingEtudiants(offreId) {
    const offre = await getOffre(offreId);
    if (!offre)
        return [];
    const competencesRequises = Array.isArray(offre.competences_requises)
        ? offre.competences_requises
        : [];
    let query = supabase_1.supabaseAdmin.from('etudiants').select('id, nom, prenom, filiere_actuelle_id, etudiant_competences(competence_nom)');
    if (offre.filieres_ciblees?.length) {
        query = query.in('filiere_actuelle_id', offre.filieres_ciblees);
    }
    const { data: etudiants, error } = await query;
    if (error)
        throw error;
    return (etudiants ?? [])
        .map((e) => {
        const comps = (e.etudiant_competences ?? []).map((c) => c.competence_nom.toLowerCase());
        const matches = competencesRequises.filter((c) => comps.includes(c.toLowerCase()));
        return { ...e, matchScore: competencesRequises.length ? matches.length / competencesRequises.length : 0.5 };
    })
        .sort((a, b) => b.matchScore - a.matchScore);
}
