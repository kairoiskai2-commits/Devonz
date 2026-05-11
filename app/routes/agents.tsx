import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Header } from '~/components/header/Header';

export const loader = () => Response.json({});

interface Agent {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  model?: string;
  provider?: string;
  avatar: string;
  skills: string[];
  isPublic: boolean;
  createdAt: string;
}

interface Skill {
  id: string;
  name: string;
  description?: string;
  instructions: string;
  category: string;
  isBuiltin: boolean;
}

const PROVIDER_OPTIONS = [
  { value: 'Pollinations', label: 'Pollinations (Free — no API key)' },
  { value: 'Puter', label: 'Puter (Free — no API key)' },
  { value: 'OpenAILike', label: 'Custom endpoint (bring your own)' },
  { value: 'OpenRouter', label: 'OpenRouter (API key required)' },
  { value: 'OpenAI', label: 'OpenAI (API key required)' },
  { value: 'Anthropic', label: 'Anthropic (API key required)' },
  { value: 'Google', label: 'Google (API key required)' },
];

const MODELS_BY_PROVIDER: Record<string, Array<{ value: string; label: string }>> = {
  Pollinations: [
    { value: 'openai', label: 'OpenAI (best general — free)' },
    { value: 'openai-large', label: 'OpenAI Large (free)' },
    { value: 'claude', label: 'Claude (free)' },
    { value: 'claude-large', label: 'Claude Large (free)' },
    { value: 'claude-opus-4.7', label: 'Claude Opus 4.7 (free)' },
    { value: 'gemini', label: 'Gemini (free)' },
    { value: 'gemini-large', label: 'Gemini Large (free)' },
    { value: 'deepseek', label: 'DeepSeek (free)' },
    { value: 'deepseek-pro', label: 'DeepSeek Pro (free)' },
    { value: 'qwen-coder', label: 'Qwen Coder (best coding — free)' },
    { value: 'qwen-coder-large', label: 'Qwen Coder Large (free)' },
    { value: 'llama', label: 'Llama (free)' },
    { value: 'mistral-large', label: 'Mistral Large (free)' },
    { value: 'grok', label: 'Grok (free)' },
    { value: 'grok-large', label: 'Grok Large (free)' },
  ],
  Puter: [
    { value: 'claude-opus-4-5', label: 'Claude Opus 4.5 (free)' },
    { value: 'gpt-4o', label: 'GPT-4o (free)' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (free)' },
  ],
  OpenAILike: [
    { value: 'claude-opus-4-7', label: 'Claude Opus 4.7' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'smart-chat', label: 'Custom model' },
  ],
  OpenRouter: [
    { value: 'anthropic/claude-opus-4-5', label: 'Claude Opus 4.5' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'openai/gpt-4o', label: 'GPT-4o' },
    { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'deepseek/deepseek-coder', label: 'DeepSeek Coder' },
    { value: 'qwen/qwen-2.5-coder-32b-instruct', label: 'Qwen 2.5 Coder 32B' },
  ],
  OpenAI: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'o3-mini', label: 'o3-mini' },
  ],
  Anthropic: [
    { value: 'claude-opus-4-5-20251101', label: 'Claude Opus 4.5' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
  ],
  Google: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  ],
};

