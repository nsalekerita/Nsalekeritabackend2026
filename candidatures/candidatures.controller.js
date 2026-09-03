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
exports.refuser = exports.accepter = exports.candidaturesPourEntreprise = exports.candidaturesPourOffre = exports.mesCandidatures = exports.postuler = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const service = __importStar(require("./candidatures.service"));
exports.postuler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'etudiant' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux étudiants', 403);
    const { offreId } = req.body ?? {};
    if (!offreId)
        return (0, response_1.fail)(res, 'offreId requis', 422);
    const data = await service.postuler(req.user.profileId, offreId, req.body);
    return (0, response_1.ok)(res, data, 201);
});
exports.demandeUploadCandidature = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'etudiant' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux étudiants', 403);
    const { bucket, nom_fichier } = req.body ?? {};
    if (!bucket || !nom_fichier)
        return (0, response_1.fail)(res, 'bucket et nom_fichier requis', 422);
    const data = await service.getSignedCandidatureUploadUrl(req.user.profileId, bucket, nom_fichier);
    return (0, response_1.ok)(res, data);
});
exports.getPublicUrl = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bucket, path } = req.query;
    if (!bucket || !path)
        return (0, response_1.fail)(res, 'bucket et path requis', 422);
    const url = await service.getPublicUrl(bucket, path);
    return (0, response_1.ok)(res, { url });
});
exports.mesCandidatures = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'etudiant' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux étudiants', 403);
    const data = await service.mesCandidatures(req.user.profileId);
    return (0, response_1.ok)(res, data);
});
exports.candidaturesPourOffre = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'entreprise')
        return (0, response_1.fail)(res, 'Réservé aux entreprises', 403);
    const data = await service.candidaturesPourOffre(req.params.offreId);
    return (0, response_1.ok)(res, data);
});
exports.candidaturesPourEntreprise = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'entreprise' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux entreprises', 403);
    const data = await service.candidaturesPourEntreprise(req.user.profileId);
    return (0, response_1.ok)(res, data);
});
exports.accepter = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'entreprise')
        return (0, response_1.fail)(res, 'Réservé aux entreprises', 403);
    const data = await service.accepter(req.params.id);
    return (0, response_1.ok)(res, data);
});
exports.refuser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'entreprise')
        return (0, response_1.fail)(res, 'Réservé aux entreprises', 403);
    const data = await service.refuser(req.params.id);
    return (0, response_1.ok)(res, data);
});
