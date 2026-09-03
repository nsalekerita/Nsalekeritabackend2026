"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envoyerMessage = envoyerMessage;
exports.getConversation = getConversation;
const supabase_1 = require("../config/supabase");

async function envoyerMessage(expediteurId, expediteurType, destinataireId, contenu) {
    // Si l'expéditeur est une entreprise, le destinataire est forcément un étudiant, et vice-versa.
    const { data, error } = await supabase_1.supabaseAdmin
        .from('messages')
        .insert({
            expediteur_id: expediteurId,
            expediteur_type: expediteurType,
            destinataire_id: destinataireId,
            contenu: contenu,
            is_mine: true // Utile pour le mapping frontend
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function getConversation(userId, contactId) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('messages')
        .select('*')
        .or(`and(expediteur_id.eq.${userId},destinataire_id.eq.${contactId}),and(expediteur_id.eq.${contactId},destinataire_id.eq.${userId})`)
        .order('created_at', { ascending: true });

    if (error) throw error;

    // Marquer les messages comme appartenant à l'utilisateur courant pour le frontend
    return data.map(m => ({
        ...m,
        is_mine: m.expediteur_id === userId
    }));
}
