"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CustomCursor from "./CustomCursor";
import portraitCredits from "./portrait-credits.json";

type Mode = {
  id: string;
  icon: string;
  title: string;
  short: string;
  loop: string;
  action: string;
  function: string;
};

type ExperimentPlan = {
  id: string;
  title: string;
  route: string;
  reading: string;
  trap: string;
  hypothesis: string;
  action: string;
  evidence: string;
  update: string;
  keywords: RegExp;
};

type EvidenceEntry = {
  id: string;
  question: string;
  prediction: string;
  probability: number;
  action: string;
  result: string;
  createdAt: string;
};

type Topic = "career" | "relationship" | "action" | "selfworth" | "meaning" | "default";

const workspaceTabs = [
  ["now", "当前状态"], ["map", "认知地图"], ["lab", "现实实验"],
  ["boundary", "边界排练"], ["salon", "深潜会客厅"], ["archive", "心智档案"],
] as const;
type WorkspaceTab = typeof workspaceTabs[number][0];

type Thinker = {
  id: string;
  name: string;
  en: string;
  years: string;
  field: string;
  mark: string;
  portraitPosition: string;
  tone: string;
  color: string;
  insights: Record<Topic, string>;
  challenge: string;
  leaving: string;
};

const modes: Mode[] = [
  {
    id: "overthink",
    icon: "◎",
    title: "我又开始想太多了",
    short: "脑内预演很多，但现实信息很少。",
    loop: "Ni 过度模拟 → 等待确定 → 缺少反馈 → 继续模拟",
    action: "把最担心的判断写成一个可验证假设，今天只找一条现实证据。",
    function: "Ni → Se",
  },
  {
    id: "decision",
    icon: "↗",
    title: "我迟迟无法做决定",
    short: "不是信息不足，是想一次选到最优解。",
    loop: "寻找最优解 → 补充信息 → 新变量出现 → 再次比较",
    action: "接受 30% 的不确定。选一个可逆动作，先走 48 小时。",
    function: "Ni → Se",
  },
  {
    id: "approval",
    icon: "◌",
    title: "我太在意别人怎么看我",
    short: "外部评价正在进入你的自我评价系统。",
    loop: "Fe 捕捉反应 → 开始解释 → 寻求理解 → 自我消耗",
    action: "先问：这个人的评价是否有资格影响我的判断？理解不等于服从。",
    function: "Fe → Ti",
  },
  {
    id: "stuck",
    icon: "→",
    title: "我知道该做什么，但没行动",
    short: "理解已经足够，缺的是一次现实接触。",
    loop: "想清楚 → 继续优化 → 等状态 → 行动继续延后",
    action: "把动作缩小到 20 分钟能完成的版本。完成之后，只复盘一次。",
    function: "Ni → Se",
  },
  {
    id: "please",
    icon: "◇",
    title: "我又在讨好别人",
    short: "共情能力越界成了替别人负责。",
    loop: "感知需求 → 自动承担 → 压抑不满 → 关系消耗",
    action: "延迟回应。先判断：这是我的责任，还是我对冲突的回避？",
    function: "Fe → Ti",
  },
  {
    id: "perfect",
    icon: "△",
    title: "我陷入完美主义了",
    short: "你正在用首稿质量换取迭代速度。",
    loop: "高标准 → 不愿暴露半成品 → 推迟 → 标准继续升高",
    action: "今天只交付 70 分版本。把剩下 30 分留给真实反馈。",
    function: "Ni/Ti → Se",
  },
];

const crisisMode: Mode = {
  id: "crisis",
  icon: "●",
  title: "先让自己处于安全之中",
  short: "这不是需要继续分析的时刻。",
  loop: "痛苦超过独自承受的阈值 → 把情绪高峰误认为人生结论",
  action: "先离开可能伤害自己的物品或地点，联系一个真实可信的人陪你。如果已经有立即危险，请立刻联系当地紧急救援或身边的人。",
  function: "SAFETY FIRST",
};

const functions = [
  { key: "Ni", name: "内倾直觉", role: "主导 · Pattern", level: 92, healthy: "洞察模式，形成长期判断", overload: "过度预演，把推测当成事实", switchTo: "Se", color: "#8ee6b5" },
  { key: "Fe", name: "外倾情感", role: "辅助 · Relation", level: 78, healthy: "理解他人，建立关系感知", overload: "过度共情，为他人情绪负责", switchTo: "Ti", color: "#72c7c9" },
  { key: "Ti", name: "内倾思维", role: "第三 · Logic", level: 67, healthy: "独立判断，建立内部逻辑", overload: "无限分析，困在自洽闭环", switchTo: "Se", color: "#78a9d3" },
  { key: "Se", name: "外倾感觉", role: "劣势 · Reality", level: 38, healthy: "接触现实，用反馈校准判断", overload: "忽略身体与当下，现实断联", switchTo: "ACT", color: "#b8d9c5" },
];

const radarDimensions = [
  { key: "Ni", name: "洞察与预判", score: 90 },
  { key: "Fe", name: "共情与关系", score: 78 },
  { key: "Ti", name: "分析与逻辑", score: 65 },
  { key: "Se", name: "行动与当下", score: 38 },
  { key: "Ne", name: "发散与可能", score: 48 },
  { key: "Fi", name: "价值与感受", score: 60 },
  { key: "Te", name: "效率与执行", score: 42 },
  { key: "Si", name: "经验与稳定", score: 50 },
];

