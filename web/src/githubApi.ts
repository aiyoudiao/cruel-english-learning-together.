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
    content: string;
    images: string[];
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

  async uploadImageToGithub(imageBase64: string, date: string): Promise<string> {
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `${date}-${randomId}.png`;
    const path = `assets/images/${fileName}`;

    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          message: `Upload image ${fileName}`,
          content: imageBase64,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content.download_url;
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
    return atob(data.content);
  }

  async submitCheckin(
    username: string,
    content: string,
    images: File[],
    date: string
  ): Promise<void> {
    const today = date || new Date().toISOString().split('T')[0];
    const checkinPath = `checkins/${today}.json`;

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

    const uploadedImages: string[] = [];
    for (const image of images) {
      const base64 = await this.fileToBase64(image);
      const imageUrl = await this.uploadImageToGithub(base64, today);
      uploadedImages.push(imageUrl);
    }

    const existingUserIndex = checkinData.users.findIndex(u => u.github === username);

    const userCheckin = {
      github: username,
      content: content,
      images: uploadedImages,
      timestamp: new Date().toISOString(),
    };

    if (existingUserIndex >= 0) {
      checkinData.users[existingUserIndex] = userCheckin;
    } else {
      checkinData.users.push(userCheckin);
    }

    await this.createOrUpdateFile(
      checkinPath,
      JSON.stringify(checkinData, null, 2),
      `Update checkin for ${username} on ${today}`
    );
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
