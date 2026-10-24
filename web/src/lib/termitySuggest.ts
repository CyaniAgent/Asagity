/**
 * Termity 指令预测（类 zsh-autosuggestions / fish autosuggestions）。
 *
 * 策略对标 zsh-autosuggestions 的 `history` 策略：
 *   zsh 源码 `src/strategies/history.zsh`：
 *     local pattern="$prefix*"
 *     typeset -g suggestion="${history[(r)$pattern]}"
 *   即：取「以当前输入为前缀」的历史条目中最新的那一条作为整条建议，
 *   实际展示的只有 BUFFER 之后的剩余部分（POSTDISPLAY="${suggestion#$BUFFER}"）。
 *
 * 与 zsh 的差异：
 * - zsh 默认在输入框上直接显示建议，本实现由 UI 层以内联「幽灵文本」渲染。
 * - zsh 匹配大小写敏感（`$prefix*`），此处保持一致。
 */

/** 建议的最小输入长度：与 zsh 一样，空输入不产生建议 */
const MIN_BUFFER_LENGTH = 1;

/** 单条建议的最大长度保护（避免超长历史项撑爆 UI） */
const MAX_SUGGESTION_LENGTH = 512;

/**
 * 从历史中找出最合适的建议（整条命令）。
 * 规则：由新到旧遍历，首个「以 buffer 为前缀且有剩余部分」的条目即命中。
 */
export function findHistorySuggestion(
  history: readonly string[],
  buffer: string,
): string | null {
  if (buffer.trim().length < MIN_BUFFER_LENGTH) return null;
  if (buffer.length > MAX_SUGGESTION_LENGTH) return null;

  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    if (!entry) continue;
    if (entry.length <= buffer.length) continue;
    if (!entry.startsWith(buffer)) continue;
    return entry;
  }
  return null;
}

/** 取建议中未被输入覆盖的剩余部分（即 zsh 的 POSTDISPLAY） */
export function suggestionSuffix(suggestion: string, buffer: string): string {
  if (!suggestion.startsWith(buffer)) return "";
  return suggestion.slice(buffer.length);
}

/**
 * 部分接受（类 zsh `autosuggest-accept-word`）：
 * 只补齐下一个「词」——到下一个空白为止。
 */
export function acceptWord(suggestion: string, buffer: string): string {
  const suffix = suggestionSuffix(suggestion, buffer);
  if (!suffix) return buffer;
  const match = suffix.match(/^\S+\s*/);
  if (!match) return suggestion;
  return buffer + match[0];
}
