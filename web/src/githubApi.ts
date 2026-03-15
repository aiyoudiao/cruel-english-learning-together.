const GITHUB_API_BASE = 'https://api.github.com';

export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
}

export interface CheckinData {
  date: string;
  users: Array<{
    github: string;
    title?: string;
    category: string;
    content_md: string;
    assets: string[];
    tags: string[];
    timestamp: string;
  }>;
}

export class GitHubAPI {
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = config;
  }

  private getHeaders() {
    return {
      'Authorization': `token ${this.config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }

  async createOrUpdateFile(path: string, content: string, message: string): Promise<void> {
    const url = `${GITHUB_API_BASE}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;

    const getResponse = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    let sha: string | undefined;

    if (getResponse.ok) {
      const data = await getResponse.json();
      sha = data.sha;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({
        message,
        content: btoa(unescape(encodeURIComponent(content))),
        sha,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create/update file: ${response.statusText}`);
    }
  }

  async getFile(path: string): Promise<string | null> {
    const url = `${GITHUB_API_BASE}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to get file: ${response.statusText}`);
    }

    const data = await response.json();
    // GitHub API returns content in base64, usually with newlines. 
    // We should remove newlines before decoding just in case, though atob handles some.
    // Also handle utf-8 characters correctly.
    const rawContent = data.content.replace(/\n/g, '');
    try {
        return decodeURIComponent(escape(atob(rawContent)));
    } catch (e) {
        // Fallback for simple ascii
        return atob(rawContent);
    }
  }

  async getUserCheckin(
    username: string,
    category: string,
    date: string = ''
  ): Promise<CheckinData['users'][0] | null> {
    const today = date || new Date().toISOString().split('T')[0];
    const checkinPath = `checkins/${category}/${today}.json`;
    
    try {
      const existingData = await this.getFile(checkinPath);
      if (!existingData) return null;
      
      const checkinData: CheckinData = JSON.parse(existingData);
      const userEntry = checkinData.users.find(u => u.github === username);
      
      return userEntry || null;
    } catch (error) {
      console.warn(`Error fetching checkin for ${username} on ${today}:`, error);
      return null;
    }
  }

  async submitCheckin(
    username: string,
    title: string,
    category: string,
    content: string,
    assets: string[],
    tags: string[],
    date: string
  ): Promise<void> {
    const today = date || new Date().toISOString().split('T')[0];
    const checkinPath = `checkins/${category}/${today}.json`;

    const existingData = await this.getFile(checkinPath);
    let checkinData: CheckinData;

    if (existingData) {
      checkinData = JSON.parse(existingData);
    } else {
      checkinData = {
        date: today,
        users: [],
      };
    }

    const userCheckin = {
      github: username,
      title: title,
      category: category,
      content_md: content,
      assets: assets,
      tags: tags,
      timestamp: new Date().toISOString(),
    };

    const existingUserIndex = checkinData.users.findIndex(u => u.github === username);

    if (existingUserIndex >= 0) {
      // Update existing checkin
      checkinData.users[existingUserIndex] = userCheckin;
    } else {
      // Add new checkin
      checkinData.users.push(userCheckin);
    }

    await this.createOrUpdateFile(
      checkinPath,
      JSON.stringify(checkinData, null, 2),
      `Update checkin for ${username} in ${category} on ${today}`
    );
  }
}
