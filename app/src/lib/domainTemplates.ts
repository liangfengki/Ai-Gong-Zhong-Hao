export type DomainGenerationMode = 'title' | 'outline' | 'article';

export interface DomainTemplate {
  id: string;
  name: string;
  positioning: string;
  keywords: string[];
  wordCount: {
    min: number;
    max: number;
    recommended: number;
  };
  imageAdvice: string;
  publishingRhythm: string;
  titleFormulas: string[];
  contentStructure: string[];
  layoutAdvice: string;
  cta: string;
  exampleTitles: string[];
}

export const domainTemplates: DomainTemplate[] = [
  {
    id: 'ai-tools',
    name: 'AI工具推荐',
    positioning: '面向效率敏感型读者，主打省时、省钱、提效，以清单测评降低决策成本。',
    keywords: ['工具', '推荐', '免费', '排行榜', '使用', '场景', '提效'],
    wordCount: { min: 1175, max: 1675, recommended: 1400 },
    imageAdvice: '5-10张，每个工具1张主图或界面图，关键功能可用红框标注。',
    publishingRhythm: '系列化期号效果最佳，每周1期。',
    titleFormulas: [
      'N个免费/实用/冷门的XX AI工具推荐',
      '202X年XX场景AI工具排行榜/最全汇总',
      '我自己用的AI工具推荐排行榜：第X名是...',
      'AI工具推荐 | 日期期号',
      '学术研究/办公/设计用AI工具推荐：XXX利器',
    ],
    contentStructure: [
      '开头点明场景痛点，例如还在手动做XXX。',
      '主体逐个工具展开：名称、一句话定位、核心功能、适用场景、价格或入口。',
      '每个工具配产品截图、界面图或核心功能图。',
      '结尾用对比表或总结清单帮助收藏决策。',
      '用提问引导读者留言补充工具。',
    ],
    layoutAdvice: '数字序号、工具名加粗、功能点列表化，结尾放对比表。',
    cta: '引导收藏、试用、留言补充工具。',
    exampleTitles: [
      '2026年电商实用的批量文生图AI工具推荐',
      '5个免费AI工具推荐',
      'AI工具推荐：24款AI神器，新手直接抄作业',
      '学术研究用AI工具推荐：论文写作与数据分析利器',
      '年度比较火的十大AI工具推荐',
    ],
  },
  {
    id: 'side-hustle',
    name: '副业搞钱',
    positioning: '面向渴望增加收入的人群，强调低门槛、可复制、真实收益。',
    keywords: ['副业', '赚钱', '搞钱', '计划', '指南', '普通人', '下班'],
    wordCount: { min: 1130, max: 1630, recommended: 1400 },
    imageAdvice: '4-8张，收益图、步骤图、避坑提示图，涉及隐私必须打码。',
    publishingRhythm: '连载或日记体，每周2-3篇形成追更。',
    titleFormulas: [
      'XX天副业赚钱计划：第X天XXXX',
      '普通人下班后可做的N个副业/搞钱路子',
      '靠XX副业月入X万：我的实操日记',
      '不想上班？这X个副业让你在家赚钱',
      '从0到1：XX副业上手全流程',
    ],
    contentStructure: [
      '开头用身份反差、收入截图或真实处境建立信任。',
      '按选项目、起号、获客、变现、避坑五段展开。',
      '写清成本、周期、难点和不适合人群。',
      '提供阶段性复盘和下一步计划。',
      '结尾引导追更或交流。',
    ],
    layoutAdvice: '时间线或日记体，小标题加粗，关键数字突出显示。',
    cta: '引导点赞、追更、进群交流。',
    exampleTitles: [
      '副业搞钱指南：普通人也能上手的五类副业',
      '27天副业赚钱计划：下班后肝了18个视频',
      '副业赚钱慢人一步？你缺的不是能力，是信息差',
      '副业赚钱全攻略：4大类渠道从新手到高手',
      '副业赚钱的人，都有一个底层习惯',
    ],
  },
  {
    id: 'media-ops',
    name: '自媒体运营',
    positioning: '面向内容创作者，提供可复制的运营方法论和平台规则解读。',
    keywords: ['媒体', '运营', '内容', '平台', '选题', '数据', '变现'],
    wordCount: { min: 1035, max: 1535, recommended: 1300 },
    imageAdvice: '3-8张，后台数据截图、爆款案例、思维导图。',
    publishingRhythm: '干货长文，每周1-2篇。',
    titleFormulas: [
      '自媒体运营的X个核心能力/真相',
      '从0到1做自媒体：XX天起号实操',
      '如何靠自媒体月入X万？干货分享',
      '自媒体人必备的X个工具/习惯',
      '为什么你的自媒体不涨粉？原因在这',
    ],
    contentStructure: [
      '开头点出一个普遍误区或焦虑。',
      '主体围绕定位、内容、选题、发布、数据、变现展开。',
      '每段提供一个可执行动作。',
      '结合后台数据或案例增强可信度。',
      '结尾给行动清单。',
    ],
    layoutAdvice: '论点化小标题、加粗金句，文末可放思维导图式清单。',
    cta: '引导关注、领资料、加入创作者社群。',
    exampleTitles: [
      '自媒体运营的底层逻辑：影响用户行为的7个心理因素',
      '学习自媒体运营，这些技巧你需要了解',
      '企业自媒体运营完全手册',
      '自媒体运营中哪些红线不能踩',
      '30款体育自媒体运营工具：微信编辑器+图文排版',
    ],
  },
  {
    id: 'short-video-commerce',
    name: '短视频带货',
    positioning: '面向想通过短视频或直播卖货的人，侧重平台规则和实操流程。',
    keywords: ['视频', '带货', '直播', '风口', '赚钱', '选品', '投流'],
    wordCount: { min: 1340, max: 1940, recommended: 1600 },
    imageAdvice: '6-12张，平台后台、选品数据、剪辑界面、GMV截图。',
    publishingRhythm: '紧跟平台政策，热点型发布。',
    titleFormulas: [
      'XX平台短视频带货全流程/变天了',
      '新号0粉丝0押金怎么做短视频带货？',
      '短视频带货月入X万：选品+剪辑+投流',
      'X个短视频带货爆款模板直接抄',
      'XXX短视频带货要变天了，入局必看',
    ],
    contentStructure: [
      '开头用平台政策变化或红利窗口制造紧迫感。',
      '主体按账号准备、选品、素材、剪辑、发布、投流、复盘展开。',
      '给出关键参数、常见错误和避坑提醒。',
      '用案例说明不同路径适合的人群。',
      '结尾给资料包或下一篇预告。',
    ],
    layoutAdvice: '步骤式小标题、关键参数加粗、注意事项单独提示。',
    cta: '引导领资料、进群、关注政策解读。',
    exampleTitles: [
      '短视频带货90%的人死在第一步',
      '短视频带货，让豆包给你干活的26个指令',
      '快手短视频带货流程',
      '京东短视频带货来了，风口项目，逛逛月入3k+',
      '用AI做短视频带货，为什么有人月入过万',
    ],
  },
  {
    id: 'personal-ip',
    name: '个人IP打造',
    positioning: '面向专业人士和创业者，强调长期价值、信任资产和差异化定位。',
    keywords: ['个人', 'IP', '定位', '内容', '信任', '变现', '流量'],
    wordCount: { min: 1170, max: 1670, recommended: 1400 },
    imageAdvice: '3-7张，定位矩阵图、案例账号截图、人设标签图。',
    publishingRhythm: '深度长文，每周1篇。',
    titleFormulas: [
      '同城个人IP打造怎么做：从0到1的实操路径',
      '个人IP打造的X大好处：为什么越早做越吃香',
      '打造个人IP，先把“人设半径”定死',
      '为什么普通人也要做个人IP？',
      '从0到1打造XX领域个人IP',
    ],
    contentStructure: [
      '开头用反常识观点或真实案例引发思考。',
      '主体按定位、内容、表达、信任、变现、放大递进。',
      '用定位矩阵或标签清单降低理解成本。',
      '指出短期流量和长期信任的区别。',
      '结尾用金句总结并给行动号召。',
    ],
    layoutAdvice: '概念化小标题、加粗核心观点、穿插案例引用。',
    cta: '引导咨询、关注、加入IP陪跑社群。',
    exampleTitles: [
      '个人IP打造方案：从0到1怎么搭框架',
      '同城个人IP打造，拼的真不是流量',
      '个人IP打造怎么做？从定位到内容的落地清单',
      '个人IP打造还能做吗？2026现状与入局判断',
      '个人IP打造的底层逻辑：从定位到变现',
    ],
  },
  {
    id: 'xiaohongshu-growth',
    name: '小红书涨粉',
    positioning: '面向小红书创作者，聚焦平台算法、爆款笔记和快速涨粉技巧。',
    keywords: ['涨粉', '小红书', '赛道', '封面', '标题', '笔记', '账号'],
    wordCount: { min: 1105, max: 1605, recommended: 1350 },
    imageAdvice: '5-10张，小红书截图、封面案例、数据图、模板图。',
    publishingRhythm: '攻略加案例结合，每周2篇。',
    titleFormulas: [
      '小红书涨粉的X个核心逻辑',
      '新手做小红书：X天涨粉XX的实操方法',
      '小红书爆款笔记的X个模板',
      '为什么你的小红书不涨粉？问题在这',
      '小红书X大赛道涨粉攻略',
    ],
    contentStructure: [
      '开头展示涨粉结果或指出常见错误。',
      '主体按账号装修、选题、封面、标题、内容、互动、变现展开。',
      '拆解爆款案例，不只给结论。',
      '提供模板或检查清单。',
      '结尾引导领取资料或加入互助。',
    ],
    layoutAdvice: '步骤式小标题、关键词加粗，可适度使用表情增强平台感。',
    cta: '引导领模板、进群互赞、关注涨粉系列。',
    exampleTitles: [
      '为什么你的小红书不涨粉？',
      '小红书涨粉与内容创作全攻略',
      '3个月从0涨粉到7万粉！小红书数码赛道如何起号',
      '小红书涨粉到500，快速且不被限流的6大技巧',
      '一套小红书万能涨粉公式',
    ],
  },
  {
    id: 'ai-startup',
    name: 'AI创业项目',
    positioning: '面向创业者和投资人，分析AI赛道趋势、商业模式和落地路径。',
    keywords: ['创业', 'AI项目', '模型', 'Agent', '商业模式', '融资', '落地'],
    wordCount: { min: 1265, max: 1865, recommended: 1550 },
    imageAdvice: '3-7张，行业数据图、框架图、案例产品图。',
    publishingRhythm: '深度分析，每周1篇。',
    titleFormulas: [
      'AI创业进入下半场：XXXX成为新战场',
      'AI创业的X种坏战略/好机会',
      '一个XX后的AI创业项目，如何拿到千万投资？',
      'XX个AI创业项目，最后只剩X个：行业真相',
      'AI创业到底是谁的主场？',
    ],
    contentStructure: [
      '开头抛出行业判断或反常识观点。',
      '主体用趋势、案例、逻辑、结论结构。',
      '分析商业模式、成本结构和落地难点。',
      '给出创业者可执行的判断框架。',
      '结尾用清单式结论收束。',
    ],
    layoutAdvice: '总分总结构，小标题即论点，结尾用结论清单。',
    cta: '引导关注、加入创业交流群、获取行业报告。',
    exampleTitles: [
      'AI创业进入下半场：模型之后，Agent落地成为新战场',
      'AI创业的五种坏战略：你是否误把假象当成了方向',
      '300个AI创业项目，最后只剩15个',
      'AI创业别瞎干：先想清楚该进攻、验证、观察还是放弃',
      '一个00后大学生的AI创业项目，如何吸引到千万投资',
    ],
  },
  {
    id: 'chatgpt-monetization',
    name: 'ChatGPT赚钱',
    positioning: '面向想用ChatGPT和大模型变现的人群，主打具体赚钱项目和prompt技巧。',
    keywords: ['ChatGPT', '赚钱', '变现', 'prompt', '副业', '工具', '项目'],
    wordCount: { min: 1109, max: 1609, recommended: 1350 },
    imageAdvice: '4-8张，对话截图、收益图、流程图、prompt示例图。',
    publishingRhythm: '项目型或模板型，每周1-2篇。',
    titleFormulas: [
      'ChatGPT赚钱的X种方法/项目',
      '用ChatGPT做XX，月入X万实操',
      'ChatGPT+X：普通人也能做的副业',
      'ChatGPT赚钱prompt模板合集',
      '202X年ChatGPT变现指南',
    ],
    contentStructure: [
      '开头展示机会窗口、收益案例或工具变化。',
      '主体按项目介绍、所需工具、操作步骤、变现方式、案例展开。',
      '提供可直接复制的prompt模板。',
      '写明风险、成本和适合人群。',
      '结尾引导领取prompt合集。',
    ],
    layoutAdvice: '项目编号、prompt代码块、关键步骤加粗。',
    cta: '引导领prompt、进群、关注变现系列。',
    exampleTitles: [
      'ChatGPT赚钱的10种方法',
      'ChatGPT+小红书：普通人也能做的副业',
      'ChatGPT赚钱prompt模板合集',
      '2026年ChatGPT变现指南',
      '用ChatGPT做资料整理，月入副业第一单',
    ],
  },
];

