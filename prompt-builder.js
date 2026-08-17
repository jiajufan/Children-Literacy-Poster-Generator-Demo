/**
 * 儿童识字小报提示词构建器
 * 根据主题/场景联想相关词汇，生成AI绘图提示词
 */

// 场景词汇库 - 预定义常见场景及其关联词汇
const SCENE_VOCABULARY = {
  '超市': {
    核心角色: ['shōu yín yuán 收银员', 'gù kè 顾客', 'bǎo mǔ 保姆'],
    设施: ['huò jià 货架', 'shōu yín tái 收银台', 'gòu wù chē 购物车', 'gòu wù lán 购物篮'],
    物品: ['píng guǒ 苹果', 'niú nǎi 牛奶', 'miàn bāo 面包', 'jī dàn 鸡蛋', 'xiāng cháng 香肠', 'shuǐ guǒ 水果', 'shū cài 蔬菜', 'bīng xiāng 冰箱'],
    环境: ['chū kǒu 出口', 'rù kǒu 入口', 'jià gé biāo 价格标', 'dēng guāng 灯光', 'qiáng bì 墙壁', 'dì bǎn 地板']
  },
  '医院': {
    核心角色: ['yī shēng 医生', 'hù shi 护士', 'bìng rén 病人', 'jiù hù chē 救护车'],
    设施: ['bìng chuáng 病床', 'guà hào chù 挂号处', 'qǔ yào chù 取药处', 'zhěn shì 诊室'],
    物品: ['tǐ wēn jì 体温计', 'yào píng 药瓶', 'shuǐ hú 水壶', 'kǒu zhào 口罩', 'bái dà guà 白大褂', 'zhěn duàn zhěn 诊断枕'],
    环境: ['bái yī qiáng 白衣墙', 'hùn níng tǔ 混凝土', 'zhěn duàn dēng 诊断灯', 'lù dēng 绿灯', 'zǒu láng 走廊', 'mén 门']
  },
  '公园': {
    核心角色: ['mā ma 妈妈', 'bà ba 爸爸', 'hái zi 孩子', 'lǎo yé ye 老爷爷'],
    设施: ['qiū qiān 秋千', 'huá tī 滑梯', 'shā kēng 沙坑', 'cháng yǐ 长椅', 'lù dēng 路灯'],
    物品: ['fēng zheng 风筝', 'bèi ké 贝壳', 'shā chē 沙车', 'pái qiú 皮球', 'tàn fǔ 碳斧'],
    环境: ['cǎo dì 草地', 'huā duǒ 花朵', 'shù yè 树叶', 'xiǎo lù 小路', ' hú dié 蝴蝶', 'niǎo er 鸟儿']
  },
  '学校': {
    核心角色: ['lǎo shī 老师', 'tóng xué 同学', 'xiào zhǎng 校长', 'bān zhǎng 班长'],
    设施: ['jiǎng tái 讲台', 'hēi bǎn 黑板', 'kè zhuō 课桌', 'kē chē 课椅', ' tú shū guǎn 图书馆'],
    物品: ['shū bāo 书包', 'bǐ 笔', 'bǐn dài 笔袋', 'zuò yè 作业', 'kè běn 课本', 'qiān bǐ 铅笔', 'xiàng pí 橡皮'],
    环境: ['cāo chǎng 操场', 'guó qí 国旗', 'lǜ shù 绿树', 'huā tán 花坛', 'zǒu láng 走廊', 'tī zi 梯子']
  },
  '餐厅': {
    核心角色: ['chú shī 厨师', 'fú wù yuán 服务员', 'gù kè 顾客', 'shōu yín yuán 收银员'],
    设施: ['cān zhuō 餐桌', 'yǐ zi 椅子', 'chú fáng 厨房', 'shōu yín tái 收银台'],
    物品: ['fàn cài 饭菜', 'wǎn kuài 碗筷', 'bēi zi 杯子', 'cài dān 菜单', 'zhǐ jīn 纸巾', 'tāng chí 汤匙'],
    环境: ['dēng guāng 灯光', 'zhuāng shì 装饰', 'huā píng 花瓶', 'qiáng bì 墙壁', 'dì tǎn 地毯', 'kōng tiáo 空调']
  },
  '家庭': {
    核心角色: ['bà ba 爸爸', 'mā ma 妈妈', 'hái zi 孩子', 'yé ye 爷爷', 'nǎi nai 奶奶'],
    设施: ['shā fā 沙发', 'diàn shì 电视', 'kē fēi jī 咖啡机', 'bō li chuāng 玻璃窗'],
    物品: ['shuǐ guǒ 水果', 'kā fēi 咖啡', 'bào zhǐ 报纸', 'xiàng kuàng 相框', 'huā píng 花瓶', 'tái dēng 台灯'],
    环境: ['qiáng bì 墙壁', 'dì bǎn 地板', 'mén chuāng 门窗', 'lǜ zhí 绿植', 'huā duǒ 花朵', 'dēng guāng 灯光']
  },
  '图书馆': {
    核心角色: ['guǎn lǐ yuán 管理员', 'dú zhě 读者', 'xué sheng 学生', 'lǎo shī 老师'],
    设施: ['shū jià 书架', 'yuè dú zhuō 阅读桌', 'yǐ zi 椅子', 'dēng jù 灯具'],
    物品: ['shū 书籍', 'bào zhǐ 报纸', 'zá zhì 杂志', 'gōng jù 工具书', 'suí shēn xiǎo 随身小', 'bǐ jì běn 笔记本'],
    环境: ['jìng qiāo 静悄', 'mù zhǎo 木栅', 'cān guǎn 餐馆', 'huā pén 花盆', 'lǜ zhí 绿植', 'chuāng liàng 窗亮']
  },
  '游乐场': {
    核心角色: ['xiǎo péng yǒu 小朋友', 'bà ba 爸爸', 'mā ma 妈妈', 'jiā zhǎng 家长'],
    设施: ['xuán zhuǎn mù mǎ旋转木马', 'guò shān chē 过山车', 'xuě qiū qiān 雪秋千', 'zhuǎ dēng 旋转灯'],
    物品: ['bīng jī lín 冰淇淋', 'qì qiú 气球', 'xiàn dài 线袋', 'táng guǒ 糖果', 'shuǐ pào 水泡'],
    环境: ['cǎi dēng 彩灯', 'qí guài 奇怪', 'lù dēng 路登', 'huā duǒ 花朵', 'cǎo dì 草地', 'mù wū 木屋']
  },
  '海滩': {
    核心角色: ['bà ba 爸爸', 'mā ma 妈妈', 'hái zi 孩子', 'jiù shēng yuán 救生员'],
    设施: ['zhàng péng 帐篷', 'chōng lǎng qíng 冲浪情', 'shā tān 沙滩', 'yǐ zi 椅子'],
    物品: ['shā chē 沙车', 'shuǐ qiāng 水枪', 'bào quān 报圈', 'tài yáng jìng 太阳镜', 'kù zèng 库赠', 'mào zǐ 帽子'],
    环境: ['dà hǎi 大海', 'lán tiān 蓝天', 'bái yún 白云', 'hǎi làng 海浪', 'bèi ké 贝壳', 'shā lì 沙粒']
  },
  '消防站': {
    核心角色: ['xiāo fáng yuán 消防员', 'duì zhǎng 队长', 'gù kè 顾客'],
    设施: ['xiāo fáng chē 消防车', 'péng huái 蓬槐', 'tī zi 梯子', 'jiù hù chē 救护车'],
    物品: ['shuǐ dài 水带', 'fǔ tóu 斧头', 'mào zǐ 帽子', 'xǐn hào dēng 信号灯', 'yáo kòng qì 遥控器'],
    环境: ['hóng sè 红色', 'jiù hù 救护', 'guàn gài 罐盖', 'qiáng bì 墙壁', 'dēng guāng 灯光', 'mén 门']
  }
};