const CODING_TEMPLATES = [
  {
    label: '💻 Full-Stack Coder',
    prompt: `You are an expert full-stack software engineer specializing in building complete, production-ready applications. You excel at:
- Writing clean, maintainable TypeScript/JavaScript code
- Building React frontends with modern patterns (hooks, context, Suspense)
- Designing RESTful APIs and server-side logic
- Database schema design and query optimization
- Testing, debugging, and code review

Always produce working, complete code. Explain your architectural decisions. Follow best practices for security, performance, and maintainability. When asked to build something, deliver fully functional code—not pseudocode or placeholders.`,
  },
  {
    label: '🤖 ML/AI Trainer',
    prompt: `You are an expert machine learning engineer and AI trainer specializing in:
- Designing and training neural networks (PyTorch, TensorFlow, JAX)
- Fine-tuning large language models (LoRA, QLoRA, full fine-tuning)
- Data pipeline design, preprocessing, and augmentation
- Model evaluation, hyperparameter tuning, and optimization
- Deployment of ML models (ONNX, TorchScript, Triton, vLLM)
- Experiment tracking (MLflow, Weights & Biases)

Provide working training scripts, explain model architectures clearly, and guide on compute/resource requirements. Always give practical, runnable code examples.`,
  },
  {
    label: '🔍 Code Reviewer',
    prompt: `You are a senior software engineer conducting thorough code reviews. You focus on:
- Security vulnerabilities and injection risks
- Performance bottlenecks and algorithmic complexity
- Code readability, naming conventions, and structure
- Test coverage and edge cases
- Design patterns and SOLID principles
- Dependency risks and version compatibility

Be constructive, specific, and actionable. Provide corrected code snippets when suggesting improvements. Prioritize critical issues over stylistic preferences.`,
  },
  {
    label: '🐛 Debugger',
    prompt: `You are an expert debugger and problem-solver. You systematically:
- Analyze error messages, stack traces, and logs
- Identify root causes rather than symptoms
- Reproduce issues methodically
- Apply fixes that don't introduce new problems
- Explain what went wrong and why

Ask for relevant context (error messages, code snippets, environment info) when needed. Walk through your debugging process step by step.`,
  },
];

