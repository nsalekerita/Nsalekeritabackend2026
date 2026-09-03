"use strict";
const { supabaseAdmin } = require("../config/supabase");

async function statistiquesGlobales() {
    const [{ count: nbEtudiants }, { count: nbEntreprises }, { count: nbOffres }, { count: nbCandidatures }] = await Promise.all([
        supabaseAdmin.from('etudiants').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('entreprises').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('offres').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('candidatures').select('*', { count: 'exact', head: true }),
    ]);

    return {
        nbEtudiants: nbEtudiants ?? 0,
        nbEntreprises: nbEntreprises ?? 0,
        nbOffres: nbOffres ?? 0,
        nbCandidatures: nbCandidatures ?? 0
    };
}

async function listerComptes(role) {
    // On ne demande plus 'actif' ici pour éviter de faire planter tout le dashboard admin
    let query = supabaseAdmin.from('users').select('id, email, role, created_at');
    if (role) query = query.eq('role', role);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    // On rajoute manuellement un champ actif: true par défaut pour l'UI
    return (data ?? []).map(u => ({ ...u, actif: u.actif ?? true }));
}

async function bloquerCompte(userId) {
    try {
        const { data, error } = await supabaseAdmin.from('users').update({ actif: false }).eq('id', userId).select().single();
        if (error) throw error;
        return data;
    } catch (err) {
        if (err.message && (err.message.includes('column') || err.message.includes('actif'))) {
            throw new Error("Action impossible : La colonne 'actif' est manquante en base de données. Exécutez le script SQL dans Supabase.");
        }
        throw err;
    }
}

async function debloquerCompte(userId) {
    try {
        const { data, error } = await supabaseAdmin.from('users').update({ actif: true }).eq('id', userId).select().single();
        if (error) throw error;
        return data;
    } catch (err) {
        if (err.message.includes('column "actif" does not exist')) {
            throw new Error("Action impossible : La colonne 'actif' doit être ajoutée à la table 'users' via SQL.");
        }
        throw err;
    }
}

async function supprimerCompte(userId) {
    // 1. Tenter de supprimer du système d'authentification
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    // Si l'utilisateur n'existe pas dans Auth, on ignore l'erreur pour pouvoir nettoyer la base
    if (authError && !authError.message.toLowerCase().includes('not found')) {
        throw authError;
    }

    // 2. Supprimer de la table publique 'users'
    const { error: dbError } = await supabaseAdmin.from('users').delete().eq('id', userId);
    if (dbError) throw dbError;

    return { success: true };
}

async function listerOffresPourAdmin(statut) {
    let query = supabaseAdmin.from('offres').select('*, entreprises(nom)');
    if (statut) query = query.eq('statut', statut);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
}

async function changerStatutOffre(offreId, statut) {
    const { data, error } = await supabaseAdmin.from('offres').update({ statut }).eq('id', offreId).select().single();
    if (error) throw error;
    return data;
}

async function validerEntreprise(entrepriseId) {
    const { data, error } = await supabaseAdmin.from('entreprises').update({ statut_verification: 'validee' }).eq('id', entrepriseId).select().single();
    if (error) throw error;
    return data;
}

module.exports = {
    statistiquesGlobales,
    listerComptes,
    bloquerCompte,
    debloquerCompte,
    supprimerCompte,
    listerOffresPourAdmin,
    changerStatutOffre,
    validerEntreprise
};
