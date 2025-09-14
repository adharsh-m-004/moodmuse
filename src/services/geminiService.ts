export interface GeminiAnalysis {
  tags: string[];
}

class GeminiService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY ||'';
    this.apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
  }

  async analyzeImageTags(imageUrl: string): Promise<GeminiAnalysis> {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.");
    }

    try {
      // Convert image URL to base64
      const { data: base64Data, mimeType } = await this.urlToBase64(imageUrl);
      
      const payload = {
        contents: [{
          parts: [
            { text: "Act as an expert image analyst. Provide a comma-separated list of 5-10 tags that describe the most prominent elements, colors, and themes in this image. Do not include any text other than the comma-separated list of tags." },
            { inlineData: { mimeType, data: base64Data } }
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
        const errorText = await response.text();
        console.error('Gemini API error response:', errorText);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Gemini API response:', result);
      const tagsText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const tags = tagsText.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);

      return { tags };
    } catch (error) {
      console.error('Gemini analysis failed:', error);
      throw error;
    }
  }

  private async urlToBase64(url: string): Promise<{ data: string; mimeType: string }> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const mimeType = blob.type || 'image/jpeg';
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result?.toString();
          if (result) {
            const base64String = result.split(',')[1];
            if (base64String) {
              resolve({ data: base64String, mimeType });
            } else {
              reject(new Error('Failed to extract base64 data'));
            }
          } else {
            reject(new Error('Failed to convert image to base64'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error in urlToBase64:', error);
      throw new Error(`Failed to fetch image for analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const geminiService = new GeminiService();
