import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user

// Only initialize OpenAI if API key is available
let openai: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface AetherCommand {
  action: 'create_window' | 'remove_window' | 'change_theme' | 'list_windows' | 'message' | 'unknown';
  windowType?: 'terminal' | 'notes' | 'browser' | 'settings';
  windowTitle?: string;
  content?: string;
  theme?: 'night' | 'day' | 'cosmic';
  message?: string;
}

const SYSTEM_PROMPT = `You are the Aether OS AI Assistant - an intelligent terminal embedded in a 3D spatial operating system.
You can execute commands to control the environment:

Available actions:
1. create_window: Create a new floating window (types: terminal, notes, browser, settings)
2. remove_window: Close windows (not yet implemented - just acknowledge)
3. change_theme: Change the visual theme (night, day, cosmic)
4. list_windows: List currently open windows
5. message: Just respond with a message/information

When users ask you to do something, respond with JSON containing:
{
  "action": "<action_name>",
  "windowType": "<type if creating window>",
  "windowTitle": "<title for the window>",
  "content": "<content to put in window>",
  "theme": "<theme name if changing>",
  "message": "<your response to the user>"
}

Examples:
- "create a note about my project" -> { "action": "create_window", "windowType": "notes", "windowTitle": "My Project", "content": "Project notes...", "message": "Created a new note window for your project." }
- "what can you do?" -> { "action": "message", "message": "I can create windows, manage your workspace, and help you organize your spatial environment." }
- "switch to night mode" -> { "action": "change_theme", "theme": "night", "message": "Switching to night mode..." }

Always be helpful and explain what you're doing. Keep responses concise.`;

export async function processAetherCommand(userMessage: string): Promise<AetherCommand> {
  if (!openai) {
    return {
      action: 'message',
      message: 'AI assistant is not configured. Please add your OPENAI_API_KEY secret to enable intelligent commands.'
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      action: result.action || 'message',
      windowType: result.windowType,
      windowTitle: result.windowTitle,
      content: result.content,
      theme: result.theme,
      message: result.message || 'Command processed.'
    };
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    return {
      action: 'message',
      message: `Error processing command: ${error.message}`
    };
  }
}
