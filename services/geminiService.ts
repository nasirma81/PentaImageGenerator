import { GoogleGenAI } from "@google/genai";
import { GeneratePromptRequest } from "../types";

const SYSTEM_INSTRUCTION = `
PERAN:
Anda adalah "Senior Creative Director & AI Prompt Specialist". Tugas Anda adalah menerima konsep ide kasar dari pengguna, Pilihan Gaya (Style), dan Rasio Aspek, lalu mengubahnya menjadi prompt pembuatan gambar yang sangat detail.

TUJUAN:
Menghasilkan satu paragraf prompt dalam BAHASA INGGRIS yang kaya deskripsi, menjamin output berkualitas tinggi sesuai gaya yang dipilih.

INSTRUKSI KERJA:

1. ANALISIS INPUT:
   * Konsep: Ide dasar pengguna.
   * Style: Gaya visual yang WAJIB diterapkan (misal: Anime, Cinematic, Oil Painting).
   * Aspect Ratio: Rasio dimensi gambar.
   * Input Image: Jika ada, rujuk sebagai "the subject from the input image".

2. PENYUSUNAN PROMPT (OUTPUT):
   * Mulailah dengan mendefinisikan gaya secara spesifik sesuai input Style. Contoh jika style 'Cinematic': "A cinematic, ultra photo-realistic shot...". Jika 'Anime': "A high-quality anime style illustration...".
   * Jelaskan subjek, latar belakang, dan pencahayaan sesuai dengan Style yang dipilih.
   * Akhiri dengan instruksi teknis kamera yang relevan dengan style tersebut.
   * PENTING: Akhiri prompt dengan teks rasio aspek: "--ar [Ratio Input]" atau "Aspect Ratio: [Ratio Input]".

OUTPUT HARUS HANYA PROMPT FINAL SAJA. JANGAN ADA TEKS PENGANTAR LAIN.
`;

export const generateCreativePrompt = async (request: GeneratePromptRequest): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-flash-preview as it is excellent for instruction following and multimodal tasks
    const modelId = 'gemini-3-flash-preview'; 

    const parts: any[] = [];

    // Add image if available
    if (request.imageBase64 && request.imageMimeType) {
      parts.push({
        inlineData: {
          data: request.imageBase64,
          mimeType: request.imageMimeType
        }
      });
    }

    // Add text prompt with style and ratio context
    parts.push({
      text: `
      User Concept: "${request.userConcept}"
      Selected Style: "${request.style}"
      Target Aspect Ratio: "${request.aspectRatio}"
      
      Buatkan prompt visual lengkap berdasarkan data di atas.
      `
    });

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, 
      }
    });

    if (response.text) {
      return response.text;
    } else {
      throw new Error("No text returned from Gemini");
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateImageFromPrompt = async (
  prompt: string, 
  imageBase64?: string, 
  imageMimeType?: string,
  aspectRatio: string = "16:9"
): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Using gemini-2.5-flash-image (Nano Banana)
  const modelId = 'gemini-2.5-flash-image';

  // Helper function to generate a single image
  const fetchSingleImage = async (): Promise<string | null> => {
    try {
      const parts: any[] = [];
      // If a reference image is provided, include it to guide the generation
      if (imageBase64 && imageMimeType) {
        parts.push({
          inlineData: {
            data: imageBase64,
            mimeType: imageMimeType
          }
        });
      }
      // Add the detailed text prompt
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: modelId,
        contents: { parts: parts },
        config: {
          imageConfig: { 
            aspectRatio: aspectRatio 
          }
        }
      });

      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return part.inlineData.data;
          }
        }
      }
      return null;
    } catch (error) {
      console.warn("Single image generation failed, retrying or skipping...", error);
      return null;
    }
  };

  try {
    // Generate 4 images in parallel
    const promises = [
      fetchSingleImage(),
      fetchSingleImage(),
      fetchSingleImage(),
      fetchSingleImage()
    ];

    const results = await Promise.all(promises);
    
    // Filter out any failed requests (nulls)
    const validImages = results.filter((img): img is string => img !== null);

    if (validImages.length === 0) {
      throw new Error("Failed to generate any images. The prompt might be blocked by safety filters.");
    }

    return validImages;

  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    throw error;
  }
};