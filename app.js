/**
 * 儿童识字报生成器 - 核心应用逻辑
 * 处理API调用、任务轮询、状态管理
 */

// 状态管理
const AppState = {
  IDLE: 'idle',
  CREATING: 'creating',
  POLLING: 'polling',
  SUCCESS: 'success',
  ERROR: 'error'
};

let currentState = AppState.IDLE;
let currentTaskId = null;
let pollTimer = null;

/**
 * 更新UI状态
 * @param {string} state - 状态
 * @param {string} message - 消息
 */
function updateState(state, message = '') {
  currentState = state;
  const statusEl = document.getElementById('status');
  const generateBtn = document.getElementById('generateBtn');
  const resultEl = document.getElementById('result');

  if (statusEl) {
    const stateText = {
      [AppState.IDLE]: '等待输入',
      [AppState.CREATING]: '正在创建任务...',
      [AppState.POLLING]: message || '正在生成图片...',
      [AppState.SUCCESS]: '生成完成！',
      [AppState.ERROR]: '生成失败'
    };
    statusEl.textContent = stateText[state] || state;
    statusEl.className = `status ${state}`;
  }

  if (generateBtn) {
    generateBtn.disabled = state === AppState.CREATING || state === AppState.POLLING;
  }

  // 进度条显示控制
  const progressEl = document.getElementById('progressContainer');
  if (progressEl) {
    if (state === AppState.POLLING) {
      progressEl.style.display = 'block';
      // 重置进度
      const bar = progressEl.querySelector('.progress-bar');
      const text = progressEl.querySelector('.progress-text');
      const arrow = progressEl.querySelector('.progress-arrow');
      if (bar) { bar.style.width = '15%'; }
      if (text) { text.textContent = '15%'; }
      if (arrow) { arrow.style.left = '5%'; }
    } else {
      progressEl.style.display = 'none';
    }
  }
}

/**
 * 显示错误信息
 * @param {string} message - 错误消息
 */
function showError(message) {
  updateState(AppState.ERROR, message);
  const errorEl = document.getElementById('error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

/**
 * 清除错误信息
 */
function clearError() {
  const errorEl = document.getElementById('error');
  if (errorEl) {
    errorEl.style.display = 'none';
  }
}

/**
 * 显示生成的图片
 * @param {string} imageUrl - 图片URL
 */
function showResult(imageUrl) {
  const resultEl = document.getElementById('result');
  if (resultEl) {
    resultEl.innerHTML = `
      <div class="result-success">
        <h3>✅ 生成成功！</h3>
        <img src="${imageUrl}" alt="生成的儿童识字报" class="result-image" />
        <a href="${imageUrl}" download="儿童识字报.png" class="download-btn">下载图片</a>
      </div>
    `;
    resultEl.style.display = 'block';
  }
}

/**
 * 隐藏结果区域
 */
function hideResult() {
  const resultEl = document.getElementById('result');
  if (resultEl) {
    resultEl.style.display = 'none';
    resultEl.innerHTML = '';
  }
}

/**
 * 调用API创建任务
 * @param {string} prompt - 提示词
 * @returns {Promise<string>} taskId
 */
async function createTask(prompt) {
  // 尝试多个 CORS 代理
  const corsProxies = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    ''
  ];

  // 从页面读取用户选择的模型和参数
  const selectedModel = document.getElementById('modelSelect')?.value || 'nano-banana-2-lite';
  const resolution = document.getElementById('resolution')?.value || '1K';
  const outputFormat = document.getElementById('outputFormat')?.value || 'jpg';

  // 构建请求体 - 不同模型参数不同
  const input = {
    prompt: prompt,
    aspect_ratio: CONFIG.DEFAULT_PARAMS.aspect_ratio
  };

  // Pro 模型额外参数
  if (selectedModel === 'nano-banana-pro') {
    input.image_input = [];
    input.resolution = resolution;
    input.output_format = outputFormat;
  } else {
    // Lite 模型使用 image_urls
    input.image_urls = [];
  }

  const payload = {
    model: selectedModel,
    input: input
  };

  let lastError = null;

  for (const proxy of corsProxies) {
    const targetUrl = `${CONFIG.API_BASE}/createTask`;
    const url = proxy ? proxy + encodeURIComponent(targetUrl) : targetUrl;

    try {
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.API_KEY}`
        },
        body: JSON.stringify(payload)
      };

      // 如果没有使用代理，需要手动处理 CORS
      if (!proxy) {
        fetchOptions.mode = 'cors';
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.msg || `请求失败: ${response.status}`);
      }

      const data = await response.json();

      if (data.code !== 200) {
        throw new Error(data.msg || '创建任务失败');
      }

      return data.data.taskId;
    } catch (error) {
      lastError = error;
      console.log(`代理 ${proxy || '直连'} 失败:`, error.message);
      continue;
    }
  }

  throw new Error(`网络请求失败，请检查：\n1. 你的 API Key 是否正确\n2. 网络连接是否正常\n3. CORS 代理服务是否可用\n\n错误详情: ${lastError?.message || '未知错误'}`);
}

/**
 * 查询任务状态
 * @param {string} taskId - 任务ID
 * @returns {Promise<object>} 任务数据
 */
async function queryTask(taskId) {
  // 尝试多个 CORS 代理
  const corsProxies = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    ''
  ];

  let lastError = null;

  for (const proxy of corsProxies) {
    const targetUrl = `${CONFIG.API_BASE}/recordInfo?taskId=${taskId}`;
    const url = proxy ? proxy + encodeURIComponent(targetUrl) : targetUrl;

    try {
      const fetchOptions = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CONFIG.API_KEY}`
        }
      };

      if (!proxy) {
        fetchOptions.mode = 'cors';
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`查询失败: ${response.status}`);
      }

      const data = await response.json();

      if (data.code !== 200) {
        throw new Error(data.msg || '查询任务失败');
      }

      return data.data;
    } catch (error) {
      lastError = error;
      console.log(`查询代理 ${proxy || '直连'} 失败:`, error.message);
      continue;
    }
  }

  throw new Error(`查询任务失败: ${lastError?.message || '未知错误'}`);
}

