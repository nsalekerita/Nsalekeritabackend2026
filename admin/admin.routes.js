"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const auth = require("../middleware/auth.middleware");
const controller = require("./admin.controller");

const router = express.Router();

// Protection de toutes les routes : seul un administrateur peut y accéder
router.use(auth.requireAuth);
router.use(auth.requireRole('administrateur'));

// Stats
router.get('/stats', controller.stats);

// Comptes : Lister, Bloquer, Débloquer, Supprimer
router.get('/comptes', controller.comptes);
router.patch('/comptes/:id/bloquer', controller.bloquerCompte);
router.patch('/comptes/:id/debloquer', controller.debloquerCompte);
router.delete('/comptes/:id', controller.supprimerCompte);

// Offres
router.get('/offres', controller.offres);
router.patch('/offres/:id/statut', controller.changerStatutOffre);
router.patch('/entreprises/:id/valider', controller.validerEntreprise);

exports.default = router;
