class LLMService {
    constructor() {
        // Try to use the inline config first if available
        if (window.llmConfig) {
            console.log('Using inline config from HTML');
            this.config = window.llmConfig;
        } else {
            // Fallback to default config
            console.log('Using default hardcoded config');
            this.config = {
                llm: {
                    endpoint: "https://generativelanguage.googleapis.com",
                    api_key: "",
                    model: "gemini-2.5-flash",
                    temperature: 0.2,
                    system_prompt: "The user is student, He needs help in study. Given question in <question> blocks, provide answer in very short form in following format,\n\n<answer>\n<title> short title </title>\n<description> 2-3 main points </description>\n</answer>\n\nPlease summarize following text,"
                }
            };
        }
        
        // Load config from file and store it as a promise to ensure it's resolved before API calls
        this.configLoadPromise = this.loadConfig();
        
        // Check if we're running from the file system (which will cause CORS issues)
        if (window.location.protocol === 'file:') {
            console.warn('------------------------------------');
            console.warn('NOTE: Running directly from file:// may prevent loading config.json due to CORS restrictions.');
            console.warn('For best results, run using a local web server:');
            console.warn('- Python: python -m http.server');
            console.warn('- Node.js: npx http-server');
            console.warn('------------------------------------');
        }
        
        console.log('Initial config:', this.config);
        this.isInitialized = true;
    }

    async loadConfig() {
        try {
            console.log('Attempting to load LLM config from file...');
            try {
                const response = await fetch('config.json');
                if (!response.ok) {
                    throw new Error(`Failed to load config: ${response.status}`);
                }
                const loadedConfig = await response.json();
                
                // Only update if we got a valid config
                if (loadedConfig && loadedConfig.llm) {
                    console.log('LLM Config loaded successfully from file');
                    this.config = loadedConfig;
                    
                    // Log the API key (partially masked for security)
                    const apiKey = this.config.llm.api_key || '';
                    const maskedKey = apiKey.length > 8 
                        ? apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4)
                        : '(not set)';
                    console.log(`API key loaded from file: ${maskedKey}`);
                } else {
                    console.warn('Loaded config did not contain expected fields, using defaults');
                }
            } catch (fetchError) {
                // Check if this might be a CORS issue (common when opening HTML file directly)
                if (fetchError.message.includes('Failed to fetch') || 
                    fetchError.message.includes('CORS')) {
                    console.warn('Unable to load config.json, likely due to CORS when opening directly from file system. Using inline config instead.');
                } else {
                    console.error('Failed to load config from file:', fetchError);
                }
            }
        } catch (error) {
            console.error('Error in loadConfig:', error);
        }
        
        // Log final configuration state
        console.log('Current config:', this.config);
        
        // Make sure we have the API key from the inline config if the file load failed
        if ((!this.config.llm.api_key || this.config.llm.api_key === '') && 
            window.llmConfig && window.llmConfig.llm && window.llmConfig.llm.api_key) {
            console.log('Using API key from inline config as fallback');
            this.config.llm.api_key = window.llmConfig.llm.api_key;
        }
        