/**
 * 轮询任务状态
 * @param {string} taskId - 任务ID
 */
async function pollTask(taskId) {
  updateState(AppState.POLLING);

  // 模拟进度
  let progress = 0;
  let progressDirection = 1;
  const progressEl = document.getElementById('progressContainer');

  const updateProgress = () => {
    if (progressEl) {
      // 模拟进度在 15%-85% 之间来回
      progress += (Math.random() * 3 + 1) * progressDirection;
      if (progress >= 85) {
        progress = 85;
        progressDirection = -1;
      } else if (progress <= 15) {
        progress = 15;
        progressDirection = 1;
      }
      const bar = progressEl.querySelector('.progress-bar');
      const text = progressEl.querySelector('.progress-text');
      const arrow = progressEl.querySelector('.progress-arrow');
      if (bar) bar.style.width = `${progress}%`;
      if (text) text.textContent = `${Math.round(progress)}%`;
      if (arrow) arrow.style.left = `calc(${progress}% - 10px)`;
    }
  };

  const poll = async () => {
    try {
      const taskData = await queryTask(taskId);
      const state = taskData.state;

      // 更新状态显示
      const statusMap = {
        'waiting': '等待处理...',
        'processing': '正在生成图片...',
        'success': '生成完成！',
        'fail': '生成失败'
      };

      if (state === 'waiting' || state === 'processing') {
        updateState(AppState.POLLING, statusMap[state] || '处理中...');
        updateProgress(); // 更新进度
        // 继续轮询
        pollTimer = setTimeout(poll, CONFIG.POLL_INTERVAL);
      } else if (state === 'success') {
        // 进度条到 100%
        if (progressEl) {
          const bar = progressEl.querySelector('.progress-bar');
          const text = progressEl.querySelector('.progress-text');
          const arrow = progressEl.querySelector('.progress-arrow');
          if (bar) bar.style.width = '100%';
          if (text) text.textContent = '100%';
          if (arrow) arrow.style.left = 'calc(100% - 10px)';
        }
        updateState(AppState.SUCCESS);
        // 隐藏进度条
        if (progressEl) progressEl.style.display = 'none';
        // 解析结果
        if (taskData.resultJson) {
          const result = JSON.parse(taskData.resultJson);
          if (result.resultUrls && result.resultUrls.length > 0) {
            showResult(result.resultUrls[0]);
          } else {
            showError('未获取到图片URL');
          }
        } else {
          showError('未获取到生成结果');
        }
      } else if (state === 'fail') {
        updateState(AppState.ERROR, taskData.failMsg || '生成失败');
        showError(taskData.failMsg || '图片生成失败');
        // 隐藏进度条
        if (progressEl) progressEl.style.display = 'none';
      }
    } catch (error) {
      console.error('轮询错误:', error);
      // 出错后继续轮询，而不是直接停止
      updateState(AppState.POLLING, '网络波动，重试中...');
      pollTimer = setTimeout(poll, CONFIG.POLL_INTERVAL);
    }
  };

  // 开始第一次轮询
  poll();
}

/**
 * 停止轮询
 */
function stopPolling() {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
}

/**
 * MiniMax 图片生成（同步 API）
 * @param {string} prompt - 提示词
 * @returns {Promise<string>} 图片 URL
 */
