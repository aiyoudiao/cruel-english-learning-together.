import { useState, useEffect } from 'react';
import { GitHubAPI, type GitHubConfig, type CheckinData } from './githubApi';

interface UserStats {
  username: string;
  totalCheckins: number;
  currentStreak: number;
  longestStreak: number;
}

interface DashboardData {
  leaderboard: UserStats[];
  latestCheckins: CheckinData[];
  userStats: UserStats | null;
}

export function Dashboard({ config, username }: { config: GitHubConfig; username: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [config, username]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const api = new GitHubAPI(config);
      
      const readmeContent = await api.getFile('README.md');
      const checkinsData = await parseReadmeData(readmeContent || '');
      
      setData(checkinsData);
    } catch (err) {
      setError(`加载数据失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const parseReadmeData = (content: string): DashboardData => {
    const leaderboard: UserStats[] = [];
    const latestCheckins: CheckinData[] = [];
    
    const leaderboardMatch = content.match(/\| 用户 \| 总打卡次数 \| 连续打卡 \|([\s\S]*?)(?=\n\n##|$)/);
    if (leaderboardMatch) {
      const rows = leaderboardMatch[1].split('\n').filter(row => row.includes('|'));
      rows.forEach(row => {
        const parts = row.split('|').map(p => p.trim()).filter(p => p);
        if (parts.length >= 3) {
          const usernameMatch = parts[0].match(/\[(.*?)\]/);
          if (usernameMatch) {
            leaderboard.push({
              username: usernameMatch[1],
              totalCheckins: parseInt(parts[1]) || 0,
              currentStreak: parseInt(parts[2]) || 0,
              longestStreak: 0
            });
          }
        }
      });
    }

    const userStats = leaderboard.find(u => u.username === username) || null;

    return { leaderboard, latestCheckins, userStats };
  };

  if (loading) {
    return <div className="dashboard-loading">加载中...</div>;
  }

  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  if (!data) {
    return <div className="dashboard-empty">暂无数据</div>;
  }

  return (
    <div className="dashboard">
      {data.userStats && (
        <div className="dashboard-section user-stats">
          <h2>我的统计</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{data.userStats.totalCheckins}</div>
              <div className="stat-label">总打卡次数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.userStats.currentStreak}</div>
              <div className="stat-label">连续打卡</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.userStats.longestStreak}</div>
              <div className="stat-label">最长连续</div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-section leaderboard">
        <h2>排行榜</h2>
        <div className="leaderboard-list">
          {data.leaderboard.slice(0, 10).map((user, index) => (
            <div key={user.username} className={`leaderboard-item ${index < 3 ? 'top-' + (index + 1) : ''}`}>
              <div className="rank">{index + 1}</div>
              <div className="username">{user.username}</div>
              <div className="stats">
                <span>{user.totalCheckins} 次打卡</span>
                <span>{user.currentStreak} 天连续</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.latestCheckins.length > 0 && (
        <div className="dashboard-section latest-checkins">
          <h2>最新打卡</h2>
          <div className="checkins-list">
            {data.latestCheckins.slice(0, 5).map((checkin, index) => (
              <div key={index} className="checkin-item">
                <div className="checkin-date">{checkin.date}</div>
                {checkin.users.map((user, userIndex) => (
                  <div key={userIndex} className="checkin-user">
                    <span className="user-name">{user.github}</span>
                    <span className="checkin-content">{user.content.substring(0, 100)}...</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