const BUILTIN_SKILLS: Skill[] = [
  {
    id: 'builtin-typescript',
    name: 'TypeScript First',
    description: 'Always use TypeScript with strict types',
    instructions:
      'Always write TypeScript with strict type annotations. Prefer interfaces over types. Never use `any`. Always annotate function parameters and return types.',
    category: 'coding',
    isBuiltin: true,
  },
  {
    id: 'builtin-tailwind',
    name: 'Tailwind CSS',
    description: 'Use Tailwind CSS for all styling',
    instructions:
      'Use Tailwind CSS utility classes for all styling. Never write custom CSS unless absolutely necessary. Use responsive design with mobile-first breakpoints.',
    category: 'styling',
    isBuiltin: true,
  },
  {
    id: 'builtin-dark-mode',
    name: 'Dark Mode First',
    description: 'Design for dark mode first',
    instructions:
      'Design all UIs with dark mode as the primary theme. Use dark backgrounds (gray-900, slate-900), light text, and colored accents. Always ensure good contrast ratios.',
    category: 'design',
    isBuiltin: true,
  },
  {
    id: 'builtin-tests',
    name: 'Include Tests',
    description: 'Write tests for all logic',
    instructions:
      'Write unit tests for all business logic using Vitest. Aim for meaningful test coverage. Test edge cases and error paths. Do not test implementation details, test behavior.',
    category: 'quality',
    isBuiltin: true,
  },
  {
    id: 'builtin-comments',
    name: 'Well Documented',
    description: 'Add JSDoc comments to all functions',
    instructions:
      'Add JSDoc comments to all functions, classes, and complex logic. Explain the "why" not just the "what". Document parameters, return values, and thrown exceptions.',
    category: 'quality',
    isBuiltin: true,
  },
  {
    id: 'builtin-accessibility',
    name: 'Accessibility',
    description: 'Build accessible UIs (WCAG 2.1 AA)',
    instructions:
      'Always build accessible UIs. Use semantic HTML elements. Add ARIA labels where needed. Ensure keyboard navigation works. Maintain 4.5:1 contrast ratio for text.',
    category: 'quality',
    isBuiltin: true,
  },
  {
    id: 'builtin-performance',
    name: 'Performance Focus',
    description: 'Optimize for speed and efficiency',
    instructions:
      'Optimize all code for performance. Use React.memo, useMemo, useCallback where beneficial. Lazy-load heavy components. Avoid unnecessary re-renders. Use virtualization for long lists.',
    category: 'performance',
    isBuiltin: true,
  },
  {
    id: 'builtin-mobile',
    name: 'Mobile Responsive',
    description: 'Ensure all UIs work on mobile',
    instructions:
      'Make all UIs fully responsive and mobile-first. Touch targets must be at least 44x44px. Use responsive typography. Test layouts at 375px, 768px, and 1280px widths.',
    category: 'design',
    isBuiltin: true,
  },
  {
    id: 'builtin-ml-pytorch',
    name: 'PyTorch Expert',
    description: 'Write idiomatic PyTorch training code',
    instructions:
      'Use PyTorch for all deep learning code. Write proper Dataset/DataLoader classes. Use torch.compile and mixed precision (torch.amp) when applicable. Always include proper model.train()/model.eval() calls. Save/load checkpoints correctly with state_dict.',
    category: 'ml',
    isBuiltin: true,
  },
  {
    id: 'builtin-ml-finetune',
    name: 'LLM Fine-tuning',
    description: 'Fine-tune language models with LoRA/QLoRA',
    instructions:
      'Use HuggingFace transformers and PEFT library for LLM fine-tuning. Prefer QLoRA for memory efficiency. Set up proper tokenization, data collators, and TrainingArguments. Track experiments with Weights & Biases. Always specify target modules for LoRA adapters.',
    category: 'ml',
    isBuiltin: true,
  },
  {
    id: 'builtin-git-workflow',
    name: 'Git Best Practices',
    description: 'Follow conventional commits and branching',
    instructions:
      'Use conventional commits (feat:, fix:, chore:, docs:, refactor:). Create feature branches from main. Write meaningful commit messages. Keep PRs small and focused. Always review diffs before committing.',
    category: 'workflow',
    isBuiltin: true,
  },
  {
    id: 'builtin-security',
    name: 'Security Hardened',
    description: 'Always write secure, hardened code',
    instructions:
      'Validate and sanitize all user inputs. Never expose secrets in client code. Use parameterized queries to prevent SQL injection. Set appropriate CORS, CSP, and security headers. Hash passwords with bcrypt/argon2. Use HTTPS everywhere.',
    category: 'security',
    isBuiltin: true,
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  coding: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  styling: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  design: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  quality: 'bg-green-500/15 text-green-400 border-green-500/20',
  performance: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  ml: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  workflow: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  security: 'bg-red-500/15 text-red-400 border-red-500/20',
  custom: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
};

const AVATAR_OPTIONS = ['🤖', '🧠', '⚡', '🎯', '🔮', '🦾', '🚀', '💡', '🎨', '🔬', '🛡️', '🌟', '🐍', '⚙️', '🧪', '🏋️'];

function AgentModal({
  agent,
  availableSkills,
  onClose,
  onSave,
}: {
  agent?: Agent | null;
  availableSkills: Skill[];
  onClose: () => void;
  onSave: (data: Partial<Agent>) => Promise<void>;
}) {
  const [name, setName] = useState(agent?.name ?? '');
  const [description, setDescription] = useState(agent?.description ?? '');
  const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt ?? '');
  const [avatar, setAvatar] = useState(agent?.avatar ?? '🤖');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(agent?.skills ?? []);
  const [isPublic, setIsPublic] = useState(agent?.isPublic ?? false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'basic' | 'model' | 'skills'>('basic');
  const [selectedProvider, setSelectedProvider] = useState(agent?.provider ?? 'Pollinations');
  const [selectedModel, setSelectedModel] = useState(agent?.model ?? 'openai');

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) => (prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId]));
  };

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    const models = MODELS_BY_PROVIDER[provider];
    if (models && models.length > 0) {
      setSelectedModel(models[0].value);
    } else {
      setSelectedModel('');
    }
  };

  const applyTemplate = (prompt: string) => {
    setSystemPrompt(prompt);
    toast.success('Template applied');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !systemPrompt.trim()) {
      toast.error('Name and system prompt are required');
      return;
    }

    setSaving(true);

    try {
      await onSave({
        name,
        description,
        systemPrompt,
        avatar,
        skills: selectedSkills,
        isPublic,
        provider: selectedProvider || undefined,
        model: selectedModel || undefined,
      });
      onClose();
    } catch {
      toast.error('Failed to save agent');
    } finally {
      setSaving(false);
    }
  };

  const selectedSkillDetails = availableSkills.filter((s) => selectedSkills.includes(s.id));
  const skillInstructions = selectedSkillDetails.map((s) => s.instructions).join('\n\n');
  const fullPrompt = systemPrompt + (skillInstructions ? '\n\n' + skillInstructions : '');
  const availableModels = MODELS_BY_PROVIDER[selectedProvider] ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-veyra-elements-background-depth-1 border border-veyra-elements-borderColor rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-veyra-elements-borderColor">
          <h2 className="text-lg font-semibold text-veyra-elements-textPrimary">
            {agent ? 'Edit Agent' : 'Create Agent'}
          </h2>
          <button
            onClick={onClose}
            className="text-veyra-elements-textTertiary hover:text-veyra-elements-textPrimary transition-colors"
          >
            <div className="i-ph:x w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-veyra-elements-borderColor">
          {(['basic', 'model', 'skills'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? 'text-veyra-elements-item-contentAccent border-b-2 border-veyra-elements-item-contentAccent'
                  : 'text-veyra-elements-textSecondary hover:text-veyra-elements-textPrimary'
              }`}
            >
              {t === 'model' ? 'Provider & Model' : t}
              {t === 'skills' && selectedSkills.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-veyra-elements-item-contentAccent/20 text-veyra-elements-item-contentAccent">
                  {selectedSkills.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          {tab === 'basic' && (
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium text-veyra-elements-textSecondary mb-2">Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
                      className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${
                        avatar === emoji
                          ? 'bg-veyra-elements-item-contentAccent/20 border-2 border-veyra-elements-item-contentAccent scale-110'
                          : 'bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor hover:border-veyra-elements-item-contentAccent/50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-veyra-elements-textSecondary mb-1.5">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Code Reviewer, ML Trainer..."
                  className="w-full px-3 py-2 bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor rounded-lg text-sm text-veyra-elements-textPrimary placeholder-veyra-elements-textTertiary focus:outline-none focus:border-veyra-elements-item-contentAccent transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-veyra-elements-textSecondary mb-1.5">
                  Description
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what this agent does..."
                  className="w-full px-3 py-2 bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor rounded-lg text-sm text-veyra-elements-textPrimary placeholder-veyra-elements-textTertiary focus:outline-none focus:border-veyra-elements-item-contentAccent transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-veyra-elements-textSecondary">
                    System Prompt <span className="text-red-400">*</span>
                  </label>
                  <span className="text-xs text-veyra-elements-textTertiary">or use a template ↓</span>
                </div>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="You are a specialized AI assistant that..."
                  rows={6}
                  className="w-full px-3 py-2 bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor rounded-lg text-sm text-veyra-elements-textPrimary placeholder-veyra-elements-textTertiary focus:outline-none focus:border-veyra-elements-item-contentAccent transition-colors resize-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-veyra-elements-textSecondary mb-2">
                  Quick Templates
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CODING_TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => applyTemplate(t.prompt)}
                      className="text-left px-3 py-2 rounded-lg bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor hover:border-veyra-elements-item-contentAccent/50 text-xs text-veyra-elements-textSecondary hover:text-veyra-elements-textPrimary transition-all"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-2 px-3 bg-veyra-elements-background-depth-2 rounded-lg border border-veyra-elements-borderColor">
                <div>
                  <div className="text-sm text-veyra-elements-textPrimary">Make Public</div>
                  <div className="text-xs text-veyra-elements-textTertiary">Visible to all users on this platform</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${isPublic ? 'bg-veyra-elements-item-contentAccent' : 'bg-veyra-elements-background-depth-3'}`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>

              {selectedSkills.length > 0 && (
                <div className="p-3 bg-veyra-elements-background-depth-2 rounded-lg border border-veyra-elements-borderColor">
                  <div className="text-xs font-medium text-veyra-elements-textSecondary mb-2">
                    Preview: Effective System Prompt
                  </div>
                  <pre className="text-xs text-veyra-elements-textTertiary whitespace-pre-wrap max-h-32 overflow-y-auto font-mono leading-relaxed">
                    {fullPrompt}
                  </pre>
                </div>
              )}
            </div>
          )}

          {tab === 'model' && (
            <div className="p-6 space-y-5">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 leading-relaxed">
                <span className="font-semibold">Tip:</span> The provider and model selected here will be used when chatting with this agent. Make sure your API key for the selected provider is configured in Settings.
              </div>

              <div>
                <label className="block text-xs font-medium text-veyra-elements-textSecondary mb-1.5">
                  Provider
                </label>
                <select
                  value={selectedProvider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full px-3 py-2 bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor rounded-lg text-sm text-veyra-elements-textPrimary focus:outline-none focus:border-veyra-elements-item-contentAccent transition-colors"
                >
                  {PROVIDER_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {selectedProvider === 'OpenRouter' && (
                  <p className="mt-1.5 text-xs text-veyra-elements-textTertiary">
                    OpenRouter gives access to 300+ models through a single API key.{' '}
                    <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noreferrer" className="text-veyra-elements-item-contentAccent hover:underline">
                      Get your key →
                    </a>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-veyra-elements-textSecondary mb-1.5">
                  Model
                </label>
                {availableModels.length > 0 ? (
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor rounded-lg text-sm text-veyra-elements-textPrimary focus:outline-none focus:border-veyra-elements-item-contentAccent transition-colors"
                  >
                    {availableModels.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    placeholder="Enter model name (e.g. gpt-4o)"
                    className="w-full px-3 py-2 bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor rounded-lg text-sm text-veyra-elements-textPrimary placeholder-veyra-elements-textTertiary focus:outline-none focus:border-veyra-elements-item-contentAccent transition-colors"
                  />
                )}
              </div>

              {selectedModel && (
                <div className="p-3 rounded-lg bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor">
                  <div className="text-xs font-medium text-veyra-elements-textSecondary mb-1">Selected</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-veyra-elements-item-contentAccent/15 text-veyra-elements-item-contentAccent border border-veyra-elements-item-contentAccent/30 font-mono">
                      {selectedProvider}
                    </span>
                    <span className="text-xs text-veyra-elements-textTertiary">→</span>
                    <span className="text-xs px-2 py-1 rounded bg-veyra-elements-background-depth-3 text-veyra-elements-textPrimary border border-veyra-elements-borderColor font-mono">
                      {selectedModel}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor">
                <div className="text-xs font-medium text-veyra-elements-textSecondary mb-2">Best models for coding</div>
                <div className="space-y-1.5">
                  {[
                    { name: 'Claude Opus 4.5', via: 'OpenRouter', id: 'anthropic/claude-opus-4-5', badge: '🏆 Best' },
                    { name: 'Claude 3.5 Sonnet', via: 'OpenRouter', id: 'anthropic/claude-3.5-sonnet', badge: '⚡ Fast' },
                    { name: 'DeepSeek Coder', via: 'OpenRouter', id: 'deepseek/deepseek-coder', badge: '💰 Budget' },
                    { name: 'Qwen 2.5 Coder 32B', via: 'OpenRouter', id: 'qwen/qwen-2.5-coder-32b-instruct', badge: '🔓 Open' },
                  ].map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => {
                        setSelectedProvider(rec.via);
                        setSelectedModel(rec.id);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-veyra-elements-background-depth-3 hover:bg-veyra-elements-item-contentAccent/10 border border-transparent hover:border-veyra-elements-item-contentAccent/30 transition-all text-left"
                    >
                      <div>
                        <span className="text-xs font-medium text-veyra-elements-textPrimary">{rec.name}</span>
                        <span className="text-xs text-veyra-elements-textTertiary ml-1.5">via {rec.via}</span>
                      </div>
                      <span className="text-xs text-veyra-elements-textTertiary">{rec.badge}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'skills' && (
            <div className="p-6">
              <p className="text-xs text-veyra-elements-textSecondary mb-4">
                Skills add extra instructions to your agent's system prompt. Select the capabilities you want.
              </p>
              <div className="grid gap-3">
                {availableSkills.map((skill) => {
                  const selected = selectedSkills.includes(skill.id);
                  const colorClass = CATEGORY_COLORS[skill.category] ?? CATEGORY_COLORS.custom;

                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                        selected
                          ? 'bg-veyra-elements-item-contentAccent/10 border-veyra-elements-item-contentAccent'
                          : 'bg-veyra-elements-background-depth-2 border-veyra-elements-borderColor hover:border-veyra-elements-item-contentAccent/50'
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected ? 'bg-veyra-elements-item-contentAccent border-veyra-elements-item-contentAccent' : 'border-veyra-elements-borderColor'}`}
                      >
                        {selected && <div className="i-ph:check w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-veyra-elements-textPrimary">{skill.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${colorClass}`}>
                            {skill.category}
                          </span>
                          {skill.isBuiltin && (
                            <span className="text-xs px-1.5 py-0.5 rounded border bg-veyra-elements-background-depth-3 text-veyra-elements-textTertiary border-veyra-elements-borderColor">
                              built-in
                            </span>
                          )}
                        </div>
                        {skill.description && (
                          <p className="text-xs text-veyra-elements-textTertiary">{skill.description}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-veyra-elements-borderColor">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-veyra-elements-textSecondary hover:text-veyra-elements-textPrimary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium bg-veyra-elements-button-primary-background text-veyra-elements-button-primary-text rounded-lg hover:bg-veyra-elements-button-primary-backgroundHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <div className="i-svg-spinners:90-ring-with-bg w-4 h-4" />}
            {agent ? 'Save Changes' : 'Create Agent'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AgentsPage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [skills, setSkills] = useState<Skill[]>(BUILTIN_SKILLS);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents', { credentials: 'include' });
      const json = await res.json();

      if (json.success) {
        setAgents(json.data.agents);
      }
    } catch {
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch('/api/agent-skills', { credentials: 'include' });
      const json = await res.json();

      if (json.success) {
        const serverSkills = json.data.skills.filter((s: Skill) => !s.isBuiltin);
        setSkills([...BUILTIN_SKILLS, ...serverSkills]);
      }
    } catch {
      // keep builtin skills
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    fetchSkills();
  }, [fetchAgents, fetchSkills]);

  const handleSaveAgent = async (data: Partial<Agent>) => {
    if (editingAgent) {
      const res = await fetch(`/api/agents/${editingAgent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message ?? 'Failed to update agent');
      }

      setAgents((prev) => prev.map((a) => (a.id === editingAgent.id ? json.data.agent : a)));
      toast.success('Agent updated');
    } else {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message ?? 'Failed to create agent');
      }

      setAgents((prev) => [json.data.agent, ...prev]);
      toast.success('Agent created');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    try {
      const res = await fetch(`/api/agents/${id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();

      if (json.success) {
        setAgents((prev) => prev.filter((a) => a.id !== id));
        toast.success('Agent deleted');
      } else {
        toast.error('Failed to delete agent');
      }
    } catch {
      toast.error('Failed to delete agent');
    } finally {
      setDeletingId(null);
    }
  };

  const openCreateModal = () => {
    setEditingAgent(null);
    setShowModal(true);
  };

  const openEditModal = (agent: Agent) => {
    setEditingAgent(agent);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAgent(null);
  };

  const chatWithAgent = (agent: Agent) => {
    navigate(`/?agentId=${agent.id}`);
  };

  return (
    <div className="flex flex-col h-full bg-veyra-elements-background-depth-1 text-veyra-elements-textPrimary">
      <Header />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-veyra-elements-textPrimary">Custom Agents</h1>
              <p className="mt-1 text-sm text-veyra-elements-textSecondary">
                Create personalized AI agents with custom prompts, models, and skills
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-veyra-elements-button-primary-background text-veyra-elements-button-primary-text rounded-lg text-sm font-medium hover:bg-veyra-elements-button-primary-backgroundHover transition-colors"
            >
              <div className="i-ph:plus-bold w-4 h-4" />
              New Agent
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="i-svg-spinners:90-ring-with-bg text-2xl text-veyra-elements-textTertiary" />
            </div>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor flex items-center justify-center mb-4">
                <div className="i-ph:robot text-3xl text-veyra-elements-textTertiary" />
              </div>
              <h3 className="text-base font-medium text-veyra-elements-textPrimary mb-2">No agents yet</h3>
              <p className="text-sm text-veyra-elements-textSecondary max-w-sm mb-6">
                Create your first custom agent with a unique personality, model, expertise, and skills.
              </p>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-veyra-elements-button-primary-background text-veyra-elements-button-primary-text rounded-lg text-sm font-medium hover:bg-veyra-elements-button-primary-backgroundHover transition-colors"
              >
                <div className="i-ph:plus-bold w-4 h-4" />
                Create your first agent
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {agents.map((agent) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor rounded-xl p-5 flex flex-col gap-4 hover:border-veyra-elements-item-contentAccent/40 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-veyra-elements-background-depth-3 flex items-center justify-center text-xl shrink-0 border border-veyra-elements-borderColor">
                        {agent.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-veyra-elements-textPrimary truncate">{agent.name}</h3>
                          {agent.isPublic && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 shrink-0">
                              public
                            </span>
                          )}
                        </div>
                        {agent.description && (
                          <p className="text-xs text-veyra-elements-textTertiary mt-0.5 line-clamp-2">
                            {agent.description}
                          </p>
                        )}
                        {(agent.provider || agent.model) && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {agent.provider && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-veyra-elements-item-contentAccent/10 text-veyra-elements-item-contentAccent border border-veyra-elements-item-contentAccent/20">
                                {agent.provider}
                              </span>
                            )}
                            {agent.model && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-veyra-elements-background-depth-3 text-veyra-elements-textTertiary border border-veyra-elements-borderColor font-mono truncate max-w-[120px]">
                                {agent.model.split('/').pop() ?? agent.model}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {agent.skills && agent.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {agent.skills.slice(0, 3).map((skillId) => {
                          const skill = skills.find((s) => s.id === skillId);

                          if (!skill) return null;

                          const colorClass = CATEGORY_COLORS[skill.category] ?? CATEGORY_COLORS.custom;

                          return (
                            <span key={skillId} className={`text-xs px-1.5 py-0.5 rounded border ${colorClass}`}>
                              {skill.name}
                            </span>
                          );
                        })}
                        {agent.skills.length > 3 && (
                          <span className="text-xs px-1.5 py-0.5 rounded border bg-veyra-elements-background-depth-3 text-veyra-elements-textTertiary border-veyra-elements-borderColor">
                            +{agent.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1 border-t border-veyra-elements-borderColor">
                      <button
                        onClick={() => chatWithAgent(agent)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-veyra-elements-item-contentAccent hover:bg-veyra-elements-item-contentAccent/10 rounded-lg transition-colors"
                      >
                        <div className="i-ph:chat-circle w-3.5 h-3.5" />
                        Chat
                      </button>
                      <button
                        onClick={() => openEditModal(agent)}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-veyra-elements-textSecondary hover:text-veyra-elements-textPrimary hover:bg-veyra-elements-background-depth-3 rounded-lg transition-colors"
                      >
                        <div className="i-ph:pencil w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        disabled={deletingId === agent.id}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === agent.id ? (
                          <div className="i-svg-spinners:90-ring-with-bg w-3.5 h-3.5" />
                        ) : (
                          <div className="i-ph:trash w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <AgentModal
            agent={editingAgent}
            availableSkills={skills}
            onClose={closeModal}
            onSave={handleSaveAgent}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
