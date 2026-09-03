"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envoyerMessage = envoyerMessage;
exports.getConversation = getConversation;
const supabase_1 = require("../config/supabase");

async function envoyerMessage(expediteurId, expediteurType, destinataireId, contenu) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('messages_directs')
        .insert({
            expediteur_id: expediteurId,
            expediteur_type: expediteurType,
            destinataire_id: destinataireId,
            contenu: contenu,
            lu: false
            // identifiant et cree_a sont gérés par les DEFAULT du SQL
        })
        .select()
        .single();

    if (error) throw error;

    return {
        ...data,
        is_mine: true
    };
}

async function getConversation(userId, contactId) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('messages_directs')
        .select('*')
        .or(`and(expediteur_id.eq.${userId},destinataire_id.eq.${contactId}),and(expediteur_id.eq.${contactId},destinataire_id.eq.${userId})`)
        .order('cree_a', { ascending: true }); // Utilisation de cree_a selon votre SQL

    if (error) throw error;

    return data.map(m => ({
        ...m,
        is_mine: m.expediteur_id === userId
    }));
}
