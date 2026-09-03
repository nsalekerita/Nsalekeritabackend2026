"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refuser = exports.accepter = exports.candidaturesPourEntreprise = exports.candidaturesPourOffre = exports.mesCandidatures = exports.postuler = void 0;
const supabase_1 = require("../config/supabase");

async function postuler(etudiantId, offreId, data) {
    const [
        { data: existante },
        { data: profil }
    ] = await Promise.all([
        supabase_1.supabaseAdmin
            .from('candidatures')
            .select('id')
            .eq('offre_id', offreId)
            .eq('etudiant_id', etudiantId)
            .maybeSingle(),
        supabase_1.supabaseAdmin
            .from('etudiants')
            .select('nom, prenom, filiere, niveau')
            .eq('id', etudiantId)
            .single()
    ]);

    if (existante) {
        const err = new Error('Vous avez déjà postulé à cette offre');
        err.status = 409;
        throw err;
    }

    const { data: result, error } = await supabase_1.supabaseAdmin
        .from('candidatures')
        .insert({
            offre_id: offreId,
            etudiant_id: etudiantId,
            statut: 'envoyee',
            // Informations personnelles : priorité aux données saisies, sinon profil
            nom: data.nom || profil?.nom,
            prenom: data.prenom || profil?.prenom,
            email: data.email,
            telephone_contact: data.telephone,
            date_naissance: data.date_naissance,
            genre: data.genre,
            nationalite: data.nationalite,
            adresse_complete: data.adresse_complete,
            // Informations académiques : auto-complétion si absent
            universite: data.universite || 'IAI-Cameroun', // Valeur par défaut si non spécifié
            filiere: data.filiere || profil?.filiere,
            niveau_etudes: data.niveau_etudes || profil?.niveau,
            annee_etude: data.annee_etude,
            // Informations liées à l'offre
            date_disponibilite: data.date_disponibilite,
            duree_souhaitee: data.duree_souhaitee,
            message: data.message,
            // Pièces jointes (URLs)
            cv_url: data.cv_url,
            lettre_motivation_url: data.lettre_motivation_url,
            lettre_recommandation_url: data.lettre_recommandation_url,
            releve_notes_url: data.releve_notes_url,
            cni_url: data.cni_url,
            // Consentement
            certification_exactitude: data.certification_exactitude
        })
        .select()
        .single();

    if (error) throw error;
    return result;
}
exports.postuler = postuler;

async function getSignedCandidatureUploadUrl(etudiantId, bucket, fileName) {
    const path = `${etudiantId}/candidatures/${Date.now()}-${fileName}`;
    const { data, error } = await supabase_1.supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path);
    if (error)
        throw error;
    return { upload_url: data.signedUrl, cle_fichier: path, bucket };
}
exports.getSignedCandidatureUploadUrl = getSignedCandidatureUploadUrl;

async function getPublicUrl(bucket, path) {
    const { data } = supabase_1.supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}
exports.getPublicUrl = getPublicUrl;

async function mesCandidatures(etudiantId) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('candidatures')
        .select('*, offres(titre, type, localisation, entreprises(nom))')
        .eq('etudiant_id', etudiantId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
}
exports.mesCandidatures = mesCandidatures;

async function candidaturesPourOffre(offreId) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('candidatures')
        .select('*, etudiants(nom, prenom)')
        .eq('offre_id', offreId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
}
exports.candidaturesPourOffre = candidaturesPourOffre;

async function candidaturesPourEntreprise(entrepriseId) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('candidatures')
        .select('*, etudiants(*), offres!inner(titre, entreprise_id)')
        .eq('offres.entreprise_id', entrepriseId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
}
exports.candidaturesPourEntreprise = candidaturesPourEntreprise;

async function changerStatut(candidatureId, statut) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('candidatures')
        .update({ statut })
        .eq('id', candidatureId)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}

exports.accepter = (id) => changerStatut(id, 'acceptee');
exports.refuser = (id) => changerStatut(id, 'refusee');
