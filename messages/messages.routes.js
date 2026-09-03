"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const messages_controller_1 = require("./messages.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");

const router = (0, express_1.Router)();

router.use(auth_middleware_1.protect); // Toutes les routes de messagerie sont protégées

router.post('/', messages_controller_1.envoyerMessage);
router.get('/conversation/:contactId', messages_controller_1.getConversation);

exports.default = router;
