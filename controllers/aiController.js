const aiService = require('../services/aiService');

/**
 * Demander à l'IA
 */
exports.ask = async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ success: false, error: "La question est requise" });
        }

        const answer = await aiService.ask(question);

        res.json({
            success: true,
            answer: answer
        });

    } catch (error) {
        console.error("Erreur contrôleur AI:", error);
        res.status(500).json({ success: false, error: "Erreur lors du traitement de votre demande" });
    }
};