const experimentPlans: ExperimentPlan[] = [
  {
    id: "crisis",
    title: "先暂停分析：此刻最重要的是安全",
    route: "当问题触及伤害自己或结束生命，系统停止普通认知建议。此刻先让一个真实的人知道你的状态。",
    reading: "情绪高峰期的大脑不适合替整个人生下结论。先把接下来的十分钟安全度过。",
    trap: "把“我现在太痛了”误判成“我必须结束一切”。",
    hypothesis: "如果我离开危险环境并联系真人支持，危险强度可能会下降一点。",
    action: "远离可能伤害自己的物品或地点，给可信任的人发送：我现在有伤害自己的念头，需要你陪我。如果有立即危险，请联系当地紧急救援。",
    evidence: "只观察：是否有人回应、危险物品是否远离、自己是否从独处变成被看见。",
    update: "在安全感恢复前，不做人生决定，不继续追问意义。",
    keywords: /结束生命|自杀|轻生|不想活|不活了|去死|死了算了|伤害自己|自残|活不下去|结束一切|了结/,
  },
  {
    id: "career",
    title: "方向焦虑：别在脑内选人生，去现实里采样",
    route: "Ni 寻找长期趋势；Ti 想证明路线正确；Se 信息不足，所以越想越像悬崖。",
    reading: "你可能不是不够清楚，而是想在行动前获得过高确定性。现实更像连续实验：先获得样本，再调整判断。",
    trap: "把“未来会不会后悔”误当成今天必须解决的问题。",
    hypothesis: "如果这个方向适合我，一次真实接触后，我应该能发现至少一个能力迁移点或兴奋点。",
    action: "48 小时内只做一次现实采样：看 1 个岗位、问 1 个从业者，或做 1 个小原型。",
    evidence: "记录：已有能力能迁移什么、最大缺口是什么、接触后身体更有能量还是更消耗。",
    update: "出现两个以上正向证据，再进入下一轮七天实验；只有想象中的吸引力，就先降低投入。",
    keywords: /工作|职业|事业|求职|转行|行业|岗位|offer|公司|领导|离职|作品集|面试/,
  },
  {
    id: "overthink",
    title: "过度推演：把脑内结论降级成待验证假设",
    route: "Ni 已经生成了完整故事，但 Se 还没有提供足够现实样本。此刻最需要的不是再想一轮，而是降低结论置信度。",
    reading: "反复想通常不是因为你还差一个完美解释，而是大脑试图用推演换取安全感。继续推演只会让熟悉的故事显得更像事实。",
    trap: "把想得更久误认为想得更准。",
    hypothesis: "如果我最担心的判断是真的，现实里应该出现一条可以被观察或被询问的具体证据。",
    action: "写下最担心发生的事情，再做一次最小求证：问一个人、看一条原始信息，或完成一个 20 分钟小样本。",
    evidence: "只记录现实里真正出现的事实，以及它让原判断上升或下降了多少概率。",
    update: "没有新证据时，不把旧推演继续升级；有新证据时，只更新 10% 判断。",
    keywords: /想太多|反复想|预演|脑子停不下来|内耗|越想越|担心发生/,
  },
  {
    id: "relationship",
    title: "关系内耗：切断“替别人感受负责”的程序",
    route: "Fe 高速扫描对方反应；Ni 补完潜台词；Ti 又试图为整段关系找一个解释。",
    reading: "共情太快时，别人的情绪、评价和失望会提前进入你的身体。此时需要的不是更多理解，而是边界校准。",
    trap: "把“我理解他为什么这样”误认为“我需要配合他这样”。",
    hypothesis: "如果这段关系值得继续，它应该能承受一次清晰、温和、不自证的表达。",
    action: "说出一句边界句：我理解你的感受，但这件事我只能做到 X，做不到 Y。",
    evidence: "观察对方是否回应事实、是否尊重边界、是否把你的拒绝变成你的内疚。",
    update: "能讨论事实，关系可继续优化；只放大愧疚，下一轮实验就是减少投入。",
    keywords: /关系|朋友|同事|伴侣|家人|别人|对方|拒绝|讨好|误解|边界|人际|社交/,
  },
  {
    id: "decision",
    title: "选择困难：别追求最优解，设计可逆试错",
    route: "Ni 看见多条后果线；Ti 不断比较变量；Se 没有进入现场，每个选项都像未完成推演。",
    reading: "你可能想一次选到意义、长期和关系都正确的答案。但多数现实决定只是阶段性下注。",
    trap: "把可逆选择当成不可逆命运。",
    hypothesis: "如果 A 更适合我，做一个小版本 A 后，我会获得更多现实能量，而不只是脑内安慰。",
    action: "给 A 和 B 各设一个 30 分钟现实动作：发消息、投递、试做、预约或打开文件。",
    evidence: "比较行动后的反馈：阻力来自事实限制，还是害怕暴露、失败和被评价。",
    update: "选择证据更清晰的一边推进 72 小时，期间不允许重开比较表。",
    keywords: /选择|决定|要不要|是否|应该|哪个|纠结|犹豫|怎么办|路线|方案|比较/,
  },
  {
    id: "stuck",
    title: "行动冻结：先让 Se 接管 20 分钟",
    route: "Ni 已想出很多版本；Ti 仍在精修逻辑；Se 没被调用，所以身体没有进入开始状态。",
    reading: "这不一定是懒，而是大脑把开始包装成了必须准备到足够好。",
    trap: "用准备感替代行动感。",
    hypothesis: "如果这件事真的重要，20 分钟的低质量开始也会产生下一步线索。",
    action: "设置 20 分钟，只做最粗糙版本：打开文件、写 100 字、画第一屏或发一条询问。",
    evidence: "只记录行动后出现了什么：更清楚、发现缺口、得到反馈，还是发现它其实不重要。",
    update: "行动后更清楚就继续；更抗拒时，问题可能不是执行，而是目标并不属于你。",
    keywords: /拖延|行动|开始|做不动|卡住|没动力|执行|推进|动不了|准备|计划/,
  },
  {
    id: "selfworth",
    title: "自我怀疑：把羞耻感和事实证据拆开",
    route: "Fe 在想别人怎么看；Ti 审判自己是否足够好；Ni 把一次挫败推演成长期失败。",
    reading: "这类怀疑常带着道德审判：我是不是不够好、是不是不配、是不是会被看穿。",
    trap: "把情绪强度当作事实强度。",
    hypothesis: "如果这个判断是真的，它应该能找到具体事实；如果只能找到笼统羞耻，就不能指挥行动。",
    action: "写下三条事实证据和三条情绪解释。事实必须能被摄像机拍到。",
    evidence: "看哪一列更具体。事实不足时，不做自我定罪，只做一个补证据动作。",
    update: "把“我不行”改成“我在 X 场景缺 Y 证据或能力”，再设一个小训练。",
    keywords: /不配|不够好|失败|丢脸|羞耻|证明|认可|价值|评价|否定|怀疑自己/,
  },
];

const fallbackExperiment: ExperimentPlan = {
  id: "default",
  title: "抽象困惑：把它从脑内世界搬到现实世界",
  route: "Ni 正在形成整体判断，但现实样本不足。继续只在脑内推演，结论会越来越像真相。",
  reading: "抽象问题会自动吸附意义、关系、未来和自我价值。第一步不是解决，而是缩小。",
  trap: "把一个模糊问题升级成整个人生判断。",
  hypothesis: "把问题压成今天能验证的一句话：我想知道 X 是否成立，所以我要观察 Y。",
  action: "今天只做一个能得到现实反馈的小动作：问一个人、做一个粗糙版本、走到现场或发出请求。",
  evidence: "记录现实发生了什么，不记录二次脑补。区分事实、解释、身体感受和下一步线索。",
  update: "只根据新证据更新 10% 判断。不要一次性推翻或重建整个人生。",
  keywords: /./,
};