// 默认词汇（当场景不在词库中时使用）
const DEFAULT_VOCABULARY = {
  核心角色: ['mā ma 妈妈', 'bà ba 爸爸', 'hái zi 孩子', 'péng yǒu 朋友'],
  设施: ['fáng zi 房子', 'zhuō zi 桌子', 'yǐ zi 椅子', 'mén 门', 'chuāng 窗'],
  物品: ['shuǐ 水', 'guǒ 果', 'cài 菜', 'ròu 肉', 'miàn 面', 'fàn 饭'],
  环境: ['qiáng 墙', 'dì 地', 'tiān 花板', 'dēng 灯', 'huā 花', 'cǎo 草']
};

/**
 * 根据场景获取词汇列表
 * @param {string} scene - 场景名称
 * @returns {object} 词汇对象
 */
function getVocabularyByScene(scene) {
  // 精确匹配
  if (SCENE_VOCABULARY[scene]) {
    return SCENE_VOCABULARY[scene];
  }

  // 模糊匹配 - 检查是否包含关键词
  for (const [key, vocab] of Object.entries(SCENE_VOCABULARY)) {
    if (scene.includes(key) || key.includes(scene)) {
      return vocab;
    }
  }

  // 返回默认词汇
  return DEFAULT_VOCABULARY;
}

