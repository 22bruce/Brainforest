# Brainforest 🧠🌳

An interactive mind mapping tool that uses Large Language Models (LLMs) to help generate content for your mind maps. Create, edit, and organize topics with AI-assisted content generation.

Brainforest combines the visual power of mind maps with the intelligence of AI to help you explore ideas, study topics, and organize knowledge in an intuitive tree-like structure.

## What Makes Brainforest Special

🌳 **Full Branch Context**: Unlike traditional mind mapping tools that only consider parent-child relationships, Brainforest provides the AI with the complete path from the root topic down to the current node. This means when you're creating a deep subtopic, the AI understands the entire context hierarchy.

🧠 **Intelligent Responses**: The AI doesn't just see "protein → whey protein", it sees the full journey: "nutrition → protein → whey protein → benefits → muscle building" - providing much more relevant and connected responses.

🎯 **Smart Paragraphs**: Responses are delivered as coherent, readable paragraphs rather than bullet points, making your mind map more natural to read and understand.

## Features

### Core Brainforest Features

- **Create Topics and Subtopics**: Build hierarchical mind maps with multiple levels
- **Interactive Canvas**: Pan, zoom, and drag nodes to organize your thoughts
- **Visual Hierarchy**: Different node sizes and colors for different levels
- **Export**: Save your mind map as a PNG image
- **Context-Aware AI**: Full branch context from root to current node for better AI responses
- **Editable Main Topic**: Edit the central/root topic of your mind map
- **Custom Model Configuration**: Add your own LLM endpoints and API keys through the UI

### AI-Assisted Content Generation

- **LLM Integration**: Ask questions and get AI-generated content for your nodes
- **Multiple LLM Support**: Configure different LLM providers and models through the "Add Model" feature
- **Full Branch Context**: Unlike simple parent-child relationships, Brainforest provides the entire branch context from root to current node for more intelligent AI responses
- **Context-Aware Responses**: When creating subtopics, the LLM considers the complete hierarchy path
- **Customizable Prompts**: Configure how the LLM responds via the config file
- **Visual Context Feedback**: See the complete tree context information being used for generating content
- **Smart Paragraphs**: AI responses are formatted as coherent paragraphs instead of bullet points for better readability

## Getting Started

### Prerequisites

- A modern web browser
- Access to an LLM API (Gemini API by default)

### Installation

1. Clone or download the Brainforest repository
2. **Copy the config template**: Copy `config.template.json` to `config.json`
3. **Configure your LLM**: You have two options:
   - **Option A (Recommended)**: Use the "Add Model" button in the UI after opening the app
   - **Option B**: Manually edit `config.json` and replace `ADD_YOUR_API_KEY_HERE` with your actual API key
4. **Get a Gemini API Key**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and create a new API key
5. **Never commit config.json**: The file is already in `.gitignore` to prevent accidental API key exposure
6. Open `index.html` in a web browser or use a local web server:

   For Python users:

   ```bash
   # Python 3
   python -m http.server
   # Python 2
   python -m SimpleHTTPServer
   ```
   
   For Node.js users:

   ```bash
   # Install http-server if you don't have it
   npm install -g http-server
   # Start the server
   http-server
   ```

## How to Use

### Basic Navigation

- **Pan**: Click and drag on empty space
- **Zoom**: Use mouse wheel to zoom in/out
- **Select a Node**: Click on any node to select it
- **Move a Node**: Click and drag a node to reposition it

### Creating and Editing Content

#### Adding a Custom LLM Model

1. Click the "Add Model" button in the top toolbar
2. In the modal dialog that appears:
   - **Endpoint URL**: Enter the API endpoint (e.g., `https://generativelanguage.googleapis.com`)
   - **API Key**: Enter your API key (this will be stored securely in your browser)
   - **Model Name**: Enter the model name (e.g., `gemini-2.5-flash`)
3. Click "Save Configuration" to test and save your settings
4. The configuration will be stored locally and used for all future AI interactions

> **Security Note**: API keys are stored only in your browser's local storage and never transmitted to our servers.

#### Adding a New Subtopic

1. Select a parent node by clicking on it
2. Either:
   - Click the "+" button on the node
   - Right-click the node and select "Add Subtopic" from the context menu
3. In the modal dialog that appears:
   - Note the context box showing what parent node you're adding to
   - Toggle "Show Tree Context" to see the complete branch hierarchy from root to current node
   - This full context helps the AI generate more relevant and connected responses
   - Enter your question in the text area
4. Click "Ask" to generate content using the LLM
5. A new node will appear with the AI-generated content

#### Editing a Topic

1. Select a node by clicking on it
2. Right-click and select "Edit" from the context menu
3. Modify the text in the dialog that appears
4. Click "Ask" to save changes (no LLM call is made when editing)

> **Note**: Unlike previous versions, the main (root) topic can now be edited

#### Deleting a Topic

1. Select a node by clicking on it
2. Right-click and select "Delete" from the context menu
3. The node and all its children will be removed

> **Note**: The main (root) topic cannot be deleted

#### Using Markdown in Topics

You can format text in your nodes using markdown syntax:

- **Bold**: Wrap text with double asterisks `**bold text**`
- **Italic**: Wrap text with single asterisks `*italic text*`
- **Bullet Lists**: Start lines with a dash and space `- list item`
- **Numbered Lists**: Start lines with a number, period, and space `1. numbered item`
- **Headers**: Use hashtags `# Header` (level depends on number of hashtags)
- **Code**: Wrap with backticks `` `code` ``

