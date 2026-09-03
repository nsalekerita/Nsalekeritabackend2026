"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const service = require("./admin.service");
const { asyncHandler } = require("../utils/asyncHandler");
const { ok } = require("../utils/response");

exports.stats = asyncHandler(async (_req, res) => {
    const data = await service.statistiquesGlobales();
    return ok(res, data);
});

exports.comptes = asyncHandler(async (req, res) => {
    const role = req.query.role;
    const data = await service.listerComptes(role);
    return ok(res, data);
});

exports.bloquerCompte = asyncHandler(async (req, res) => {
    const data = await service.bloquerCompte(req.params.id);
    return ok(res, data);
});

exports.debloquerCompte = asyncHandler(async (req, res) => {
    const data = await service.debloquerCompte(req.params.id);
    return ok(res, data);
});

exports.supprimerCompte = asyncHandler(async (req, res) => {
    const data = await service.supprimerCompte(req.params.id);
    return ok(res, data);
});

exports.offres = asyncHandler(async (req, res) => {
    const statut = req.query.statut;
    const data = await service.listerOffresPourAdmin(statut);
    return ok(res, data);
});

exports.changerStatutOffre = asyncHandler(async (req, res) => {
    const data = await service.changerStatutOffre(req.params.id, req.body.statut);
    return ok(res, data);
});

exports.validerEntreprise = asyncHandler(async (req, res) => {
    const data = await service.validerEntreprise(req.params.id);
    return ok(res, data);
});
