const aiService = require('../services/aiService');

/**
 * Demander à l'IA
 */
exports.ask = async (req, res) => {
    try {
        const userQuery = req.body.message || req.body.query;
        if (!userQuery) {
            return res.status(400).json({ success: false, error: 'Message requis' });
        }

        // Personnalisation selon le rôle
        let roleInstructions = "";
        if (req.user && req.user.role === 'pecheur') {
            roleInstructions = "\n\nINSTRUCTIONS SPÉCIFIQUES POUR LE PÊCHEUR :\n- Donne des conseils de sécurité en mer.\n- Explique les zones de pêche autorisées si demandé.\n- Utilise un ton encourageant et protecteur.\n- Si un problème technique est mentionné, suggère de contacter un technicien.";
        } else if (req.user && (req.user.role === 'admin' || req.user.role === 'technicien')) {
            roleInstructions = "\n\nINSTRUCTIONS SPÉCIFIQUES POUR L'ADMIN/TECH :\n- Donne des détails techniques sur les capteurs (pH, turbidité).\n- Aide à l'analyse des statistiques globales.\n- Utilise un ton professionnel et analytique.";
        }

        const aiResponse = await aiService.ask(userQuery, roleInstructions);

        res.json({
            success: true,
            answer: aiResponse
        });

    } catch (error) {
        console.error("Erreur contrôleur AI:", error);
        res.status(500).json({ success: false, error: "Erreur lors du traitement de votre demande" });
    }
};