The markdown formatting will be rendered when displaying the node in the mind map.

### Exporting Your Mind Map

1. Click the "Export" button in the toolbar
2. The mind map will be saved as a PNG image

## Configuration

### Easy Configuration (Recommended)

The easiest way to configure your LLM is through the built-in "Add Model" feature:

1. Open the application in your browser
2. Click the "Add Model" button in the top toolbar
3. Enter your LLM provider details:
   - **Endpoint**: The API endpoint URL
   - **API Key**: Your API key from your LLM provider
   - **Model**: The specific model name to use
4. Click "Save Configuration" to test and store your settings

This method stores your configuration securely in your browser's local storage and automatically validates that your settings work.

### Manual Configuration

Alternatively, you can configure the LLM integration through the `config.json` file:

```json
{
    "llm": {
        "endpoint": "https://generativelanguage.googleapis.com",
        "api_key": "ADD_YOUR_API_KEY_HERE",
        "model": "gemini-2.5-flash",
        "temperature": 0.2,
        "system_prompt": "The prompt for the main topics...",
        "followup_prompt": "The prompt for subtopics with context..."
    }
}
```

### Configuration Options

- **endpoint**: The API endpoint for the LLM service
- **api_key**: Your API key for the LLM service (required - obtain from your LLM provider)
- **model**: The model name to use
- **temperature**: Controls randomness (0.0-1.0; lower is more deterministic)
- **system_prompt**: The prompt template for main topics
- **followup_prompt**: The prompt template for subtopics with context

> **Important**: You must add your own API key to the `config.json` file for the application to work. For Google Gemini, you can get an API key from the [Google AI Studio](https://makersuite.google.com/app/apikey).

### Customizing the Appearance

You can customize the appearance of the mind map by editing the `styles.css` file:

- Change the node colors by modifying the `mainColors` array in the `MindMapNode` class
- Adjust node sizes by changing the `minWidth`, `minHeight`, and `padding` values
- Modify the background by updating the body background style in CSS
- Change fonts, colors, and animations to match your preferences

### Supported Models

#### Google Gemini Models

```json
"model": "gemini-2.5-flash"  // Fast, efficient responses
"model": "gemini-2.5-pro"    // More capable for complex topics
"model": "gemini-1.5-pro"    // Legacy model
```

#### Using Other LLM Providers

Brainforest supports various LLM providers through the "Add Model" feature:

##### Google Gemini (Default)

- **Endpoint**: `https://generativelanguage.googleapis.com`
- **Models**: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-1.5-pro`
- **API Key**: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)

##### OpenAI

- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Models**: `gpt-4`, `gpt-3.5-turbo`, etc.
- **API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)

##### Anthropic Claude

- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Models**: `claude-3-opus`, `claude-3-sonnet`, etc.
- **API Key**: Get from [Anthropic Console](https://console.anthropic.com/)

> **Note**: While the UI allows you to configure any endpoint, some providers may require modifications to the request format in `llm-service.js` for full compatibility. The current implementation is optimized for Google Gemini's API format.

## Prompt Format

The system includes two types of prompts:

1. **system_prompt**: Used for initial questions without context
2. **followup_prompt**: Used when creating subtopics, includes context from the parent node

Both prompts should produce output in this format:

```xml
<answer>
<title>Short Title</title>
<description>Main points about the topic</description>
</answer>
```

## Example Use Cases with Brainforest

### Educational Deep Dive

1. Create a main topic "Ancient Rome"
2. Add subtopics by asking questions like:
   - "What were the main periods of Ancient Rome?"
   - "Who were important Roman leaders?"
   - "What was Roman culture like?"
3. For each subtopic, add more detailed nodes - **Brainforest remembers the full path**, so asking about "Julius Caesar's military campaigns" under "Leaders → Julius Caesar" will get responses that understand the full educational context

### Project Planning with Context

1. Create a main topic with your project name
2. Add subtopics for different project aspects:
   - "What are the main milestones?"
   - "What resources are needed?"
   - "What are potential risks?"
3. When you drill down into specific areas, Brainforest's AI understands the complete project context, not just the immediate parent topic

### Building a Knowledge Forest

1. Start with a broad topic you want to learn about
2. Ask general questions to build the first level
3. Drill down with more specific questions as subtopics
4. **The deeper you go, the smarter Brainforest gets** - each new question benefits from the entire branch context

## Browser Compatibility

The mind map application has been tested and works well with:

- Google Chrome (recommended)
- Mozilla Firefox
- Microsoft Edge
- Safari

For the best experience, use the latest version of your preferred browser.

## Troubleshooting

- **API Errors**: Check that your API key is correct and has sufficient permissions
- **No Response**: Ensure your internet connection is stable
- **Invalid Responses**: If the LLM isn't following the format, try adjusting your prompts
- **Performance Issues**: Try reducing the complexity of your mind map or using a faster LLM model
- **CORS Issues**:
  - If you see errors like "API key is missing" despite adding it to config.json, you're likely experiencing CORS restrictions
  - When opening the HTML file directly from the filesystem (using file:// protocol), browsers block access to local files for security reasons
  - Always use a local web server as described in the Installation section (python -m http.server or npx http-server)
  - Look for CORS warnings in the browser console (F12) for more details
- **Markdown Rendering Issues**:
  - If markdown formatting appears incorrect, ensure you're using supported syntax
  - For bullet lists, make sure to start each line with "- " (dash followed by space)

## Credits

This application uses:

- Vanilla JavaScript for the mind map functionality
- Google's Gemini API for LLM integration (default)
