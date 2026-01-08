const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://aura-back-s1bw.onrender.com/api/gemini';

export const geminiService = {
  async generatePostInspiration(topic: string) {
    try {
      const response = await fetch(`${BACKEND_URL}/inspiration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  async generateQuirkyBirthdayWish(name: string, bio: string = "") {
    try {
      const response = await fetch(`${BACKEND_URL}/birthday`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio }),
      });
      if (!response.ok) throw new Error('Backend error');
      const data = await response.json();
      return data.text || `Another rotation around the sun completed, ${name}. Your frequency is undeniable. Stay weird! 🌀🎸🍰`;
    } catch (error) {
      console.error("Birthday Error:", error);
      return `Universal sync complete: ${name} is officially one orbit older. Energy levels at maximum! 🚀✨🎂`;
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
  }
};
