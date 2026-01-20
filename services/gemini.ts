import { getApiBaseUrl } from '../constants';

const BACKEND_URL = `${getApiBaseUrl()}/gemini`;

export const geminiService = {
  async generatePostInspiration(topic: string) {
    try {
      const response = await fetch(`${BACKEND_URL}/inspiration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' as RequestCredentials,
        body: JSON.stringify({ topic }),
      });
      if (!response.ok) throw new Error('Backend error');
      const data = await response.json();
      return data.text || "Could not generate inspiration right now. Stay bright!";
    } catch (error) {
      console.error("Inspiration Error:", error);
      return "The aura is currently shifting. Try again later!";
    }
  },

  async suggestReply(postContent: string) {
    try {
      const response = await fetch(`${BACKEND_URL}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' as RequestCredentials,
        body: JSON.stringify({ postContent }),
      });
      if (!response.ok) throw new Error('Backend error');
      const data = await response.json();
      return data.text || "Love the energy!";
    } catch (error) {
      console.error("Reply Error:", error);
      return "Beautifully said.";
    }
  },

  async analyzeDataAura(userData: any, posts: any[]) {
    try {
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData, posts }),
      });
      if (!response.ok) throw new Error('Backend error');
      const data = await response.json();
      return data.text || "Your aura is clear and transparent. You resonate with purity.";
    } catch (error) {
      console.error("Analysis Error:", error);
      return "Unable to calibrate neural aura at this time.";
    }
  },
  
  async generateContent(prompt: string) {
    try {
      const response = await fetch(`${BACKEND_URL}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' as RequestCredentials,
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) throw new Error('Backend error');
      const data = await response.json();
      return data.text || "I'd love to help you create content, but I'm experiencing some cosmic interference right now. Please try again later! ✨";
    } catch (error) {
      console.error("Content Generation Error:", error);
      return "The creative frequencies are currently shifting. Please try again in a moment! 🌟";
    }
  }
};
