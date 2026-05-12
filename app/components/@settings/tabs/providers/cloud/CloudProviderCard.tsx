import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@nanostores/react';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { cn } from '~/utils/cn';
import { Switch } from '~/components/ui/Switch';
import { getApiKeysFromCookies } from '~/components/chat/APIKeyManager';
import { envKeyStatusStore, preferredModelsStore, updatePreferredModel } from '~/lib/stores/settings';
import { encryptApiKeyValue, isEncryptedValue } from '~/lib/api/encrypt-value';
import type { IProviderConfig } from '~/types/model';
import type { ModelInfo } from '~/lib/modules/llm/types';

interface CloudProviderCardProps {
  provider: IProviderConfig;
  index: number;
  onToggle: (provider: IProviderConfig, enabled: boolean) => void;
  iconClass: string;
  description: string;
}

export function CloudProviderCard({ provider, index, onToggle, iconClass, description }: CloudProviderCardProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testError, setTestError] = useState('');
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelsExpanded, setModelsExpanded] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  const envKeyStatus = useStore(envKeyStatusStore) ?? {};
  const providerEnvStatus = envKeyStatus[provider.name];
  const hasEnvKey = providerEnvStatus?.hasEnvKey ?? false;

  const preferredModels = useStore(preferredModelsStore);
  const selectedModel = preferredModels[provider.name] || '';

  const hasAnyKey = hasKey || hasEnvKey;

  const isOpenRouter = provider.name === 'OpenRouter';

  const freeModelCount = useMemo(() => models.filter((m) => m.isFree).length, [models]);

  const filteredModels = useMemo(() => {
    let list = models;

    if (showFreeOnly) {
      list = list.filter((m) => m.isFree);
    }

    if (modelSearch.trim()) {
      const q = modelSearch.toLowerCase();
      list = list.filter(
        (m) => m.name.toLowerCase().includes(q) || (m.label || '').toLowerCase().includes(q),
      );
    }

    return list;
  }, [models, showFreeOnly, modelSearch]);

  useEffect(() => {
    const keys = getApiKeysFromCookies();
    const existing = keys[provider.name] || '';

    if (existing && isEncryptedValue(existing)) {
      setApiKey('');
      setHasKey(true);
    } else {
      setApiKey(existing);
      setHasKey(existing.length > 0);
    }
  }, [provider.name]);

  const fetchModels = useCallback(async () => {
    setLoadingModels(true);

    try {
      const response = await fetch(`/api/models/${encodeURIComponent(provider.name)}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as { modelList?: ModelInfo[] };
      const fetchedModels = data.modelList ?? [];

      const allModels = [...provider.staticModels, ...fetchedModels];
      const uniqueModels = allModels.filter((model, idx, arr) => arr.findIndex((m) => m.name === model.name) === idx);

      setModels(uniqueModels);
    } catch {
      // Silently fail for auto-fetch
    } finally {
      setLoadingModels(false);
    }
  }, [provider.name, provider.staticModels]);

  useEffect(() => {
    if (provider.settings.enabled && hasAnyKey && models.length === 0 && !loadingModels) {
      fetchModels();
    }
  }, [provider.settings.enabled, hasAnyKey, fetchModels]);

  const savePreferredModel = useCallback(
    (modelName: string) => {
      updatePreferredModel(provider.name, modelName);
      toast.success(`Preferred model for ${provider.name} set to ${modelName}`);
    },
    [provider.name],
  );

  const saveApiKey = useCallback(
    async (value: string) => {
      try {
        const raw = Cookies.get('apiKeys');
        let parsed: Record<string, string> = {};

        if (raw) {
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = {};
          }
        }

        if (value.trim()) {
          const encrypted = await encryptApiKeyValue(value.trim());
          parsed[provider.name] = encrypted;
          setHasKey(true);
        } else if (!hasKey) {
          delete parsed[provider.name];
          setHasKey(false);
        }

        Cookies.set('apiKeys', JSON.stringify(parsed), {
          secure: window.location.protocol === 'https:',
          sameSite: 'strict',
          expires: 30,
        });
      } catch {
        toast.error('Failed to save API key');
      }
    },
    [provider.name, hasKey],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (apiKey.trim()) {
          saveApiKey(apiKey);
          toast.success(`API key for ${provider.name} saved`);
        }
      }
    },
    [apiKey, saveApiKey, provider.name],
  );

  const handleBlur = useCallback(() => {
    if (!apiKey && hasKey) {
      return;
    }

    saveApiKey(apiKey);
  }, [apiKey, hasKey, saveApiKey]);

  const testConnection = useCallback(async () => {
    if (!apiKey.trim() && !hasEnvKey) {
      toast.error('Please enter an API key first');
      return;
    }

    if (apiKey.trim()) {
      await saveApiKey(apiKey);
    }

    setTesting(true);
    setTestResult(null);
    setTestError('');
    setModels([]);

    try {
      const response = await fetch(`/api/models/${encodeURIComponent(provider.name)}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as { modelList?: ModelInfo[] };
      const fetchedModels = data.modelList ?? [];

      const allModels = [...provider.staticModels, ...fetchedModels];
      const uniqueModels = allModels.filter((model, idx, arr) => arr.findIndex((m) => m.name === model.name) === idx);

      setModels(uniqueModels);
      setTestResult('success');
      setModelsExpanded(true);
      toast.success(`${provider.name}: ${uniqueModels.length} model(s) available`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setTestResult('error');
      setTestError(message);
      toast.error(`${provider.name}: ${message}`);
    } finally {
      setTesting(false);
    }
  }, [apiKey, hasEnvKey, provider.name, provider.staticModels, saveApiKey]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        'rounded-lg border border-veyra-elements-borderColor',
        'bg-veyra-elements-background-depth-2',
        'hover:bg-veyra-elements-background-depth-3',
        'transition-all duration-200',
        'p-4',
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              iconClass,
              'w-6 h-6',
              provider.settings.enabled
                ? 'text-veyra-elements-item-contentAccent'
                : 'text-veyra-elements-textSecondary',
            )}
          />
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm font-medium',
                provider.settings.enabled
                  ? 'text-veyra-elements-item-contentAccent'
                  : 'text-veyra-elements-textPrimary',
              )}
            >
              {provider.name}
            </span>
            <span
              className={cn(
                'inline-block w-2 h-2 rounded-full flex-shrink-0',
                hasKey ? 'bg-green-500' : hasEnvKey ? 'bg-blue-500' : 'bg-gray-500',
              )}
              title={hasKey ? 'API key set' : hasEnvKey ? 'Server env key' : 'No API key'}
            />
          </div>
        </div>
        <Switch
          checked={provider.settings.enabled ?? false}
          onCheckedChange={(checked) => onToggle(provider, checked)}
        />
      </div>

      {description && <p className="mt-1.5 ml-9 text-xs text-veyra-elements-textSecondary">{description}</p>}

      {provider.settings.enabled && !hasAnyKey && (
        <div className="mt-1.5 ml-9 flex items-center gap-1.5 text-xs text-amber-400">
          <div className="i-ph:warning w-3.5 h-3.5 flex-shrink-0" />
          <span>Enabled without an API key — add a key for this provider to work</span>
        </div>
      )}

      {hasEnvKey && !hasKey && (
        <div className="mt-1.5 ml-9 flex items-center gap-1.5 text-xs text-blue-400">
          <div className="i-ph:server w-3.5 h-3.5 flex-shrink-0" />
          <span>Server API key configured via environment variable</span>
        </div>
      )}

      {/* API Key input section */}
      <div className="mt-3 ml-9 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              autoComplete="off"
              spellCheck={false}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={`Enter ${provider.name} API key`}
              className={cn(
                'w-full px-3 py-1.5 pr-9 rounded-md text-sm',
                'bg-veyra-elements-background-depth-1',
                'border border-veyra-elements-borderColor',
                'text-veyra-elements-textPrimary',
                'placeholder-veyra-elements-textTertiary',
                'focus:outline-none focus:ring-2 focus:ring-veyra-elements-borderColorActive',
              )}
            />
            <button
              type="button"
              onClick={() => setShowKey((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none p-0 cursor-pointer text-veyra-elements-textSecondary hover:text-veyra-elements-textPrimary"
              title={showKey ? 'Hide key' : 'Show key'}
            >
              <div className={cn(showKey ? 'i-ph:eye-slash' : 'i-ph:eye', 'w-4 h-4')} />
            </button>
          </div>

          <button
            type="button"
            onClick={testConnection}
            disabled={testing}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap',
              'bg-transparent border border-veyra-elements-borderColor',
              'text-veyra-elements-textSecondary',
              'hover:text-veyra-elements-item-contentAccent hover:border-veyra-elements-borderColorActive',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-150',
            )}
          >
            {testing ? (
              <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
            ) : testResult === 'success' ? (
              <div className="i-ph:check-circle w-4 h-4 text-green-500" />
            ) : testResult === 'error' ? (
              <div className="i-ph:x-circle w-4 h-4 text-red-500" />
            ) : (
              <div className="i-ph:plugs-connected w-4 h-4" />
            )}
            Test
          </button>
        </div>

        {provider.getApiKeyLink && !hasKey && (
          <a
            href={provider.getApiKeyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-veyra-elements-item-contentAccent hover:underline"
          >
            <div className="i-ph:arrow-square-out w-3 h-3" />
            {provider.labelForGetApiKey || 'Get API Key'}
          </a>
        )}

        <AnimatePresence>
          {testResult === 'error' && testError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-red-400"
            >
              {testError}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Model list */}
        <AnimatePresence>
          {models.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {/* Header row: count + filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setModelsExpanded((prev) => !prev)}
                  className={cn(
                    'flex items-center gap-1.5 text-xs bg-transparent border-none p-0 cursor-pointer',
                    'text-veyra-elements-textSecondary hover:text-veyra-elements-item-contentAccent',
                    'transition-colors duration-150',
                  )}
                >
                  <div
                    className={cn(
                      'i-ph:caret-right w-3 h-3 transition-transform duration-200',
                      modelsExpanded && 'rotate-90',
                    )}
                  />
                  <span className="text-green-500 font-medium">{models.length}</span>
                  <span>model{models.length !== 1 ? 's' : ''} available</span>
                  {selectedModel && (
                    <span className="ml-1 text-veyra-elements-item-contentAccent">— using {selectedModel}</span>
                  )}
                </button>

                {/* Free-only toggle (shown for providers that have free models) */}
                {isOpenRouter && freeModelCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowFreeOnly((prev) => !prev);
                      setModelsExpanded(true);
                    }}
                    className={cn(
                      'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors duration-150',
                      showFreeOnly
                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                        : 'bg-transparent border-veyra-elements-borderColor text-veyra-elements-textTertiary hover:text-green-400 hover:border-green-500/50',
                    )}
                    title={showFreeOnly ? 'Show all models' : 'Show free models only'}
                  >
                    <div className="i-ph:gift w-3 h-3" />
                    Free only
                    {showFreeOnly && <span className="ml-0.5">({freeModelCount})</span>}
                  </button>
                )}
              </div>

              {/* Expanded model list */}
              <AnimatePresence>
                {modelsExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1.5 overflow-hidden"
                  >
                    {/* Search input */}
                    <div className="relative mb-1.5">
                      <div className="i-ph:magnifying-glass absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-veyra-elements-textTertiary" />
                      <input
                        type="text"
                        placeholder="Search models..."
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        className={cn(
                          'w-full pl-6 pr-3 py-1.5 rounded-md text-xs',
                          'bg-veyra-elements-background-depth-1',
                          'border border-veyra-elements-borderColor',
                          'text-veyra-elements-textPrimary',
                          'placeholder-veyra-elements-textTertiary',
                          'focus:outline-none focus:ring-1 focus:ring-veyra-elements-borderColorActive',
                        )}
                      />
                      {modelSearch && (
                        <button
                          type="button"
                          onClick={() => setModelSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none p-0 cursor-pointer text-veyra-elements-textTertiary hover:text-veyra-elements-textPrimary"
                        >
                          <div className="i-ph:x w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Result count when filtering */}
                    {(modelSearch || showFreeOnly) && (
                      <p className="text-xs text-veyra-elements-textTertiary mb-1">
                        {filteredModels.length} of {models.length} model{models.length !== 1 ? 's' : ''}
                        {showFreeOnly ? ' (free)' : ''}
                        {modelSearch ? ` matching "${modelSearch}"` : ''}
                      </p>
                    )}

                    <div
                      className={cn(
                        'max-h-[300px] overflow-y-auto rounded-md p-2',
                        'bg-veyra-elements-background-depth-1',
                        'border border-veyra-elements-borderColor',
                      )}
                    >
                      {filteredModels.length === 0 ? (
                        <p className="text-xs text-veyra-elements-textTertiary text-center py-3">
                          No models match your search
                        </p>
                      ) : (
                        filteredModels.map((model) => (
                          <button
                            type="button"
                            key={model.name}
                            onClick={() => savePreferredModel(model.name)}
                            className={cn(
                              'w-full flex items-center gap-2 py-1.5 px-2 rounded text-left',
                              'text-xs cursor-pointer border-none',
                              'transition-colors duration-100',
                              selectedModel === model.name
                                ? 'bg-veyra-elements-item-backgroundAccent text-veyra-elements-item-contentAccent'
                                : 'bg-transparent text-veyra-elements-textSecondary hover:bg-veyra-elements-background-depth-2',
                            )}
                          >
                            <div
                              className={cn(
                                'w-3 h-3 flex-shrink-0',
                                selectedModel === model.name
                                  ? 'i-ph:check-circle-fill text-veyra-elements-item-contentAccent'
                                  : 'i-ph:circle text-veyra-elements-textTertiary',
                              )}
                            />
                            {model.isFree && (
                              <span className="flex-shrink-0 text-green-400 text-[10px] font-medium bg-green-400/10 px-1 rounded">
                                FREE
                              </span>
                            )}
                            <span className="truncate">{model.label || model.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {loadingModels && (
          <div className="flex items-center gap-1.5 text-xs text-veyra-elements-textTertiary">
            <div className="i-ph:spinner-gap w-3 h-3 animate-spin" />
            <span>Loading models...</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
