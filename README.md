# Webgati AI

[![Chrome Web Store](https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/UV4C4ybeBTsZt43U4xis.png)](https://chrome.google.com/webstore/detail/webgati-ai/hcjdidnekngphjgllgajgebadfcapdkk)

**NOTE**: This AI-powered extension is under active development, please verify the results as necessary and provide feedback to help us improve.

Webgati AI is a Chrome & MS Edge browser extension for interactive web browsing. Whether you're researching, studying, or just exploring diverse content, Webgati AI is designed to efficiently guide you through webpages by providing quick summaries and answers directly from the content.

### Features

- Interactive Sidebar: Open a chat by clicking the extension icon, ask questions or seek summaries from any webpage effortlessly.

- Content Selection Dialog: Highlight text, and a dialog box will pop up to allow direct interaction with the content.

- Vision chat: Easily ask questions about the visual information on the page (images, graphs, etc.) by using the extension to take a screenshot or select an area of the page.

- Privacy-Focused: Using your own API key, your chat is directly sent to model provider's API, not to any other server, thus ensuring your data remains private and secure. (Currently OpenAI and Anthropic are supported, more model providers will be available soon including private local models)

- Open Source: Community-driven and transparent, allowing for continuous improvement and collective auditing.

### Roadmap

- Support for private local models
- Index and chat with entire website 
- Web agents for automated tasks

## DEMO

[Watch the demo](https://www.youtube.com/watch?v=OHT9CDmEctI)

## Local Setup

- `npm install`
- `npm run dev`
- Load the extension from `dist` folder using `Load unpacked` option in Chrome extensions ([instructions](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked))

## Tech/Frameworks

- Chrome extension - [CRXJS](https://crxjs.dev/vite-plugin/)
- AI/LLM - [LangChain](https://github.com/langchain-ai/langchainjs)
- UI - [Mantine](https://mantine.dev/)

## Feedback

Please provide feedback by creating an issue or sending an email to contact@webgatiai.com