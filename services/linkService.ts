export const linkService = {
  extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const matches = text.match(urlRegex);
    return matches ? Array.from(new Set(matches)) : [];
  },

  truncateUrl(url: string, maxLength = 40): { display: string; title: string } {
    try {
      const u = new URL(url);
      let host = u.host.replace(/^www\./i, '');
      let path = u.pathname + (u.search || '');

      if (path === '' || path === '/') {
        return { display: host, title: url };
      }

      let formatted = `${host}${path}`;

      if (formatted.length > maxLength) {
        formatted = formatted.slice(0, maxLength - 3) + '...';
      }

      return { display: formatted, title: url };
    } catch {
      let trimmed = url.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
      if (trimmed.length > maxLength) {
        trimmed = trimmed.slice(0, maxLength - 3) + '...';
      }
      return { display: trimmed, title: url };
    }
  },

  isUrl(token: string): boolean {
    return /^https?:\/\/[^\s]+$/i.test(token);
  }
};

