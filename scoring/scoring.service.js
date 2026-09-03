"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculerScoresFilieres = calculerScoresFilieres;
const supabase_1 = require("../config/supabase");
const NIVEAU_POIDS = { debutant: 1, intermediaire: 2, avance: 3 };

/**
 * Mappings sémantiques pour traduire les réponses simples du wizard en critères techniques.
 */
const WIZARD_MAPPINGS = {
    "logique": ["algorithme", "backend", "système", "réseau", "sécurité", "programmation", "code", "développement", "mathématiques", "génie logiciel"],
    "visuel": ["frontend", "design", "ui", "ux", "multimédia", "web", "interface", "graphisme", "infographie"],
    "les deux": ["backend", "frontend", "algorithme", "design", "web", "développement", "fullstack"],
    "donnée": ["data", "base de données", "sql", "big data", "statistiques", "science des données", "analyse", "systèmes d'information"],
    "applications": ["mobile", "web", "logiciel", "développement", "app", "ios", "android", "programmation"],
    "oui": ["intelligence artificielle", "machine learning", "python", "data science", "ia", "apprentissage automatique", "robotique"],
    "non": [],
    "peut-être": ["intelligence artificielle", "data science", "ia", "analyse de données"],
    // Ajout de mappings basés sur les labels des questions du wizard
    "Logique": ["algorithme", "backend", "système", "réseau", "sécurité", "programmation", "code", "développement"],
    "Visuel": ["frontend", "design", "ui", "ux", "multimédia", "web", "interface", "graphisme"],
    "Les deux": ["backend", "frontend", "algorithme", "design", "web", "développement", "fullstack"],
    "Donnée": ["data", "base de données", "sql", "big data", "science des données"],
    "Applications": ["mobile", "web", "logiciel", "développement", "app"],
    "Oui": ["intelligence artificielle", "machine learning", "python", "data science", "ia"],
    "Peut-être": ["intelligence artificielle", "data science", "ia"],
    // Nouveaux mappings pour approfondir
    "Hardware": ["système", "réseau", "sécurité", "iot", "architecture", "matériel"],
    "Software": ["développement", "logiciel", "web", "mobile", "algorithme"],
    "Gestion/Management": ["management", "projet", "agilité", "gouvernance", "audit"],
    "Technique pure": ["développement", "code", "algorithme", "système"],
    "Cybersécurité": ["sécurité", "réseau", "cryptographie", "audit"],
    "Cloud Computing": ["cloud", "azure", "aws", "devops", "infrastructure"],
    "IoT (Objets connectés)": ["iot", "systèmes embarqués", "électronique", "réseau"],
    "Développement Web": ["web", "frontend", "backend", "fullstack", "javascript"],
    "Essentielle": ["ux", "ui", "design", "frontend", "interface"],
    "Oui, passionnément": ["mobile", "android", "ios", "flutter", "react native"],
    "Analyse mathématique": ["data", "statistiques", "algorithme", "science des données"],
    "Prototype rapide": ["développement", "agilité", "mvp"],
    "Recherche documentaire": ["audit", "gouvernance", "systèmes d'information", "veille"],
    "Startup": ["fullstack", "agilité", "développement"],
    "Grande Entreprise": ["gouvernance", "audit", "sécurité", "système d'information"],
    "Freelance": ["web", "mobile", "développement", "indépendant"],
    "Mixte": ["management", "technique", "fullstack", "projet"],
    "Un peu": ["mobile", "web"],
    "Secondaire": ["backend", "système", "réseau"],
    "Pas mon domaine": ["backend", "data", "sécurité"],
};

/**
 * Moteur de scoring amélioré : prend en compte le profil, les compétences,
 * les intérêts et surtout les dernières réponses au test d'orientation.
 */
async function calculerScoresFilieres(etudiantId) {
    const [signaux, { data: filieres }] = await Promise.all([
        getSignauxEtudiant(etudiantId),
        supabase_1.supabaseAdmin.from('filieres').select('id, nom, filiere_criteres(id, type, nom, poids)'),
    ]);

    const scores = (filieres ?? []).map((filiere) => {
        let score = 0;
        let poidsTotal = 0;

        for (const critere of filiere.filiere_criteres ?? []) {
            const p = Number(critere.poids);
            poidsTotal += p;
            const critereNom = critere.nom.toLowerCase();

            // 1. Match Compétences (Profil)
            const matchComp = signaux.competences.find((c) => c.competence_nom.toLowerCase() === critereNom);
            if (matchComp) score += p * (NIVEAU_POIDS[matchComp.niveau] / 3);

            // 2. Match Intérêts (Profil)
            const matchInt = signaux.interets.find((i) => i.domaine.toLowerCase() === critereNom);
            if (matchInt) score += p;

            // 3. Match Filière/Spécialité actuelle (Profil)
            if ((signaux.etudiant.filiere?.toLowerCase().includes(critereNom)) ||
                (critereNom.includes(signaux.etudiant.filiere?.toLowerCase() || "___"))) {
                score += p * 0.5;
            }

            // 4. Match Réponses Wizard (Dernière tentative)
            const wizardMatch = signaux.reponses.some(valeur => {
                const texte = valeur.toLowerCase();
                // Match direct
                if (texte.includes(critereNom) || critereNom.includes(texte)) return true;

                // Match via mapping sémantique
                const keywords = WIZARD_MAPPINGS[texte];
                return keywords && keywords.some(k => critereNom.includes(k) || k.includes(critereNom));
            });

            if (wizardMatch) {
                // Bonus prioritaire pour le test d'orientation
                score += p * 1.5;
            }
        }

        const scoreNormalise = poidsTotal > 0 ? Math.round((score / poidsTotal) * 100) : 0;
        return {
            filiere_id: filiere.id,
            filiere_nom: filiere.nom,
            score: Math.min(scoreNormalise, 100)
        };
    });

    return scores.sort((a, b) => b.score - a.score);
}

async function getSignauxEtudiant(etudiantId) {
    const [
        { data: etudiant },
        { data: competences },
        { data: interets },
        { data: wizard }
    ] = await Promise.all([
        supabase_1.supabaseAdmin.from('etudiants').select('filiere, specialite').eq('id', etudiantId).single(),
        supabase_1.supabaseAdmin.from('etudiant_competences').select('competence_nom, niveau').eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('etudiant_interets').select('domaine').eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('profils_wizard')
            .select('id, wizard_reponses(*)')
            .eq('etudiant_id', etudiantId)
            .maybeSingle()
    ]);

    // On ne garde que la dernière réponse par question pour éviter les conflits de tests multiples
    const reponsesMap = {};
    if (wizard && wizard.wizard_reponses) {
        const sorted = [...wizard.wizard_reponses].sort((a, b) => (a.id || 0) - (b.id || 0));
        sorted.forEach(r => {
            let val = "";
            if (typeof r.reponse === 'string') val = r.reponse;
            else if (r.reponse && typeof r.reponse === 'object') val = r.reponse.valeur || r.reponse.label || "";
            if (val) reponsesMap[r.question_id] = val;
        });
    }

    return {
        etudiant: etudiant ?? {},
        competences: competences ?? [],
        interets: interets ?? [],
        reponses: Object.values(reponsesMap)
    };
}
