// Nano Banana Pro API 配置
const CONFIG = {
  // API Key - 由用户在页面设置，保存在 localStorage
  API_KEY: '',

  // API 基础地址
  API_BASE: 'https://api.kie.ai/api/v1/jobs',

  // 轮询间隔时间（毫秒）
  POLL_INTERVAL: 3000,

  // CORS 代理现在在 app.js 中动态切换多个代理
  // 如需固定使用某个代理，可在此修改

  // 模型名称
  MODEL: 'nano-banana-pro',

  // 默认绘图参数
  DEFAULT_PARAMS: {
    aspect_ratio: '3:4',
    resolution: '2K',
    output_format: 'png'
  }
};