/**
 * 构建儿童识字小报提示词
 * @param {string} theme - 主题/场景
 * @param {string} title - 标题
 * @returns {string} 完整的AI绘图提示词
 */
function buildPrompt(theme, title) {
  const vocab = getVocabularyByScene(theme);

  // 提取各类词汇
  const coreRoles = vocab.核心角色.join(', ');
  const tools = vocab.设施.join(', ');
  const items = vocab.物品.join(', ');
  const environment = vocab.环境.join(', ');

  // 使用模板构建提示词
  const prompt = `请生成一张儿童识字小报《${theme}》，竖版 A4，学习小报版式，适合 5–9 岁孩子 认字与看图识物。

# 一、小报标题区（顶部）

**顶部居中大标题**：《${title}》
* **风格**：十字小报 / 儿童学习报感
* **文本要求**：大字、醒目、卡通手写体、彩色描边
* **装饰**：周围添加与 ${theme} 相关的贴纸风装饰，颜色鲜艳

# 二、小报主体（中间主画面）

画面中心是一幅 **卡通插画风的「${theme}」场景**：
* **整体气氛**：明亮、温暖、积极
* **构图**：物体边界清晰，方便对应文字，不要过于拥挤。

**场景分区与核心内容**
1.  **核心区域 A（主要对象）**：表现 ${theme} 的核心活动。
2.  **核心区域 B（配套设施）**：展示相关的工具或物品。
3.  **核心区域 C（环境背景）**：体现环境特征（如墙面、指示牌等）。

**主题人物**
* **角色**：1 位可爱卡通人物（职业/身份：与 ${theme} 匹配）。
* **动作**：正在进行与场景相关的自然互动。

# 三、必画物体与识字清单（Generated Content）

**请务必在画面中清晰绘制以下物体，并为其预留贴标签的位置：**

**1. 核心角色与设施：**
${coreRoles}

**2. 常见物品/工具：**
${tools}

**3. 环境与装饰：**
${items}

*(注意：画面中的物体数量不限于此，但以上列表必须作为重点描绘对象)*

# 四、识字标注规则

对上述清单中的物体，贴上中文识字标签：
* **格式**：两行制（第一行拼音带声调，第二行简体汉字）。
* **样式**：彩色小贴纸风格，白底黑字或深色字，清晰可读。
* **排版**：标签靠近对应的物体，不遮挡主体。

# 五、画风参数
* **风格**：儿童绘本风 + 识字小报风
* **色彩**：高饱和、明快、温暖 (High Saturation, Warm Tone)
* **质量**：8k resolution, high detail, vector illustration style, clean lines.`;

  return prompt;
}

/**
 * 获取所有可用场景列表
 * @returns {string[]} 场景名称数组
 */
function getAvailableScenes() {
  return Object.keys(SCENE_VOCABULARY);
}

/**
 * 检查场景是否在词库中
 * @param {string} scene - 场景名称
 * @returns {boolean}
 */
function isKnownScene(scene) {
  if (SCENE_VOCABULARY[scene]) return true;
  for (const key of Object.keys(SCENE_VOCABULARY)) {
    if (scene.includes(key) || key.includes(scene)) return true;
  }
  return false;
}

// 导出函数（支持模块化使用）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildPrompt,
    getVocabularyByScene,
    getAvailableScenes,
    isKnownScene,
    SCENE_VOCABULARY
  };
}
