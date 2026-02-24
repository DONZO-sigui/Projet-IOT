const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Service IA - Intégration Hugging Face
 */
class AiService {
    constructor() {
        this.apiKey = process.env.HF_API_KEY;
        // Nouveau endpoint Hugging Face Router (OpenAI-compatible)
        this.model = "meta-llama/Llama-3.2-1B-Instruct";
        this.apiUrl = `https://router.huggingface.co/v1/chat/completions`;
        this.kbPath = path.join(__dirname, '../data/knowledge_base.json');
        this.knowledgeBase = this.loadKnowledgeBase();
    }

    /**
     * Charger la base de connaissances JSON
     */
    loadKnowledgeBase() {
        try {
            if (fs.existsSync(this.kbPath)) {
                const data = fs.readFileSync(this.kbPath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error("❌ Erreur chargement Knowledge Base:", error.message);
        }
        return null;
    }

    /**
     * Recherche de contexte pertinent dans la base de connaissances (RAG simple)
     */
    getRelevantContext(query) {
        if (!this.knowledgeBase || !this.knowledgeBase.data) return "";

        // Normalisation : enlever les accents et mettre en minuscule
        const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

        const normalizedQuery = normalize(query);
        const searchTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 2);

        if (searchTerms.length === 0) return "";

        // Score simple par présence de mots-clés normalisés
        const rankedChunks = this.knowledgeBase.data
            .map(chunk => {
                let score = 0;
                const contentNorm = normalize(chunk.content);
                searchTerms.forEach(term => {
                    if (contentNorm.includes(term)) {
                        score += 1;
                        // Bonus si le mot exact est présent (non tronqué)
                        if (new RegExp(`\\b${term}\\b`).test(contentNorm)) score += 0.5;
                    }
                });
                return { ...chunk, score };
            })
            .filter(chunk => chunk.score > 0.5)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3); // Top 3 chunks

        if (rankedChunks.length === 0) return "";

        return rankedChunks.map(c => `[Extrait ${c.id}] ${c.content}`).join("\n\n---\n\n");
    }

    /**
     * Générer une réponse intelligente
     * @param {string} userQuery - Question de l'utilisateur
     * @param {string} extraInstructions - Instructions additionnelles (rôle, etc.)
     */
    async ask(userQuery, extraInstructions = "") {
        if (!this.apiKey || this.apiKey === 'votre_cle_ici') {
            console.warn("⚠️ HF_API_KEY non configurée ou invalide. Utilisation du fallback.");
            return this.getFallbackAnswer(userQuery);
        }

        const context = this.getRelevantContext(userQuery);

        const systemPrompt = `Tu es l'assistant de "Proj_iot Pêche", une plateforme IoT innovante en Guinée. 
Ta mission est d'aider les pêcheurs et les administrateurs.

Contexte technique :
- Capteurs : pH, Turbidité, Température, GPS (Neo-6M).
- Transmission : LoRaWAN (longue portée), ESP32.
- Fonctionnalités : Suivi en temps réel, Geofencing (zones de pêche), Alertes qualité d'eau, Bouton SOS.

${context ? `DOCUMENTS DE RÉFÉRENCE (statistiques CNSHB) :\n${context}\n\n` : ''}

Consignes :
1. Réponds en français de manière concise (3-4 phrases).
2. Utilise les DOCUMENTS DE RÉFÉRENCE pour donner des chiffres précis sur la pêche en Guinée si pertinent.
3. Si la question est sur le pH ou la sécurité SOS, utilise tes connaissances techniques.

${extraInstructions}`;

        try {
            const response = await axios.post(
                this.apiUrl,
                {
                    model: this.model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userQuery }
                    ],
                    max_tokens: 250,
                    temperature: 0.7
                },
                { headers: { Authorization: `Bearer ${this.apiKey}` } }
            );

            return response.data.choices[0].message.content.trim();

        } catch (error) {
            console.error("❌ Erreur API Hugging Face:", error.response ? JSON.stringify(error.response.data) : error.message);
            return this.getFallbackAnswer(userQuery);
        }
    }

    /**
     * Fallback intelligent (mots-clés améliorés) au cas où l'API échoue ou n'est pas configurée
     */
    getFallbackAnswer(q) {
        q = q.toLowerCase();
        if (q.includes("ph") || q.includes("qualité")) return "Le pH idéal pour la pêche se situe entre 6.5 et 8.5. Nos capteurs surveillent cela en temps réel pour prévenir tout stress pour les poissons.";
        if (q.includes("sos") || q.includes("sécurité")) return "Le système SOS envoie votre position GPS exacte aux secours via LoRaWAN, même sans couverture GSM complète.";
        if (q.includes("lora") || q.includes("portée")) return "LoRaWAN permet de transmettre des données jusqu'à 15km des côtes, ce qui est idéal pour les pirogues artisanales.";
        return "Je suis en mode restreint car mon cerveau cloud n'est pas accessible. Je peux vous parler de pH, de sécurité SOS ou de la portée LoRaWAN.";
    }
}

module.exports = new AiService();
