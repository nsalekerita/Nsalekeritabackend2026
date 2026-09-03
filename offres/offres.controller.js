"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.matching = exports.mesOffres = exports.getById = exports.listerPubliques = exports.publier = exports.modifier = exports.supprimer = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const service = __importStar(require("./offres.service"));
exports.publier = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'entreprise' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux entreprises', 403);
    const { titre, type } = req.body ?? {};
    if (!titre || !type)
        return (0, response_1.fail)(res, 'titre et type requis', 422);
    const data = await service.publierOffre(req.user.profileId, req.body);
    return (0, response_1.ok)(res, data, 201);
});
exports.modifier = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'entreprise' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux entreprises', 403);
    const data = await service.modifierOffre(req.params.id, req.user.profileId, req.body);
    return (0, response_1.ok)(res, data);
});
exports.supprimer = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'entreprise' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux entreprises', 403);
    await service.supprimerOffre(req.params.id, req.user.profileId);
    return (0, response_1.ok)(res, { message: 'Offre supprimée' });
});
exports.listerPubliques = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { type, filiereId } = req.query;
    const data = await service.listerOffresValidees({ type, filiereId });
    return (0, response_1.ok)(res, data);
});
exports.getById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await service.getOffre(req.params.id);
    if (!data)
        return (0, response_1.fail)(res, "Aucune offre n'a été trouvée", 404);
    return (0, response_1.ok)(res, data);
});
exports.mesOffres = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'entreprise' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux entreprises', 403);
    const data = await service.listerOffresEntreprise(req.user.profileId);
    return (0, response_1.ok)(res, data);
});
exports.matching = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'entreprise')
        return (0, response_1.fail)(res, 'Réservé aux entreprises', 403);
    const data = await service.matchingEtudiants(req.params.id);
    return (0, response_1.ok)(res, data);
});