        // Return the config to allow chaining/awaiting
        return this.config;
    }

    async generateAnswer(question, context = null) {
        // Wait for config to load from file if it's still loading
        if (this.configLoadPromise) {
            console.log("Waiting for config to load before generating answer");
            await this.configLoadPromise;
            this.configLoadPromise = null; // Clear after first use
        }
        
        if (!this.config || !this.config.llm) {
            console.error("Config not properly initialized");
            throw new Error("Configuration not properly initialized");
        }

        const { endpoint, api_key, model, temperature, system_prompt, followup_prompt } = this.config.llm;

        // Validate API key
        if (!api_key || api_key === "add_key_here" || api_key === "" || api_key === "YOUR_API_KEY_HERE") {
            console.error("API key is missing or invalid in config. Checking if inline config has a key...");
            // Try to use the API key from window.llmConfig as a fallback
            if (window.llmConfig && window.llmConfig.llm && window.llmConfig.llm.api_key) {
                const inlineKey = window.llmConfig.llm.api_key;
                if (inlineKey && inlineKey !== "add_key_here" && inlineKey !== "" && inlineKey !== "YOUR_API_KEY_HERE") {
                    console.log("Using API key from inline config instead");
                    api_key = inlineKey;
                } else {
                    console.error("API key missing or invalid. Check one of these sources:");
                    console.error("1. config.json file (preferred)");
                    console.error("2. Inline configuration in index.html");
                    console.error("3. Use demo.html to input your API key directly");
                    
                    if (window.location.protocol === 'file:') {
                        throw new Error("API key is missing and you're running from the file system (file://). Try using demo.html or run with a local web server to avoid CORS issues.");
                    } else {
                        throw new Error("API key is missing. Please add your API key to config.json or use demo.html");
                    }
                }
            } else {
                console.error("API key missing or invalid. Check one of these sources:");
                console.error("1. config.json file (preferred)");
                console.error("2. Inline configuration in index.html");
                console.error("3. Use demo.html to input your API key directly");
                
                if (window.location.protocol === 'file:') {
                    throw new Error("API key is missing and you're running from the file system (file://). Try using demo.html or run with a local web server to avoid CORS issues.");
                } else {
                    throw new Error("API key is missing. Please add your API key to config.json or use demo.html");
                }
            }
        }

        // Choose prompt based on whether context is provided
        let promptTemplate;
        let fullPrompt;
        
        if (context) {
            // This is a followup question with context
            promptTemplate = followup_prompt || system_prompt;
            fullPrompt = `${promptTemplate}\n\n<context>\n${context}\n</context>\n\n<question>\n${question}\n</question>`;
            console.log("Using followup prompt with context:", context);
        } else {
            // This is a regular question without context
            promptTemplate = system_prompt;
            fullPrompt = `${promptTemplate}\n\n<question>\n${question}\n</question>`;
            console.log("Using standard prompt without context");
        }

        console.log(`Sending request to Gemini API: ${endpoint}/v1beta/models/${model}:generateContent`);
        
        // Gemini API request format
        const requestPayload = {
            contents: [
                {
                    parts: [
                        {
                            text: fullPrompt
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: temperature
            }
        };
        
        console.log("Request payload:", requestPayload);
            
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
            
        try {
            // Special test mode
            if (question.toLowerCase() === "test") {
                return { 
                    title: "Test Response", 
                    description: "This is a hardcoded test response to verify parsing works."
                };
            }
            
            // Make the request to the Gemini API with a 60 second timeout
            // Check if the endpoint already contains the full path
            const apiUrl = endpoint.includes(':generateContent') 
                ? `${endpoint}?key=${api_key}` 
                : `${endpoint}/v1beta/models/${model}:generateContent?key=${api_key}`;
            
            // Mask API key in logs
            const maskedApiKey = api_key.length > 8 
                ? api_key.substring(0, 4) + '...' + api_key.substring(api_key.length - 4)
                : '(not set)';
            console.log(`Making API request with masked API key: ${maskedApiKey}`);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestPayload),
                signal: controller.signal
            });
                
            clearTimeout(timeoutId);
            
            console.log("Response status:", response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API error: ${response.status}`, errorText);
                
                // Provide more specific error messages based on status codes
                if (response.status === 403) {
                    throw new Error(`API key error (403): Your API key may be invalid or doesn't have permission for this model. Check your API key in config.json.`);
                } else if (response.status === 404) {
                    throw new Error(`Endpoint not found (404): The API endpoint or model specified doesn't exist. Check your endpoint URL and model name in config.json.`);
                } else if (response.status === 429) {
                    throw new Error(`Rate limit exceeded (429): You've exceeded your API quota or rate limit. Consider upgrading your API plan.`);
                } else {
                    throw new Error(`API error ${response.status}: ${errorText}`);
                }
            }

            const data = await response.json();
            console.log("Full response data:", data);
            
            // Extract text from Gemini API response
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
                console.error("Invalid response structure:", data);
                throw new Error("Invalid response structure from Gemini API");
            }
            
            const rawAnswer = data.candidates[0].content.parts[0].text;
            console.log("Gemini response content:", rawAnswer);

            // Parse the answer from the format
            return this.parseAnswer(rawAnswer);

        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Error generating answer:', error);
            if (error.name === 'AbortError') {
                throw new Error('Request timed out after 60 seconds');
            }
            throw error; // Rethrow to be handled by the calling code
        }
    }

    parseAnswer(rawAnswer) {
        // For testing, if question is "test" or there was an error, return a hard-coded result
        if (rawAnswer === "__TEST__") {
            console.log("Using test mode response");
            return {
                title: "Whey Protein",
                description: "1. High-quality protein source derived from milk\n2. Contains all essential amino acids\n3. Used for muscle recovery and growth"
            };
        }
        
        // If we somehow got a null or undefined answer, handle gracefully
        if (!rawAnswer) {
            console.error("Received null/undefined response");
            return {
                title: "Error Processing Response",
                description: "The API returned an empty response. Please try again or check API configuration."
            };
        }
        
        try {
            console.log("Raw answer to parse:", rawAnswer);
            
            // First, try to extract content between <answer> tags
            const answerMatch = rawAnswer.match(/<answer>([\s\S]*?)<\/answer>/);
            console.log("Answer match:", answerMatch);
            
            if (!answerMatch) {
                console.log("No <answer> tags found, trying direct extraction");
                // If no <answer> tags, try to extract directly
                // Look for any title and description patterns
                const directTitleMatch = rawAnswer.match(/<title>([\s\S]*?)<\/title>/);
                const directDescMatch = rawAnswer.match(/<description>([\s\S]*?)<\/description>/);
                console.log("Direct title match:", directTitleMatch);
                console.log("Direct description match:", directDescMatch);
                
                if (directTitleMatch) {
                    // We found title tags directly
                    const title = directTitleMatch[1].trim();
                    const description = directDescMatch ? directDescMatch[1].trim() : 'No description provided.';
                    console.log("Extracted title:", title);
                    console.log("Extracted description:", description);
                    return { title, description };
                }
                
                // Handle possible newline issues
                console.log("Looking for possible newline issues in tags");
                // Try with flexible matching for newlines
                const flexTitleMatch = rawAnswer.match(/<title>([^<]+)<\/title>/i);
                const flexDescMatch = rawAnswer.match(/<description>([\s\S]*?)<\/description>/i);
                
                if (flexTitleMatch) {
                    console.log("Found title with flexible match:", flexTitleMatch[1]);
                    const title = flexTitleMatch[1].trim();
                    const description = flexDescMatch ? flexDescMatch[1].trim() : 'No description provided.';
                    console.log("Flexible extraction - Title:", title);
                    console.log("Flexible extraction - Description:", description);
                    return { title, description };
                }
                
                // Fallback: Use the first line as title, rest as description
                const lines = rawAnswer.split('\n').filter(line => line.trim().length > 0);
                if (lines.length > 0) {
                    const title = lines[0].trim();
                    const description = lines.slice(1).join('\n').trim() || 'No additional details provided.';
                    console.log("Fallback using lines - Title:", title);
                    console.log("Fallback using lines - Description:", description);
                    return { title, description };
                }
                
                // Last resort
                console.log("Using last resort fallback for Whey Protein");
                return {
                    title: 'Whey Protein',
                    description: rawAnswer.trim() || 'A dietary supplement used to increase protein intake.'
                };
            }
            
            console.log("Found answer tags, extracting content");
            const answerContent = answerMatch[1].trim();
            console.log("Answer content:", answerContent);
            
            // Extract title
            const titleMatch = answerContent.match(/<title>([\s\S]*?)<\/title>/i);
            const title = titleMatch ? titleMatch[1].trim() : 'No Title';
            console.log("Extracted title:", title);
            
            // Extract description
            const descMatch = answerContent.match(/<description>([\s\S]*?)<\/description>/i);
            const description = descMatch ? descMatch[1].trim() : 'No description provided.';
            console.log("Extracted description:", description);
            
            return { title, description };
        } catch (error) {
            console.error('Error parsing answer:', error);
            return {
                title: 'Parsing Error',
                description: 'Could not properly parse the LLM response. Raw response: ' + 
                    (rawAnswer ? rawAnswer.substring(0, 100) + '...' : 'None')
            };
        }
    }
}

// Create a global instance
window.llmService = new LLMService();
