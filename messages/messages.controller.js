"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversation = exports.envoyerMessage = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const messagesService = require("./messages.service");

exports.envoyerMessage = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { destinataire_id, contenu } = req.body;
    const expediteurId = req.user.id; // Utilise l'ID de auth.users
    const expediteurType = req.user.role; // 'etudiant' ou 'entreprise'

    if (!destinataire_id || !contenu) {
        return (0, response_1.fail)(res, 'destinataire_id et contenu requis', 422);
    }

    const data = await messagesService.envoyerMessage(expediteurId, expediteurType, destinataire_id, contenu);
    return (0, response_1.ok)(res, data, 201);
});

exports.getConversation = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id; // Utilise l'ID de auth.users
    const contactId = req.params.contactId;

    const data = await messagesService.getConversation(userId, contactId);
    return (0, response_1.ok)(res, data);
});