const thinkers: Thinker[] = [
  {
    id: "jung",
    name: "卡尔·荣格",
    en: "CARL JUNG",
    years: "1875—1961",
    field: "分析心理学",
    mark: "J",
    portraitPosition: "55% top",
    tone: "看见人格面具、阴影与整合",
    color: "#7fbfa0",
    insights: {
      career: "职业选择不只关乎外在路径，也暴露了你把哪一部分自己留在阴影里。真正值得观察的，是你反复被什么吸引，又为何不允许自己靠近。",
      relationship: "你对关系和谐的执着，也许正把真实的愤怒与需要推入阴影。未被承认的边界，最后往往会以疲惫或疏离回来。",
      action: "你想先获得完整自我，再开始行动；但个体化从不是脑内完成的。行动会让未知的自己显形。",
      selfworth: "你正在用人格面具接受审判，却把更完整的自己藏起来。一次失败触及的，也许是你不愿承认的脆弱。",
      meaning: "意义不一定从一个宏大答案里降临，它可能来自你愿意承担并整合的冲突。",
      default: "这个困惑也许不是来要求一个快速答案，而是在要求你承认一个长期被压下去的自己。",
    },
    challenge: "别急着问哪个选择更正确。先问：哪一个选择更接近你不再表演时的样子？",
    leaving: "如果无需维持任何人格形象，你今天会承认什么？",
  },
  {
    id: "frankl",
    name: "维克多·弗兰克尔",
    en: "VIKTOR FRANKL",
    years: "1905—1997",
    field: "意义治疗",
    mark: "F",
    portraitPosition: "50% top",
    tone: "把痛苦重新放回责任与意义",
    color: "#77b9c6",
    insights: {
      career: "你不必先知道哪条路能保证幸福。更实际的问题是：此刻的生活正在向你提出什么责任，而哪一步是你能回应的？",
      relationship: "你无法决定别人如何看待你的边界，但仍能决定自己以什么态度保护尊严。拒绝并不取消关心。",
      action: "意义不是等待状态完美后才出现，它常常在你对一个具体任务作出回应时被发现。",
      selfworth: "人的价值不能被一次表现或一段评价耗尽。你仍保有选择如何回应处境的自由。",
      meaning: "别只问人生能给你什么，也问此刻的人生正在等待你完成什么。",
      default: "即便环境尚未改变，你仍拥有一小块不可替代的自由：选择下一步如何回应。",
    },
    challenge: "不要把自由理解成没有限制。自由是在限制之中仍然承担一个选择。",
    leaving: "今天有什么微小责任，是只有你能替自己完成的？",
  },
  {
    id: "hesse",
    name: "赫尔曼·黑塞",
    en: "HERMANN HESSE",
    years: "1877—1962",
    field: "文学与精神成长",
    mark: "H",
    portraitPosition: "55% top",
    tone: "听见个体生命自己的声音",
    color: "#a2b984",
    insights: {
      career: "别人认可的道路可能整齐，却未必属于你的生命。你真正害怕的，也许不是选错，而是离开熟悉的评价体系。",
      relationship: "爱并不要求你把自己消失在另一个人的需要里。两个完整的人，才能真正相遇。",
      action: "道路不会在脚步之前完整出现。你需要的不是更多地图，而是一次诚实的出发。",
      selfworth: "不要急着成为别人容易理解的形状。你正在经历的分裂，也许是旧身份松动的声音。",
      meaning: "每个人都必须找到通往自己的路；它无法由多数人的掌声代替。",
      default: "当外界声音变小，你可能已经知道自己真正想靠近什么，只是还不敢为它负责。",
    },
    challenge: "如果一条路能让所有人放心，却让你越来越不像自己，它还值得被称为安全么？",
    leaving: "哪一个愿望，你总要等到获得许可才肯承认？",
  },
  {
    id: "dostoevsky",
    name: "陀思妥耶夫斯基",
    en: "FYODOR DOSTOEVSKY",
    years: "1821—1881",
    field: "文学与人性",
    mark: "D",
    portraitPosition: "50% top",
    tone: "直面矛盾、自由与自我欺骗",
    color: "#b08c76",
    insights: {
      career: "人有时宁愿承受熟悉的不满，也不愿面对自由带来的责任。你说自己没有选择，也许是在躲避选择之后必须成为的那个人。",
      relationship: "你可能把牺牲包装成善良，又暗中等待别人看见代价。没有说出口的怨恨，会让爱变得不诚实。",
      action: "思想可以给拖延披上高贵外衣。真正困难的不是想通，而是允许自己笨拙地承担后果。",
      selfworth: "你对自己的审判也许比任何外界评价都残酷。可人不是一道只能得到有罪或无罪的判决。",
      meaning: "痛苦不会自动变得崇高。只有当你不再用它逃避真实选择，它才可能被转化。",
      default: "你或许同时渴望自由，又渴望有人替你免除自由的代价。先承认这个矛盾。",
    },
    challenge: "你现在坚持的痛苦里，有多少是真实限制，又有多少是为了避免承担改变的风险？",
    leaving: "如果不能再用痛苦证明自己，你会怎样生活？",
  },
  {
    id: "kierkegaard",
    name: "索伦·克尔凯郭尔",
    en: "SØREN KIERKEGAARD",
    years: "1813—1855",
    field: "存在哲学",
    mark: "K",
    portraitPosition: "50% top",
    tone: "在焦虑中作出属于自己的选择",
    color: "#8fa5cc",
    insights: {
      career: "焦虑不是选错的证据，而是可能性向你打开时产生的眩晕。没有任何分析能替你完成成为自己的那一跃。",
      relationship: "当你只活在别人的目光里，选择就会变成表演。边界要求你以单独的个体站立片刻。",
      action: "你希望先消除焦虑再行动，但焦虑常常只能在承担行动之后改变形态。",
      selfworth: "绝望有时来自不愿成为自己，也有时来自执意成为一个想象中的自己。两者都需要诚实。",
      meaning: "真理不只是你理解了什么，也在于你愿意用生命承担什么。",
      default: "可能性让人眩晕。你不需要消灭眩晕，只需要在其中选择一小步。",
    },
    challenge: "等待绝对确定，就是把选择权交给时间。时间也会替你选择，但那未必是你的选择。",
    leaving: "哪一步会让你焦虑，却也更像你自己？",
  },
  {
    id: "camus",
    name: "阿尔贝·加缪",
    en: "ALBERT CAMUS",
    years: "1913—1960",
    field: "荒诞与反抗",
    mark: "C",
    portraitPosition: "50% top",
    tone: "不等待世界保证，仍选择清醒行动",
    color: "#d0a06c",
    insights: {
      career: "世界不会提前保证这条路值得。你能做的是拒绝用虚假的确定安慰自己，同时认真完成今天的工作。",
      relationship: "清醒不等于冷漠。你可以关心对方，又拒绝一段要求你背叛自己的关系规则。",
      action: "不必等意义先抵达。把今天的石头推上去，动作本身就是对麻木的反抗。",
      selfworth: "世界的沉默并不是对你价值的判决。不要把没有回应误写成你不存在。",
      meaning: "荒诞来自人渴望答案，而世界保持沉默。成熟不是编造答案，而是在沉默中继续清醒地活。",
      default: "不要向一个没有保证的世界索要保证。先完成那个你仍愿意承担的小动作。",
    },
    challenge: "你是否把“还没有意义”当成了“不必行动”的许可？",
    leaving: "即使没有保证，你仍愿意认真完成什么？",
  },
];

function detectTopic(text: string): Topic {
  if (/工作|职业|转行|公司|岗位|事业|方向|离职/.test(text)) return "career";
  if (/关系|朋友|同事|伴侣|家人|拒绝|讨好|边界|误解/.test(text)) return "relationship";
  if (/拖延|行动|开始|执行|卡住|推进|做不动/.test(text)) return "action";
  if (/不配|不够好|失败|羞耻|价值|评价|否定|怀疑/.test(text)) return "selfworth";
  if (/意义|人生|活着|孤独|存在|为什么/.test(text)) return "meaning";
  return "default";
}

function buildExperiment(question: string) {
  return experimentPlans.find((plan) => plan.keywords.test(question.trim())) ?? fallbackExperiment;
}

function diagnoseIssue(text: string) {
  if (crisisMode.function && /结束生命|自杀|轻生|不想活|自残|伤害自己|活不下去|结束一切/.test(text)) return crisisMode;
  if (/关系|朋友|同事|伴侣|家人|拒绝|讨好|边界|误解/.test(text)) return modes[4];
  if (/完美|质量|首稿|丢脸|不够好|标准/.test(text)) return modes[5];
  if (/拖延|行动|开始|执行|卡住|推进|做不动/.test(text)) return modes[3];
  if (/选择|决定|要不要|是否|应该|哪个|纠结|犹豫/.test(text)) return modes[1];
  if (/评价|认可|怎么看|在意|喜欢我|讨厌我/.test(text)) return modes[2];
  return modes[0];
}

function RadarChart() {
  const center = 210;
  const radius = 145;
  const point = (index: number, ratio: number) => {
    const angle = -Math.PI / 2 + index * (Math.PI / 4);
    return [center + Math.cos(angle) * radius * ratio, center + Math.sin(angle) * radius * ratio];
  };
  const polygon = (ratio: number) => radarDimensions.map((_, index) => point(index, ratio).join(",")).join(" ");
  const dataPolygon = radarDimensions.map((item, index) => point(index, item.score / 100).join(",")).join(" ");

  return (
    <div className="radar-wrap">
      <svg className="radar-chart" viewBox="0 0 420 420" role="img" aria-label="典型 INFJ 八维认知功能雷达示意图">
        {[1, 0.75, 0.5, 0.25].map((ratio) => <polygon key={ratio} points={polygon(ratio)} className="radar-grid" />)}
        {radarDimensions.map((_, index) => {
          const [x, y] = point(index, 1);
          return <line key={index} x1={center} y1={center} x2={x} y2={y} className="radar-axis" />;
        })}
        <polygon points={dataPolygon} className="radar-data" />
        {radarDimensions.map((item, index) => {
          const [x, y] = point(index, item.score / 100);
          return <circle key={item.key} cx={x} cy={y} r="4" className="radar-dot" />;
        })}
        {radarDimensions.map((item, index) => {
          const [x, y] = point(index, 1.17);
          return (
            <g key={item.key} transform={"translate(" + x + "," + y + ")"}>
              <text className="radar-label-key" textAnchor="middle" y="-2">{item.key}</text>
              <text className="radar-label-name" textAnchor="middle" y="13">{item.name}</text>
            </g>
          );
        })}
      </svg>
      <div className="radar-center"><b>INFJ</b><span>FUNCTIONS</span></div>
    </div>
  );
}

