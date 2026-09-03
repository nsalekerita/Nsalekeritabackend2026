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
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const controller = __importStar(require("./offres.controller"));
const router = (0, express_1.Router)();
router.get('/', controller.listerPubliques); // consultable sans auth stricte (peut être restreint à requireAuth si besoin)
router.get('/:id', controller.getById);
router.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('entreprise'), controller.publier);
router.put('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('entreprise'), controller.modifier);
router.delete('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('entreprise'), controller.supprimer);
router.get('/entreprise/mes-offres', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('entreprise'), controller.mesOffres);
router.get('/:id/matching', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('entreprise'), controller.matching);
exports.default = router;
