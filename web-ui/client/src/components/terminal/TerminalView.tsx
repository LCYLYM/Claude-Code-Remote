import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { wsService } from '../../services/websocket';
import '@xterm/xterm/css/xterm.css';

interface TerminalViewProps {
  sessionId: string;
  active: boolean;
}

export default function TerminalView({ sessionId, active }: TerminalViewProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
      theme: {
        background: '#0f172a',
        foreground: '#f1f5f9',
        cursor: '#10b981',
        cursorAccent: '#0f172a',
        selection: 'rgba(255, 255, 255, 0.3)',
        black: '#1e293b',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#f1f5f9',
        brightBlack: '#475569',
        brightRed: '#f87171',
        brightGreen: '#34d399',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#f8fafc',
      },
      scrollback: 10000,
      rows: 30,
      cols: 120,
    });

    // Add addons
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(new WebLinksAddon());

    // Mount terminal
    terminal.open(terminalRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Handle terminal input
    terminal.onData((data) => {
      if (active) {
        wsService.sendTerminalInput(sessionId, data);
      }
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
      wsService.resizeTerminal(sessionId, terminal.cols, terminal.rows);
    };

    window.addEventListener('resize', handleResize);

    // Handle terminal output from WebSocket
    const unsubscribe = wsService.on('terminal_output', (outputData) => {
      if (outputData.sessionId === sessionId) {
        terminal.write(outputData.data);
      }
    });

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribe();
      terminal.dispose();
    };
  }, [sessionId]);

  // Handle active state changes
  useEffect(() => {
    const terminal = terminalInstanceRef.current;
    if (!terminal) return;

    if (!active) {
      terminal.write('\r\n\x1b[33m[Session is inactive. Click Start to activate]\x1b[0m\r\n');
    }
  }, [active]);

  return (
    <div className="h-full p-4 bg-slate-950 dark:bg-black">
      <div
        ref={terminalRef}
        className="terminal-container h-full rounded-lg overflow-hidden shadow-lg"
      />
    </div>
  );
}