function SectionHeading({ number, eyebrow, title, copy }: { number: string; eyebrow: string; title: string; copy: string }) {
  return (
    <div className="section-heading">
      <div className="section-kicker"><span>{number}</span>{eyebrow}</div>
      <div className="section-heading-row">
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<WorkspaceTab>("now");
  const [selected, setSelected] = useState<string | null>(null);
  const [customIssue, setCustomIssue] = useState("");
  const [customDiagnosisId, setCustomDiagnosisId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [experimentId, setExperimentId] = useState<string | null>(null);
  const [prediction, setPrediction] = useState("");
  const [probability, setProbability] = useState(70);
  const [actualResult, setActualResult] = useState("");
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntry[]>([]);
  const [relation, setRelation] = useState("同事");
  const [boundaryRequest, setBoundaryRequest] = useState("");
  const [boundaryFear, setBoundaryFear] = useState("");
  const [boundaryGenerated, setBoundaryGenerated] = useState(false);
  const [boundaryPressure, setBoundaryPressure] = useState(false);
  const [selectedBoundary, setSelectedBoundary] = useState("");
  const [selectedThinkers, setSelectedThinkers] = useState<string[]>(["jung", "frankl", "camus"]);
  const [salonQuestion, setSalonQuestion] = useState("");
  const [salonStarted, setSalonStarted] = useState(false);
  const [salonView, setSalonView] = useState<"guests" | "conversation">("guests");
  const [reportMode, setReportMode] = useState<"private" | "share">("private");
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [todayShort, setTodayShort] = useState("--.--");
  const [hydrated, setHydrated] = useState(false);
  const diagnosisRef = useRef<HTMLDivElement | null>(null);

  const current = useMemo(() => modes.find((mode) => mode.id === selected) ?? null, [selected]);
  const customDiagnosis = useMemo(() => {
    if (!customDiagnosisId) return null;
    if (customDiagnosisId === "crisis") return crisisMode;
    return modes.find((mode) => mode.id === customDiagnosisId) ?? null;
  }, [customDiagnosisId]);
  const currentDiagnosis = customDiagnosis ?? current;
  const currentExperiment = useMemo(() => {
    if (!experimentId) return null;
    if (experimentId === "default") return fallbackExperiment;
    return experimentPlans.find((plan) => plan.id === experimentId) ?? null;
  }, [experimentId]);
  const salonTopic = useMemo(() => detectTopic(salonQuestion), [salonQuestion]);
  const salonGuests = useMemo(() => thinkers.filter((thinker) => selectedThinkers.includes(thinker.id)), [selectedThinkers]);
  const salonResponses = useMemo(() => salonStarted ? salonGuests.map((thinker) => ({
    thinker,
    insight: thinker.insights[salonTopic],
    challenge: thinker.challenge,
    leaving: thinker.leaving,
  })) : [], [salonGuests, salonStarted, salonTopic]);

  const boundarySubject = boundaryRequest.trim()
    ? "关于「" + boundaryRequest.trim().slice(0, 34) + (boundaryRequest.trim().length > 34 ? "…" : "") + "」"
    : "这件事";
  const boundaryDrafts = [
    {
      label: "温和但明确",
      tag: "保留关系",
      text: "我理解这件事对你很重要。不过，" + boundarySubject + "，我这次没办法答应。希望你能另外安排。",
    },
    {
      label: "简短不解释",
      tag: "停止自证",
      text: boundarySubject + "我无法承担，这次请你找其他方案。",
    },
    {
      label: "结束反复施压",
      tag: "关闭讨论",
      text: "我已经说明了我的决定。" + boundarySubject + "我不会再继续讨论。",
    },
  ];

  useEffect(() => {
    setTodayShort(new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Shanghai",
    }).format(new Date()));
    try {
      const raw = window.localStorage.getItem("mokafee-cognitive-session-v2");
      if (raw) {
        const saved = JSON.parse(raw);
        setSelected(saved.selected ?? null);
        setCustomIssue(saved.customIssue ?? "");
        setCustomDiagnosisId(saved.customDiagnosisId ?? null);
        setQuestion(saved.question ?? "");
        setExperimentId(saved.experimentId ?? null);
        setPrediction(saved.prediction ?? "");
        setProbability(saved.probability ?? 70);
        setActualResult(saved.actualResult ?? "");
        setEvidenceEntries(Array.isArray(saved.evidenceEntries) ? saved.evidenceEntries : []);
        setRelation(saved.relation ?? "同事");
        setBoundaryRequest(saved.boundaryRequest ?? "");
        setBoundaryFear(saved.boundaryFear ?? "");
        setBoundaryGenerated(Boolean(saved.boundaryGenerated));
        setSelectedBoundary(saved.selectedBoundary ?? "");
        setSelectedThinkers(Array.isArray(saved.selectedThinkers) ? saved.selectedThinkers : ["jung", "frankl", "camus"]);
        setSalonQuestion(saved.salonQuestion ?? "");
        setSalonStarted(Boolean(saved.salonStarted));
      }
    } catch {
      // A damaged local snapshot should never block the experience.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("mokafee-cognitive-session-v2", JSON.stringify({
      selected,
      customIssue,
      customDiagnosisId,
      question,
      experimentId,
      prediction,
      probability,
      actualResult,
      evidenceEntries,
      relation,
      boundaryRequest,
      boundaryFear,
      boundaryGenerated,
      selectedBoundary,
      selectedThinkers,
      salonQuestion,
      salonStarted,
    }));
  }, [
    hydrated, selected, customIssue, customDiagnosisId, question, experimentId, prediction,
    probability, actualResult, evidenceEntries, relation, boundaryRequest, boundaryFear,
    boundaryGenerated, selectedBoundary, selectedThinkers, salonQuestion, salonStarted,
  ]);

  useEffect(() => {
    const syncTab = () => {
      const id = window.location.hash.slice(1);
      setActiveSection(workspaceTabs.some(([tab]) => tab === id) ? id as WorkspaceTab : "now");
    };
    syncTab();
    window.addEventListener("hashchange", syncTab);
    window.addEventListener("popstate", syncTab);
    return () => {
      window.removeEventListener("hashchange", syncTab);
      window.removeEventListener("popstate", syncTab);
    };
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [activeSection]);

  const jumpTo = (id: string) => {
    const next = id === "top" ? "now" : id;
    if (!workspaceTabs.some(([tab]) => tab === next)) return;
    setActiveSection(next as WorkspaceTab);
    if (window.location.hash !== `#${next}`) window.history.pushState(null, "", `#${next}`);
  };

  const revealDiagnosis = () => {
    window.requestAnimationFrame(() => {
      diagnosisRef.current?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width: 1023px), (max-height: 649px)").matches) {
        diagnosisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };

  const selectMode = (id: string) => {
    setSelected(id);
    setCustomDiagnosisId(null);
    revealDiagnosis();
  };

  const diagnoseCustomIssue = () => {
    const mode = diagnoseIssue(customIssue);
    setSelected(null);
    setCustomDiagnosisId(mode.id);
    revealDiagnosis();
  };

  const sendDiagnosisToLab = () => {
    const source = customIssue.trim() || currentDiagnosis?.title || "";
    setQuestion(source);
    setExperimentId(null);
    jumpTo("lab");
  };

  const generateExperiment = () => {
    const plan = buildExperiment(question);
    setExperimentId(plan.id);
  };

  const saveEvidence = () => {
    if (!actualResult.trim() || !currentExperiment) return;
    const entry: EvidenceEntry = {
      id: String(Date.now()),
      question: question.trim(),
      prediction: prediction.trim() || "没有记录具体预测",
      probability,
      action: currentExperiment.action,
      result: actualResult.trim(),
      createdAt: new Date().toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }),
    };
    setEvidenceEntries((entries) => [entry, ...entries].slice(0, 20));
    setActualResult("");
  };

  const deleteEvidence = (id: string) => {
    setEvidenceEntries((entries) => entries.filter((entry) => entry.id !== id));
  };

  const generateBoundary = () => {
    setBoundaryGenerated(true);
    setBoundaryPressure(false);
    setSelectedBoundary("");
  };

  const toggleThinker = (id: string) => {
    setSalonStarted(false);
    setSelectedThinkers((currentIds) => {
      if (currentIds.includes(id)) return currentIds.filter((item) => item !== id);
      if (currentIds.length >= 3) return currentIds;
      return [...currentIds, id];
    });
  };

  const autoAssemble = () => {
    const topic = detectTopic(salonQuestion);
    const sets: Record<Topic, string[]> = {
      career: ["hesse", "frankl", "jung"],
      relationship: ["jung", "kierkegaard", "hesse"],
      action: ["kierkegaard", "camus", "dostoevsky"],
      selfworth: ["jung", "frankl", "dostoevsky"],
      meaning: ["frankl", "camus", "dostoevsky"],
      default: ["jung", "frankl", "camus"],
    };
    setSelectedThinkers(sets[topic]);
    setSalonStarted(false);
  };

  const sendSalonToLab = () => {
    if (!salonQuestion.trim()) return;
    setQuestion(salonQuestion.trim());
    setExperimentId(null);
    jumpTo("lab");
  };

  const generateReport = async () => {
    await document.fonts.ready;
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const background = ctx.createLinearGradient(0, 0, 1080, 1920);
    background.addColorStop(0, "#071013");
    background.addColorStop(0.48, "#0a1519");
    background.addColorStop(1, "#04090b");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 1080, 1920);

    const glow = (x: number, y: number, radius: number, color: string) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    };
    glow(180, 190, 460, "rgba(47,139,103,.28)");
    glow(930, 540, 520, "rgba(43,113,145,.24)");
    glow(180, 1470, 600, "rgba(89,57,125,.17)");
    glow(900, 1750, 520, "rgba(181,112,74,.13)");

    let seed = Number(new Date().toISOString().slice(0, 10).replaceAll("-", ""));
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    ctx.fillStyle = "rgba(255,255,255,.09)";
    for (let i = 0; i < 8500; i += 1) {
      const size = random() > 0.94 ? 1.5 : 0.7;
      ctx.globalAlpha = 0.05 + random() * 0.11;
      ctx.fillRect(random() * 1080, random() * 1920, size, size);
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(142,230,181,.14)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 7; i += 1) {
      ctx.beginPath();
      ctx.ellipse(540, 720, 250 + i * 58, 105 + i * 26, -0.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    const roundRect = (x: number, y: number, w: number, h: number, radius: number) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
    };
    const card = (x: number, y: number, w: number, h: number, tint: string) => {
      roundRect(x, y, w, h, 30);
      ctx.fillStyle = "rgba(7,18,22,.78)";
      ctx.fill();
      ctx.strokeStyle = tint;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };
    const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 4) => {
      const chars = Array.from(text || "—");
      let line = "";
      let lines = 0;
      for (let i = 0; i < chars.length; i += 1) {
        const testLine = line + chars[i];
        if (ctx.measureText(testLine).width > maxWidth && line) {
          ctx.fillText(line, x, y + lines * lineHeight);
          line = chars[i];
          lines += 1;
          if (lines >= maxLines - 1) {
            const rest = line + chars.slice(i + 1).join("");
            let finalLine = rest;
            while (ctx.measureText(finalLine + "…").width > maxWidth && finalLine.length > 1) finalLine = finalLine.slice(0, -1);
            ctx.fillText(finalLine + (finalLine.length < rest.length ? "…" : ""), x, y + lines * lineHeight);
            return;
          }
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, y + lines * lineHeight);
    };

    const now = new Date();
    const dateLabel = now.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
    ctx.fillStyle = "#8ee6b5";
    ctx.font = "600 24px ui-monospace, monospace";
    ctx.letterSpacing = "4px";
    ctx.fillText("MOKAFEE · COGNITIVE TRACE", 72, 92);
    ctx.letterSpacing = "0px";
    ctx.fillStyle = "#f2f8f4";
    ctx.font = "500 74px Songti SC, serif";
    ctx.fillText("今日心智切片", 68, 205);
    ctx.fillStyle = "#91a69d";
    ctx.font = "400 28px PingFang SC, sans-serif";
    ctx.fillText(dateLabel + " · " + (reportMode === "private" ? "私人珍藏版" : "安全分享版"), 72, 260);

    const keyword = currentDiagnosis?.id === "please" ? "边界" : currentDiagnosis?.id === "stuck" ? "开始" : currentDiagnosis?.id === "decision" ? "选择" : currentDiagnosis?.id === "crisis" ? "安全" : currentDiagnosis ? "校准" : "观察";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(234,247,239,.93)";
    ctx.font = "500 128px Songti SC, serif";
    ctx.fillText(keyword, 540, 430);
    ctx.fillStyle = "#8ea49a";
    ctx.font = "400 25px PingFang SC, sans-serif";
    ctx.fillText("今天不是为了定义自己，而是看见自己如何运行。", 540, 486);
    ctx.textAlign = "left";

    card(58, 548, 964, 255, "rgba(142,230,181,.28)");
    ctx.fillStyle = "#8ee6b5";
    ctx.font = "600 22px ui-monospace, monospace";
    ctx.fillText("01 / CURRENT LOOP", 90, 598);
    ctx.fillStyle = "#f0f6f2";
    ctx.font = "500 34px PingFang SC, sans-serif";
    ctx.fillText(currentDiagnosis?.title ?? "今天还没有完成状态扫描", 90, 657);
    ctx.fillStyle = "#a8bbb1";
    ctx.font = "400 27px PingFang SC, sans-serif";
    wrapText(currentDiagnosis?.loop ?? "留一点空间，先观察此刻最占据注意力的事情。", 90, 708, 890, 42, 2);

    card(58, 833, 964, 245, "rgba(113,201,216,.26)");
    ctx.fillStyle = "#71c9d8";
    ctx.font = "600 22px ui-monospace, monospace";
    ctx.fillText("02 / BOUNDARY", 90, 884);
    ctx.fillStyle = "#eff7f3";
    ctx.font = "500 31px PingFang SC, sans-serif";
    wrapText(selectedBoundary || "今天还没有保存边界表达。你可以先允许自己不立刻回应。", 90, 940, 890, 45, 3);
    if (reportMode === "private" && boundaryFear.trim()) {
      ctx.fillStyle = "#7f958a";
      ctx.font = "400 23px PingFang SC, sans-serif";
      wrapText("我担心：" + boundaryFear.trim(), 90, 1032, 880, 34, 1);
    }

    card(58, 1108, 964, 365, "rgba(143,165,204,.24)");
    ctx.fillStyle = "#9caed2";
    ctx.font = "600 22px ui-monospace, monospace";
    ctx.fillText("03 / DEEP SALON", 90, 1159);
    ctx.fillStyle = "#f0f6f2";
    ctx.font = "500 30px PingFang SC, sans-serif";
    const salonTitle = salonResponses.length ? salonResponses.map((item) => item.thinker.name).join(" × ") : "会客厅还没有开始";
    ctx.fillText(salonTitle, 90, 1212);
    ctx.font = "400 24px PingFang SC, sans-serif";
    salonResponses.slice(0, 3).forEach((response, index) => {
      ctx.fillStyle = response.thinker.color;
      ctx.fillText(response.thinker.mark, 92, 1270 + index * 65);
      ctx.fillStyle = "#afc0b7";
      wrapText(response.insight, 132, 1270 + index * 65, 835, 34, 1);
    });
    if (!salonResponses.length) {
      ctx.fillStyle = "#879b91";
      wrapText("当一个答案太响，邀请不同思想者从别的方向照亮它。", 90, 1272, 860, 40, 2);
    }

    card(58, 1503, 964, 275, "rgba(208,160,108,.22)");
    ctx.fillStyle = "#d0a06c";
    ctx.font = "600 22px ui-monospace, monospace";
    ctx.fillText("04 / REALITY UPDATE", 90, 1554);
    ctx.fillStyle = "#f0f6f2";
    ctx.font = "500 31px PingFang SC, sans-serif";
    const reportAction = currentExperiment?.action ?? currentDiagnosis?.action ?? "选择一个 20 分钟内能完成的小动作。";
    wrapText(reportAction, 90, 1611, 890, 45, 3);
    ctx.fillStyle = "#8fa299";
    ctx.font = "400 23px PingFang SC, sans-serif";
    const realityLine = evidenceEntries.length
      ? "证据森林已有 " + evidenceEntries.length + " 条真实记录。"
      : "今天还没有记录现实反馈。完成行动后，再回来更新判断。";
    ctx.fillText(realityLine, 90, 1735);

    ctx.fillStyle = "#8ee6b5";
    ctx.font = "600 22px ui-monospace, monospace";
    ctx.fillText("SYSTEM UPDATE", 72, 1842);
    ctx.fillStyle = "#dce9e1";
    ctx.font = "400 27px PingFang SC, sans-serif";
    const versionLine = evidenceEntries.length
      ? "V0." + Math.min(9, evidenceEntries.length + 1) + "：开始让现实证据参与自我判断。"
      : "V0.1：允许自己暂时不知道答案。";
    ctx.fillText(versionLine, 280, 1842);
    ctx.fillStyle = "#647a70";
    ctx.font = "400 20px PingFang SC, sans-serif";
    ctx.fillText("基于当天在 mokafee.com 的本地交互生成 · 内容仅供自我观察", 72, 1886);

    setReportUrl(canvas.toDataURL("image/png", 1));
  };

  const downloadReport = () => {
    if (!reportUrl) return;
    const link = document.createElement("a");
    link.href = reportUrl;
    link.download = "mokafee-今日心智切片-" + new Date().toISOString().slice(0, 10) + ".png";
    link.click();
  };

  return (
    <main className="workspace-shell">
      <CustomCursor />
      <div className="global-noise" aria-hidden="true" />
      <div className="ambient ambient-a" aria-hidden="true" />
      <div className="ambient ambient-b" aria-hidden="true" />

      <header className="topbar">
        <button className="brand" type="button" onClick={() => jumpTo("top")} aria-label="返回首页">
          <span className="brand-mark">N</span>
          <span className="brand-copy"><b>COGNITIVE OS</b><small>FOR INFJ MINDS</small></span>
        </button>
        <nav className="topnav" role="tablist" aria-label="主导航">
          {workspaceTabs.map(([id, label], index) => (
            <button key={id} id={`tab-${id}`} role="tab" aria-selected={activeSection === id} aria-controls={id} tabIndex={activeSection === id ? 0 : -1} type="button" className={activeSection === id ? "active" : ""} onClick={() => jumpTo(id)} onKeyDown={(event) => {
              const offset = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
              if (!offset && event.key !== "Home" && event.key !== "End") return;
              event.preventDefault();
              const target = event.key === "Home" ? 0 : event.key === "End" ? workspaceTabs.length - 1 : (index + offset + workspaceTabs.length) % workspaceTabs.length;
              const next = workspaceTabs[target][0];
              jumpTo(next);
              document.getElementById(`tab-${next}`)?.focus();
            }}>{label}</button>
          ))}
        </nav>
        <button className="header-report" type="button" onClick={() => jumpTo("archive")}>
          <span>生成今日切片</span><i>↗</i>
        </button>
      </header>

      <div className="workspace-panels">
      <section className="workspace-panel content-section now-section" id="now" role="tabpanel" aria-labelledby="tab-now" hidden={activeSection !== "now"} tabIndex={0}>
        <div className="workspace-welcome">
          <div><span className="mini-label">CURRENT STATE / 此刻的你</span><h1>别急着想明白。<em>先看看，你现在怎么运行。</em></h1><p>选一个接近你的状态，或写下此刻的困扰。</p></div>
          <img src="/green-sage-reference.webp" alt="绿老头，温和的观察者" width={88} height={100} />
        </div>
        <div className="now-layout">
        <div className="now-inputs">
        <div className="mode-grid">
          {modes.map((mode) => (
            <button
              key={mode.id}
              className={"mode-card glass-card " + (selected === mode.id ? "selected" : "")}
              onClick={() => selectMode(mode.id)}
              aria-pressed={selected === mode.id}
            >
              <span className="mode-icon">{mode.icon}</span>
              <span className="mode-content"><b>{mode.title}</b><small>{mode.short}</small></span>
              <span className="mode-arrow">↗</span>
            </button>
          ))}
        </div>
        <div className="custom-diagnosis glass-card">
          <div>
            <h3>选项都不像你？</h3>
          </div>
          <div className="input-action">
            <textarea
              value={customIssue}
              onChange={(event) => { setCustomIssue(event.target.value); setCustomDiagnosisId(null); }}
              placeholder="例如：我已经答应了同事，但其实很不想继续帮忙，又担心拒绝以后关系变差……"
              aria-label="描述当前困扰"
            />
            <button type="button" disabled={!customIssue.trim()} onClick={diagnoseCustomIssue}>识别当前回路 <span>↗</span></button>
          </div>
        </div>
        </div>
        {currentDiagnosis ? (
          <div className={"diagnosis-panel glass-card " + (currentDiagnosis.id === "crisis" ? "crisis-panel" : "")} ref={diagnosisRef} role="status" tabIndex={-1}>
            <div className="diagnosis-top"><span className="live-dot" /> CURRENT LOOP · {currentDiagnosis.function}</div>
            {customIssue.trim() && customDiagnosis && <blockquote>“{customIssue.trim()}”</blockquote>}
            <div className="diagnosis-grid">
              <div><small>正在发生的回路</small><p>{currentDiagnosis.loop}</p></div>
              <div><small>{currentDiagnosis.id === "crisis" ? "现在优先做" : "先别解决整个人生，只做"}</small><p>{currentDiagnosis.action}</p></div>
            </div>
            {currentDiagnosis.id !== "crisis" && (
              <button type="button" className="inline-cta" onClick={sendDiagnosisToLab}>把它变成现实实验 <span>→</span></button>
            )}
            <p className="diagnosis-disclaimer">这是认知功能框架下的自我观察，不是心理或医学诊断。</p>
          </div>
        ) : (
          <div className="diagnosis-empty glass-card"><span className="mini-label">YOUR CURRENT LOOP</span><h2>从一个真实感受开始。</h2><p>不必先整理好思绪。选一个状态后，这里会呈现正在发生的回路，以及你现在能做的一小步。</p><div className="empty-path"><span>看见回路</span><span>找到切口</span><span>接触现实</span></div></div>
        )}
        </div>
      </section>

      <section className="workspace-panel content-section map-section" id="map" role="tabpanel" aria-labelledby="tab-map" hidden={activeSection !== "map"} tabIndex={0}>
        <SectionHeading
          number="02"
          eyebrow="COGNITIVE MAP"
          title="看见你的认知运行地图"
          copy="数值不是能力高低，而是大脑更习惯从哪里处理世界。"
        />
        <div className="function-layout glass-card">
          <div className="radar-panel">
            <div className="panel-label">8 FUNCTIONS / OVERVIEW</div>
            <h3>典型 INFJ 的八维倾向</h3>
            <p>真正重要的不是哪一维最高，而是过载时能否主动切换。</p>
            <RadarChart />
            <div className="radar-summary">
              <div><small>CORE STRENGTH</small><b>Ni · 洞察模式</b><span>从复杂信息里找到方向</span></div>
              <div><small>GROWTH EDGE</small><b>Se · 回到现实</b><span>用行动反馈校准预判</span></div>
            </div>
          </div>
          <div className="function-list">
            {functions.map((fn) => (
              <article className="function-row" key={fn.key}>
                <div className="fn-key" style={{ borderColor: fn.color }}><b>{fn.key}</b><span>{fn.name}</span><small>{fn.role}</small></div>
                <div className="fn-body">
                  <div className="fn-meter"><span style={{ width: fn.level + "%", background: fn.color }} /></div>
                  <div className="fn-states">
                    <p><small>NORMAL</small>{fn.healthy}</p>
                    <p><small>OVERLOAD</small>{fn.overload}</p>
                  </div>
                </div>
                <div className="fn-switch"><small>SWITCH</small><b>→ {fn.switchTo}</b></div>
              </article>
            ))}
            <p className="map-note">示意值仅用于理解典型倾向，不构成心理测量结果。</p>
          </div>
        </div>
        <details className="workspace-details map-loops"><summary>三个需要警惕的回路 <span>查看误区与转向</span></summary>
        <div className="loop-grid">
          {[
            ["预演替代行动", "Ni 预演 → 等待确定 → 没有反馈 → 继续预演", "切换到 Se", "做一个 70 分版本，接触一次真实反馈。"],
            ["理解变成自证", "Fe 感知 → 担心误解 → 反复解释 → 自我消耗", "切换到 Ti", "允许别人暂时误解，让结果承担解释工作。"],
            ["表达变成表演", "真实表达 → 数据评分 → 刷新反馈 → 为流量改观点", "回到主权", "让数据优化表达，但不让数据生产观点。"],
          ].map((loop, index) => (
            <article className="loop-card glass-card" key={loop[0]}>
              <div className="loop-warning">
                <span>!</span>
                <div><small>WARNING {String(index + 1).padStart(2, "0")} · 警惕误区</small><h4>{loop[0]}</h4><p>{loop[1]}</p></div>
              </div>
              <div className="loop-turn">
                <span>✓</span>
                <div><small>{loop[2]} · 正确转向</small><p>{loop[3]}</p></div>
              </div>
            </article>
          ))}
        </div>
        </details>
      </section>

      <section className="workspace-panel full-section lab-section" id="lab" role="tabpanel" aria-labelledby="tab-lab" hidden={activeSection !== "lab"} tabIndex={0}>
        <div className="lab-light" aria-hidden="true" />
        <div className="lab-inner">
          <SectionHeading
            number="04"
            eyebrow="REALITY LAB"
            title="别再多想一轮。做一个现实实验。"
            copy="把抽象困惑变成假设、最小行动、现实证据和更新判断。"
          />
          <div className="lab-layout">
            <div className="lab-console glass-card">
              <div className="console-top"><span>NEW EXPERIMENT</span><i><b /> READY</i></div>
              <label htmlFor="lab-question">什么问题已经在你脑子里循环很久？</label>
              <textarea
                id="lab-question"
                value={question}
                onChange={(event) => { setQuestion(event.target.value); setExperimentId(null); }}
                placeholder="例如：我总在纠结一个选择，越想越像人生分叉，却迟迟不敢往前走一步。"
              />
              <button className="primary-button" disabled={!question.trim()} onClick={generateExperiment}>
                {currentExperiment ? "重新生成实验" : "把它变成现实实验"} <span>↗</span>
              </button>
              {currentExperiment && currentExperiment.id !== "crisis" ? (
                <div className="prediction-panel">
                  <div className="prediction-title"><div><small>PREDICTION → REALITY</small><h4>预测—现实偏差镜</h4></div><span>{probability}%</span></div>
                  <label htmlFor="prediction">行动前，你最担心发生什么？</label>
                  <textarea id="prediction" value={prediction} onChange={(event) => setPrediction(event.target.value)} placeholder="写下你的预测，之后用事实核对。" />
                  <label htmlFor="probability">你觉得它发生的概率</label>
                  <input id="probability" type="range" min="10" max="100" step="10" value={probability} onChange={(event) => setProbability(Number(event.target.value))} />
                  <label htmlFor="actual-result">完成行动后，现实真正发生了什么？</label>
                  <textarea id="actual-result" value={actualResult} onChange={(event) => setActualResult(event.target.value)} placeholder="回来记录事实，不记录二次脑补。" />
                  <button className="secondary-button" type="button" disabled={!actualResult.trim()} onClick={saveEvidence}>把结果种进证据森林 <span>＋</span></button>
                </div>
              ) : currentExperiment?.id !== "crisis" ? <p className="lab-guidance">允许不确定，再开始。现实不是思考的敌人，它是思考的数据源。</p> : null}
            </div>
            <div className="lab-output glass-card" aria-live="polite">
              {currentExperiment ? (
                <div className={"experiment-result " + (currentExperiment.id === "crisis" ? "crisis-result" : "")}>
                  <div className="experiment-head">
                    <small>INFJ ROUTE · {currentExperiment.id.toUpperCase()}</small>
                    <h3>{currentExperiment.title}</h3>
                    <p>{currentExperiment.route}</p>
                  </div>
                  {[
                    ["认知解码", currentExperiment.reading],
                    ["需要警惕", currentExperiment.trap],
                    ["可验证假设", currentExperiment.hypothesis],
                    ["最小行动", currentExperiment.action],
                    ["收集证据", currentExperiment.evidence],
                    ["更新规则", currentExperiment.update],
                  ].map((item, index) => (
                    <div className="experiment-step" key={item[0]}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div><small>{item[0]}</small><p>{item[1]}</p></div>
                    </div>
                  ))}
                </div>
              ) : <div className="experiment-empty"><span className="mini-label">FROM THOUGHT TO EVIDENCE</span><h3>让现实，参与这次判断。</h3><p>写下一个具体困惑。这里会给你一个可验证的假设、一小步行动和需要留意的现实证据。</p><div className="empty-path"><span>写下预测</span><span>执行小实验</span><span>记录现实</span></div></div>}
            </div>
          </div>
        </div>
      </section>

      <section className="workspace-panel content-section boundary-section" id="boundary" role="tabpanel" aria-labelledby="tab-boundary" hidden={activeSection !== "boundary"} tabIndex={0}>
        <SectionHeading
          number="05"
          eyebrow="BOUNDARY REHEARSAL"
          title="拒绝不是伤害关系。"
          copy="练习不靠牺牲自己来维持连接，并为对方继续施压做好准备。"
        />
        <div className="boundary-layout">
          <div className="boundary-form glass-card">
            <div className="form-top"><span>SCENARIO INPUT</span><i>FE → TI</i></div>
            <label htmlFor="relation">对方是谁？</label>
            <div className="relation-chips">
              {["同事", "领导", "朋友", "伴侣", "家人"].map((item) => (
                <button type="button" key={item} className={relation === item ? "active" : ""} onClick={() => { setRelation(item); setBoundaryGenerated(false); }}>{item}</button>
              ))}
            </div>
            <label htmlFor="request">对方希望你做什么？</label>
            <textarea id="request" value={boundaryRequest} onChange={(event) => { setBoundaryRequest(event.target.value); setBoundaryGenerated(false); }} placeholder="例如：同事临时把本该由他完成的工作交给我，希望我今晚帮忙收尾。" />
            <label htmlFor="fear">你最担心拒绝后发生什么？</label>
            <textarea id="fear" value={boundaryFear} onChange={(event) => setBoundaryFear(event.target.value)} placeholder="例如：担心他觉得我不够合作，之后在工作中为难我。" />
            <button className="primary-button" type="button" disabled={!boundaryRequest.trim()} onClick={generateBoundary}>生成边界表达 <span>↗</span></button>
            <p className="formula">看见处境 + 表达决定 + 可选替代 · 不必证明自己有资格拒绝</p>
          </div>
          <div className="boundary-output">
            {!boundaryGenerated ? (
              <div className="boundary-empty glass-card">
                <span>NO REHEARSAL YET</span>
                <div className="boundary-rings"><i /><i /><i /></div>
                <h3>你不是在学习<br />怎样把“不”说得更好听。</h3>
                <p>你是在学习：即使别人失望，你也不必立刻否定自己。</p>
              </div>
            ) : (
              <div className="boundary-results">
                {boundaryDrafts.map((draft, index) => (
                  <article className={"boundary-script glass-card " + (selectedBoundary === draft.text ? "saved" : "")} key={draft.label}>
                    <header><span>0{index + 1}</span><div><small>{draft.tag}</small><h4>{draft.label}</h4></div></header>
                    <blockquote>{draft.text}</blockquote>
                    <button type="button" onClick={() => setSelectedBoundary(draft.text)}>{selectedBoundary === draft.text ? "已保存到今日切片 ✓" : "保存这句话"}</button>
                  </article>
                ))}
                <button className="pressure-button" type="button" onClick={() => setBoundaryPressure((value) => !value)}>
                  {boundaryPressure ? "收起施压模拟" : "模拟对方继续施压"} <span>↘</span>
                </button>
                {boundaryPressure && (
                  <div className="pressure-dialogue glass-card">
                    <div className="pressure-line"><small>{relation}</small><p>“你以前都会帮我的，怎么这次这么计较？”</p></div>
                    <div className="reply-line"><small>你的回应</small><p>“我听见你对这个决定不满意，但我的答案不会改变。这次请你另外安排。”</p></div>
                    <div className="coach-note"><span>COACH</span> 这句话没有过度道歉，也没有重新打开讨价还价的空间。</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="workspace-panel full-section salon-section" id="salon" role="tabpanel" aria-labelledby="tab-salon" hidden={activeSection !== "salon"} tabIndex={0}>
        <div className="salon-light" aria-hidden="true" />
        <div className="salon-inner">
          <SectionHeading
            number="06"
            eyebrow="DEEP SALON"
            title="把同一个困惑，交给不同心灵。"
            copy="他们不替你决定，只从各自的思想脉络照亮你尚未看见的部分。"
          />
          <div className="salon-toolbar">
            <div><span>INVITED THINKERS</span><b>{selectedThinkers.length} / 3</b></div>
            <div className="salon-view-actions">
              {salonResponses.length > 0 && <button type="button" onClick={() => setSalonView(salonView === "guests" ? "conversation" : "guests")}>{salonView === "guests" ? "回到会谈 →" : "← 调整嘉宾"}</button>}
              <button type="button" onClick={() => { autoAssemble(); setSalonView("guests"); }}>替我组局 <span>✦</span></button>
            </div>
          </div>
          <div className="salon-selection" hidden={salonView === "conversation" && salonResponses.length > 0}>
          <div className="thinker-deck">
            {thinkers.map((thinker, index) => {
              const chosen = selectedThinkers.includes(thinker.id);
              return (
                <button
                  type="button"
                  key={thinker.id}
                  className={"thinker-card " + (chosen ? "selected" : "")}
                  onClick={() => toggleThinker(thinker.id)}
                  aria-pressed={chosen}
                  style={{ "--thinker-color": thinker.color, "--card-index": index, "--portrait-position": thinker.portraitPosition } as React.CSSProperties}
                >
                  <span className="thinker-number">0{index + 1}</span>
                  <div className="thinker-portrait">
                    <img src={`/portraits/${thinker.id}.webp`} alt={`${thinker.name}肖像`} width={600} height={800} loading="lazy" decoding="async" />
                  </div>
                  <div className="thinker-info"><span className="thinker-english">{thinker.en}</span><small>{thinker.field} · {thinker.years}</small><h3>{thinker.name}</h3><p>{thinker.tone}</p></div>
                  <span className="thinker-select">{chosen ? "已入席 ✓" : "邀请入席 ＋"}</span>
                </button>
              );
            })}
          </div>
          <details className="portrait-credits">
            <summary>肖像来源与许可</summary>
            <p>真实历史照片与画像，经缩小、格式转换及页面裁切／灰度呈现；采用 CC BY-SA 许可的图片，其图像衍生版本沿用对应许可。</p>
            <ul>{portraitCredits.map((credit) => <li key={credit.id}><a href={credit.sourcePage} target="_blank" rel="noopener noreferrer">{thinkers.find((thinker) => thinker.id === credit.id)?.name}</a> · {credit.author} · <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer">{credit.license}</a></li>)}</ul>
          </details>
          </div>
          <div className="salon-input glass-card">
            <div className="guest-stack">
              {salonGuests.map((thinker) => <span key={thinker.id} style={{ borderColor: thinker.color }} title={thinker.name}><img src={`/portraits/${thinker.id}.webp`} alt={thinker.name} width={32} height={32} loading="lazy" /></span>)}
              <small>已选择 {selectedThinkers.length} 位思想陪谈者</small>
            </div>
            <textarea
              value={salonQuestion}
              onChange={(event) => { setSalonQuestion(event.target.value); setSalonStarted(false); }}
              placeholder="把一个真实问题交给他们……"
              aria-label="深潜会客厅问题"
            />
            <button type="button" disabled={!salonQuestion.trim() || !selectedThinkers.length} onClick={() => { setSalonStarted(true); setSalonView("conversation"); }}>开始会谈 <span>↗</span></button>
          </div>
          {salonResponses.length > 0 && (
            <div className="salon-conversation" hidden={salonView !== "conversation"}>
              <header className="conversation-head">
                <div><span>YOU ARE LISTENING</span><h3>{salonGuests.map((thinker) => thinker.name).join(" × ")} 的讨论</h3></div>
                <p>“{salonQuestion.trim()}”</p>
              </header>
              <div className="conversation-grid">
                {salonResponses.map((response, index) => (
                  <article className="voice-card glass-card" key={response.thinker.id}>
                    <div className="voice-person">
                      <span style={{ borderColor: response.thinker.color }}><img src={`/portraits/${response.thinker.id}.webp`} alt="" width={44} height={44} loading="lazy" /></span>
                      <div><small>VOICE 0{index + 1}</small><h4>{response.thinker.name}</h4></div>
                    </div>
                    <p>{response.insight}</p>
                    <blockquote>{response.challenge}</blockquote>
                    <div className="leaving-question"><small>离席之问</small><b>{response.leaving}</b></div>
                  </article>
                ))}
              </div>
              <div className="salon-exit glass-card">
                <div><span>TAKE IT BACK TO REALITY</span><h4>不要把会谈停在理解里。</h4><p>选择一条离席之问，把它变成今天能验证的现实实验。</p></div>
                <button type="button" onClick={sendSalonToLab}>送进现实实验室 <span>→</span></button>
              </div>
              <p className="salon-disclaimer">以上内容是依据公开著作与思想脉络进行的风格化演绎，不代表人物原话，也不声称这些人物一定属于 INFJ。</p>
            </div>
          )}
        </div>
      </section>

      <section className="workspace-panel content-section archive-section" id="archive" role="tabpanel" aria-labelledby="tab-archive" hidden={activeSection !== "archive"} tabIndex={0}>
        <SectionHeading
          number="07"
          eyebrow="MIND ARCHIVE"
          title="让今天的混乱，留下可调用的证据。"
          copy="当天交互只保存在当前设备。你可以随时删除证据，并选择私人或安全分享版本。"
        />
        <div className="archive-layout">
          <div className="evidence-forest glass-card">
            <header>
              <div><span>EVIDENCE FOREST</span><h3>现实证据森林</h3></div>
              <b>{String(evidenceEntries.length).padStart(2, "0")}</b>
            </header>
            <p className="forest-intro">每次“担心过、行动过、实际发生过”，都会成为下一次旧回路出现时可以调用的证据。</p>
            <div className="forest-visual" aria-hidden="true">
              {Array.from({ length: Math.max(3, Math.min(12, evidenceEntries.length + 3)) }).map((_, index) => <i key={index} style={{ "--seed": index } as React.CSSProperties} />)}
            </div>
            <div className="evidence-list">
              {evidenceEntries.length === 0 ? (
                <div className="evidence-empty"><span>第一颗证据种子还没出现。</span><p>完成一次现实实验，再回来记录真实结果。</p></div>
              ) : evidenceEntries.slice(0, 4).map((entry) => (
                <article key={entry.id}>
                  <div><small>{entry.createdAt} · 预测 {entry.probability}%</small><h4>{entry.question || "一次现实实验"}</h4></div>
                  <p><span>担心</span>{entry.prediction}</p>
                  <p><span>现实</span>{entry.result}</p>
                  <button type="button" onClick={() => deleteEvidence(entry.id)} aria-label="删除这条证据">删除</button>
                </article>
              ))}
            </div>
            <p className="local-note"><span>●</span> 记录仅保存在当前浏览器，可逐条删除。</p>
          </div>
          <div className="daily-report glass-card">
            <div className="report-glow" aria-hidden="true" />
            <div className="report-top"><span>DAILY MIND SLICE</span><i>{todayShort}</i></div>
            <h3>今日心智切片</h3>
            <p>把状态扫描、边界练习、思想会谈与现实实验，浓缩成一张属于今天的长图。</p>
            <div className="report-preview">
              <span>MOKAFEE</span>
              <b>{currentDiagnosis ? "校准" : "观察"}</b>
              <small>把混乱保存成一次看得见的更新</small>
              <div><i /><i /><i /><i /></div>
            </div>
            <div className="report-mode">
              <button type="button" className={reportMode === "private" ? "active" : ""} onClick={() => setReportMode("private")}><span>私人珍藏版</span><small>保留具体困惑与完整内容</small></button>
              <button type="button" className={reportMode === "share" ? "active" : ""} onClick={() => setReportMode("share")}><span>安全分享版</span><small>隐藏原始问题与敏感细节</small></button>
            </div>
            <button className="report-button" type="button" onClick={generateReport}>生成今日心智切片 <span>↓</span></button>
            <div className="system-update"><small>SYSTEM UPDATE</small><p>{evidenceEntries.length ? "V0." + Math.min(9, evidenceEntries.length + 1) + "：开始让现实证据参与自我判断。" : "V0.1：允许自己暂时不知道答案。"}</p></div>
          </div>
        </div>
      </section>
      </div>
      <footer className="workspace-footer">
        <span>不是定义自己。是持续更新自己。</span>
        <span>记录保存在当前设备 · 用于自我观察，不替代专业帮助</span>
      </footer>

      {reportUrl && (
        <div className="report-modal" role="dialog" aria-modal="true" aria-label="今日心智切片预览">
          <button className="modal-backdrop" type="button" onClick={() => setReportUrl(null)} aria-label="关闭预览" />
          <div className="report-modal-card">
            <header><div><small>YOUR DAILY MIND SLICE</small><h3>今日心智切片已生成</h3></div><button type="button" onClick={() => setReportUrl(null)} aria-label="关闭">×</button></header>
            <div className="report-image-wrap"><img src={reportUrl} alt="今日心智切片预览" /></div>
            <div className="modal-actions"><p>PNG · 1080 × 1920</p><button type="button" onClick={downloadReport}>下载图片 <span>↓</span></button></div>
          </div>
        </div>
      )}
    </main>
  );
}