export function getDomainTemplateById(id: string) {
  return domainTemplates.find((template) => template.id === id);
}

export function buildDomainTemplatePrompt({
  template,
  topic,
  mode,
  extraRequirement,
}: {
  template: DomainTemplate;
  topic: string;
  mode: DomainGenerationMode;
  extraRequirement?: string;
}) {
  const normalizedTopic = topic.trim() || template.name;
  const modeInstruction = {
    title: '只生成10个公众号标题。每个标题单独一行，不要写正文。',
    outline: '只生成文章大纲。包含标题建议、开头角度、一级小标题、配图位置和结尾CTA。',
    article: '生成一篇完整公众号文章。使用Markdown格式输出，包含吸引人的标题、开头、小标题、正文和结尾CTA。',
  }[mode];

  return [
    `请围绕「${normalizedTopic}」进行公众号内容创作。`,
    '',
    `领域：${template.name}`,
    `定位：${template.positioning}`,
    `核心关键词：${template.keywords.join('、')}`,
    `推荐字数：${template.wordCount.min}-${template.wordCount.max}字，本次目标约${template.wordCount.recommended}字。`,
    `配图建议：${template.imageAdvice}`,
    `发布节奏：${template.publishingRhythm}`,
    '',
    '标题公式：',
    ...template.titleFormulas.map((formula, index) => `${index + 1}. ${formula}`),
    '',
    '内容结构：',
    ...template.contentStructure.map((item, index) => `${index + 1}. ${item}`),
    '',
    `排版建议：${template.layoutAdvice}`,
    `CTA：${template.cta}`,
    '',
    '参考标题：',
    ...template.exampleTitles.map((title, index) => `${index + 1}. ${title}`),
    '',
    `生成要求：${modeInstruction}`,
    '语言要求：适合微信公众号阅读，表达具体、自然、有信息密度，避免空泛套话。',
    extraRequirement?.trim() ? `补充要求：${extraRequirement.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
