export interface GeminiAnalysis {
  tags: string[];
}

class GeminiService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY ||'';
    this.apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent";
  }

  async analyzeImageTags(imageUrl: string): Promise<GeminiAnalysis> {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.");
    }

    try {
      // Convert image URL to base64
      const base64Data = await this.urlToBase64(imageUrl);
      
      const payload = {
        contents: [{
          parts: [
            { text: "Act as an expert image analyst. Provide a comma-separated list of 5-10 tags that describe the most prominent elements, colors, and themes in this image. Do not include any text other than the comma-separated list of tags." },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
          ]
        }]
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const result = await response.json();
      const tagsText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const tags = tagsText.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);

      return { tags };
    } catch (error) {
      console.error('Gemini analysis failed:', error);
      throw error;
    }
  }

  private async urlToBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result?.toString().split(',')[1];
          if (base64String) {
            resolve(base64String);
          } else {
            reject(new Error('Failed to convert image to base64'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error('Failed to fetch image for analysis');
    }
  }
}

export const geminiService = new GeminiService();
