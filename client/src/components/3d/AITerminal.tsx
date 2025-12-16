import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';

interface TerminalLine {
  type: 'input' | 'output' | 'system' | 'error';
  content: string;
}

interface AITerminalContentProps {
  windowId: string;
}

export function AITerminalContent({ windowId }: AITerminalContentProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'system', content: '◈ AETHER AI TERMINAL v0.2' },
    { type: 'system', content: '◈ Connected to Spatial Intelligence Engine' },
    { type: 'output', content: 'Type commands to control your environment.' },
    { type: 'output', content: 'Try: "create a note about my ideas"' },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addWindow = useStore((state) => state.addWindow);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userInput = input.trim();
    setInput('');
    setLines((prev) => [...prev, { type: 'input', content: `$ ${userInput}` }]);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput }),
      });

      const result = await response.json();

      if (result.error) {
        setLines((prev) => [...prev, { type: 'error', content: `Error: ${result.error}` }]);
      } else {
        // Show the AI's message
        if (result.message) {
          setLines((prev) => [...prev, { type: 'output', content: result.message }]);
        }

        // Execute the action
        switch (result.action) {
          case 'create_window':
            addWindow(
              result.windowType || 'notes',
              result.windowTitle || 'New Window',
              result.content || ''
            );
            setLines((prev) => [
              ...prev,
              { type: 'system', content: `◈ Created ${result.windowType} window: "${result.windowTitle}"` },
            ]);
            break;

          case 'change_theme':
            setLines((prev) => [
              ...prev,
              { type: 'system', content: `◈ Theme change to "${result.theme}" (visual effects coming soon)` },
            ]);
            break;

          case 'list_windows':
            const windows = useStore.getState().windows;
            setLines((prev) => [
              ...prev,
              { type: 'system', content: `◈ Open windows (${windows.length}):` },
              ...windows.map((w) => ({
                type: 'output' as const,
                content: `  • ${w.title} [${w.type}]`,
              })),
            ]);
            break;
        }
      }
    } catch (error) {
      setLines((prev) => [
        ...prev,
        { type: 'error', content: 'Failed to connect to AI service.' },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input':
        return 'text-cyan-400';
      case 'output':
        return 'text-white/80';
      case 'system':
        return 'text-purple-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-white/60';
    }
  };

  return (
    <div className="w-full h-full flex flex-col font-mono text-[11px] bg-black/30 rounded overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-1"
        style={{ maxHeight: '120px' }}
      >
        {lines.map((line, i) => (
          <div key={i} className={`${getLineColor(line.type)} leading-tight`}>
            {line.content}
          </div>
        ))}
        {isProcessing && (
          <div className="text-purple-400 animate-pulse">◈ Processing...</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-white/10 p-2">
        <div className="flex items-center gap-2">
          <span className="text-purple-400">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            className="flex-1 bg-transparent border-none outline-none text-cyan-400 placeholder-cyan-800 disabled:opacity-50"
            placeholder={isProcessing ? 'processing...' : 'type a command...'}
            data-testid={`input-ai-terminal-${windowId}`}
          />
        </div>
      </form>
    </div>
  );
}
