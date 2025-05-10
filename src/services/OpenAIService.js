import axios from "axios";

const API_URL = "https://api.openai.com/v1/chat/completions";

class OpenAIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async analyzeImage(base64Image) {
    try {
      const response = await axios.post(
        API_URL,
        {
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analise esta imagem de descarte de resíduos e classifique-a conforme as seguintes categorias:\n\n1. Tipo de Material (escolha um ou mais): Plástico, Papel, Vidro, Metal, Orgânico, Eletrônico, Bateria, Óleo, Medicamentos, Construção, Têxtil, Outros\n\n2. Gravidade (escolha uma): Baixa, Média, Alta, Crítica\n\n3. Uma breve descrição do que está vendo na imagem (máximo 3 linhas)\n\nResponda em formato JSON com as chaves: materialType (array), severity (string), e description (string).",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 300,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("Erro ao analisar imagem com OpenAI:", error);
      throw new Error(
        "Não foi possível analisar a imagem no momento. Tente novamente mais tarde."
      );
    }
  }

  async generateDescription(base64Image) {
    try {
      const response = await axios.post(
        API_URL,
        {
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Descreva detalhadamente esta imagem de descarte de resíduos. Inclua informações sobre o tipo de material, quantidade aproximada, condições do local e possíveis impactos ambientais. Seja objetivo e mantenha a descrição em no máximo 4 frases.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 250,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("Erro ao gerar descrição com OpenAI:", error);
      throw new Error(
        "Não foi possível gerar uma descrição no momento. Tente novamente mais tarde."
      );
    }
  }
}

// Singleton instance
let instance = null;

export const getOpenAIService = (apiKey) => {
  if (!instance && apiKey) {
    instance = new OpenAIService(apiKey);
  }
  return instance;
};

export default OpenAIService;

// analisar imagem
export const analyzeWasteImage = async (base64Image) => {
  try {
    const openai = getOpenAIService(import.meta.env.VITE_OPENAI_API_KEY);
    const analysis = await openai.analyzeImage(base64Image);

    // Parse the JSON response
    const result = JSON.parse(analysis);

    return {
      materialTypes: result.materialType,
      severity: result.severity,
      description: result.description,
    };
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze image");
  }
};

// gerar descricao
export const generateDescription = async (base64Image) => {
  try {
    const openai = getOpenAIService(import.meta.env.VITE_OPENAI_API_KEY);
    const description = await openai.generateDescription(base64Image);
    return description;
  } catch (error) {
    console.error("Error generating description:", error);
    throw new Error("Failed to generate description");
  }
};
