import { useState } from 'react';
import { GitHubAPI, type GitHubConfig } from './githubApi';
import { Dashboard } from './Dashboard';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [view, setView] = useState<'checkin' | 'dashboard'>('checkin');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !content || !token || !owner || !repo) {
      setMessage('请填写所有必填字段');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const config: GitHubConfig = { owner, repo, token };
      const api = new GitHubAPI(config);
      
      await api.submitCheckin(username, content, images, '');
      
      setMessage('打卡成功！');
      setContent('');
      setImages([]);
    } catch (error) {
      setMessage(`错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const config: GitHubConfig | null = (token && owner && repo) 
    ? { owner, repo, token } 
    : null;

  return (
    <div className="app">
      <div className="container">
        <h1>学习打卡系统</h1>
        
        <div className="config-section">
          <h2>GitHub 配置</h2>
          <input
            type="text"
            placeholder="仓库所有者"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="input"
          />
          <input
            type="text"
            placeholder="仓库名称"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            className="input"
          />
          <input
            type="password"
            placeholder="GitHub Personal Access Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="input"
          />
        </div>

        <div className="view-tabs">
          <button 
            className={`tab-btn ${view === 'checkin' ? 'active' : ''}`}
            onClick={() => setView('checkin')}
          >
            打卡
          </button>
          <button 
            className={`tab-btn ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
            disabled={!config || !username}
          >
            统计面板
          </button>
        </div>

        {view === 'checkin' && (
          <form onSubmit={handleSubmit} className="checkin-form">
            <div className="form-group">
              <label>GitHub 用户名 *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="输入你的 GitHub 用户名"
                required
              />
            </div>

            <div className="form-group">
              <label>学习内容 *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="textarea"
                placeholder="今天学习了什么？"
                rows={6}
                required
              />
            </div>

            <div className="form-group">
              <label>上传图片</label>
              <input
                type="file"
                onChange={handleImageChange}
                className="input"
                accept="image/*"
                multiple
              />
              {images.length > 0 && (
                <div className="image-preview">
                  {images.map((img, index) => (
                    <div key={index} className="image-item">
                      {img.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? '提交中...' : '提交打卡'}
            </button>

            {message && (
              <div className={`message ${message.includes('错误') ? 'error' : 'success'}`}>
                {message}
              </div>
            )}
          </form>
        )}

        {view === 'dashboard' && config && username && (
          <Dashboard config={config} username={username} />
        )}
      </div>
    </div>
  );
}

export default App;
