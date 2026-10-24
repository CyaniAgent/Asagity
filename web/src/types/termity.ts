/** Termity 终端行类型（输出缓冲的最小单元） */
export interface TerminalLine {
  type: "input" | "output" | "system" | "error" | "warning";
  text: string;
}
