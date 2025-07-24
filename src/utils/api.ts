export async function callOpenAICompatibleAPI(provider: string, apiKey: string, prompt: string) {
    const apiDetails = {
        openai: { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o' },
        deepseek: { url: 'https://api.deepseek.com/chat/completions', model: 'deepseek-chat' },
        kimi: { url: 'https://api.moonshot.cn/v1/chat/completions', model: 'kimi-k2-0711-preview' }
    };

    const { url, model } = apiDetails[provider as keyof typeof apiDetails];

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: model,
            messages: [{ "role": "user", "content": prompt }],
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}. 详情: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
}

export async function callGeminiAPI(apiKey: string, prompt: string) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}. 详情: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    return JSON.parse(content);
} 