async function generateWithMiniMax(prompt) {
  const apiKey = localStorage.getItem('minimax_api_key');
  if (!apiKey) {
    throw new Error('请先设置 MiniMax API Key');
  }

  const model = document.getElementById('miniMaxModelSelect')?.value || 'image-01';
  const aspectRatio = document.getElementById('miniMaxAspectRatio')?.value || '3:4';
  const style = document.getElementById('miniMaxStyle')?.value || '';

  // 构建请求
  const payload = {
    model: model,
    prompt: prompt,
    aspect_ratio: aspectRatio,
    response_format: 'url',
    n: 1
  };

  // 如果是 image-01-live 且有选择 style，style 需要是对象格式
  if (model === 'image-01-live' && style) {
    payload.style = { type: style };
  }

  const url = `https://api.minimaxi.com/v1/image_generation`;

  let lastError = null;
  const corsProxies = ['https://corsproxy.io/?', 'https://api.allorigins.win/raw?url=', ''];

  for (const proxy of corsProxies) {
    const targetUrl = url;
    const fetchUrl = proxy ? proxy + encodeURIComponent(targetUrl) : targetUrl;

    try {
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      };

      if (!proxy) {
        fetchOptions.mode = 'cors';
      }

      const response = await fetch(fetchUrl, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.status_msg || `请求失败: ${response.status}`);
      }

      const data = await response.json();

      if (data.base_resp && data.base_resp.status_code !== 0) {
        throw new Error(data.base_resp.status_msg || '生成失败');
      }

      if (data.data && data.data.image_urls && data.data.image_urls.length > 0) {
        return data.data.image_urls[0];
      } else {
        throw new Error('未获取到图片URL');
      }
    } catch (error) {
      lastError = error;
      console.log(`MiniMax 代理 ${proxy || '直连'} 失败:`, error.message);
      continue;
    }
  }

  throw new Error(`MiniMax 请求失败: ${lastError?.message || '未知错误'}`);
}

/**
 * 主生成函数
 * @param {string} theme - 主题/场景
 * @param {string} title - 标题
 */
async function generate(theme, title) {
  // 验证输入
  if (!theme || !theme.trim()) {
    showError('请输入主题/场景');
    return;
  }
  if (!title || !title.trim()) {
    showError('请输入标题');
    return;
  }

  // 获取当前平台
  const platform = document.getElementById('platformSelect')?.value || 'kie';

  // 验证 API Key
  if (platform === 'kie') {
    const savedKey = localStorage.getItem('nano_banana_api_key');
    if (!savedKey) {
      showError('请先设置 Kie.ai API Key');
      return;
    }
  } else {
    const savedKey = localStorage.getItem('minimax_api_key');
    if (!savedKey) {
      showError('请先设置 MiniMax API Key');
      return;
    }
  }

  // 重置状态
  clearError();
  hideResult();
  stopPolling();

  try {
    // 更新状态
    updateState(AppState.CREATING);

    // 构建提示词
    const prompt = buildPrompt(theme.trim(), title.trim());

    // 显示生成的提示词（用于调试）
    const promptPreviewEl = document.getElementById('promptPreview');
    if (promptPreviewEl) {
      promptPreviewEl.textContent = prompt;
      promptPreviewEl.style.display = 'block';
    }

    if (platform === 'kie') {
      // Kie.ai 异步方式
      const taskId = await createTask(prompt);
      currentTaskId = taskId;
      console.log('任务创建成功:', taskId);
      await pollTask(taskId);
    } else {
      // MiniMax 同步方式
      updateState(AppState.POLLING, '正在生成图片...');
      const progressEl = document.getElementById('progressContainer');
      if (progressEl) progressEl.style.display = 'block';

      const imageUrl = await generateWithMiniMax(prompt);
      console.log('生成成功:', imageUrl);

      // 进度到 100%
      if (progressEl) {
        const bar = progressEl.querySelector('.progress-bar');
        const text = progressEl.querySelector('.progress-text');
        const arrow = progressEl.querySelector('.progress-arrow');
        if (bar) bar.style.width = '100%';
        if (text) text.textContent = '100%';
        if (arrow) arrow.style.left = 'calc(100% - 10px)';
      }

      updateState(AppState.SUCCESS);
      if (progressEl) progressEl.style.display = 'none';
      showResult(imageUrl);
    }

  } catch (error) {
    console.error('生成失败:', error);
    showError(error.message || '生成过程中出错');
    updateState(AppState.ERROR);
    const progressEl = document.getElementById('progressContainer');
    if (progressEl) progressEl.style.display = 'none';
  }
}

/**
 * 初始化应用
 */
function initApp() {
  const generateBtn = document.getElementById('generateBtn');
  const themeInput = document.getElementById('theme');
  const titleInput = document.getElementById('title');

  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      const theme = themeInput?.value || '';
      const title = titleInput?.value || '';
      generate(theme, title);
    });
  }

  // 支持回车键提交
  if (themeInput) {
    themeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        titleInput?.focus();
      }
    });
  }
  if (titleInput) {
    titleInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        generateBtn?.click();
      }
    });
  }

  // 初始化状态
  updateState(AppState.IDLE);

  console.log('儿童识字报生成器已初始化');
  console.log('可用场景:', getAvailableScenes().join(', '));
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// 导出函数（支持模块化使用）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generate,
    createTask,
    queryTask,
    stopPolling,
    AppState
  };
}
